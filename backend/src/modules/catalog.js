import { Router } from 'express';
import { z } from 'zod';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { productSchema, stylistSchema } from '@maison/contracts';
import { HttpError, parse, send } from '../http.js';
import { transaction } from '../db.js';
import { requireUser, requireTeam } from './auth.js';

export function getProduct(db, id) {
  const row = db.prepare('SELECT data, revision FROM products WHERE id=?').get(id);
  if (!row) return null;
  return {
    ...JSON.parse(row.data),
    revision: row.revision,
    variants: db
      .prepare('SELECT * FROM variants WHERE product_id=? ORDER BY id')
      .all(id)
      .map((variant) => ({
        id: variant.id,
        label: JSON.parse(variant.label),
        priceCents: variant.price_cents,
        stock: variant.stock,
      })),
  };
}
export function allProducts(db, includeInactive = false) {
  return db
    .prepare('SELECT id FROM products ORDER BY rowid')
    .all()
    .map((row) => getProduct(db, row.id))
    .filter((item) => includeInactive || item.active);
}
export function getLooks(db) {
  return db
    .prepare('SELECT data FROM looks ORDER BY rowid')
    .all()
    .map((row) => {
      const look = JSON.parse(row.data);
      const products = look.productIds
        .map((id) => getProduct(db, id))
        .filter((item) => item?.active);
      return { ...look, products, complete: products.length === look.productIds.length };
    });
}
export function catalogRouter(db) {
  const router = Router();
  router.get('/collections', (req, res) =>
    send(
      res,
      db
        .prepare('SELECT data FROM collections ORDER BY rowid')
        .all()
        .map((row) => JSON.parse(row.data)),
    ),
  );
  router.get('/products', (req, res) => {
    let items = allProducts(db);
    const { q = '', category, collection, available, sort = 'editorial' } = req.query;
    if (
      [q, category, collection, available, sort].some(
        (value) => value !== undefined && typeof value !== 'string',
      )
    )
      throw new HttpError(400, 'invalid_input');
    if (q.length > 120) throw new HttpError(400, 'invalid_input');
    const normalized = (value) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    if (q)
      items = items.filter((item) =>
        normalized(
          `${item.name.es} ${item.name.en} ${item.description.es} ${item.description.en}`,
        ).includes(normalized(q)),
      );
    if (category) items = items.filter((item) => item.category === category);
    if (collection) items = items.filter((item) => item.collectionId === collection);
    if (available === '1')
      items = items.filter((item) => item.variants.some((variant) => variant.stock > 0));
    const price = (item) => Math.min(...item.variants.map((variant) => variant.priceCents));
    if (sort === 'price-asc') items.sort((a, b) => price(a) - price(b));
    if (sort === 'price-desc') items.sort((a, b) => price(b) - price(a));
    const page = Math.max(1, Math.floor(Number(req.query.page) || 1));
    const pageSize = 12;
    send(res, {
      items: items.slice((page - 1) * pageSize, page * pageSize),
      total: items.length,
      page,
      pageSize,
    });
  });
  router.get('/products/:id', (req, res) => {
    const product = getProduct(db, req.params.id);
    if (!product?.active) throw new HttpError(404, 'not_found');
    send(res, product);
  });
  router.get('/looks', (req, res) => send(res, getLooks(db)));
  router.post('/stylist', (req, res) => {
    const preferences = parse(stylistSchema, req.body);
    const results = getLooks(db)
      .filter((look) => look.complete)
      .map((look) => {
        const products = look.products.filter(
          (item) => !preferences.excludeBeauty || item.category !== 'beauty',
        );
        const pieces = products.map((product) => ({
          product,
          variant: product.variants.find((variant) => variant.stock > 0),
        }));
        const totalCents = pieces.reduce(
          (total, piece) => total + (piece.variant?.priceCents || 0),
          0,
        );
        const fashion = products.find((item) => item.category === 'fashion');
        const fitsOccasion =
          preferences.occasion === 'any' || fashion?.tags.includes(preferences.occasion);
        const fitsColor = preferences.color === 'any' || fashion?.tags.includes(preferences.color);
        return {
          ...look,
          pieces,
          totalCents,
          valid:
            pieces.length >= 2 &&
            pieces.every((piece) => piece.variant) &&
            fitsOccasion &&
            fitsColor &&
            totalCents <= preferences.budgetCents,
        };
      })
      .filter((look) => look.valid)
      .slice(0, 3);
    send(res, { mode: 'editorial', looks: results, preferences });
  });
  router.get('/favorites', requireUser, (req, res) =>
    send(
      res,
      db
        .prepare('SELECT product_id FROM favorites WHERE user_id=?')
        .all(req.user.id)
        .map((row) => getProduct(db, row.product_id))
        .filter((item) => item?.active),
    ),
  );
  router.put('/favorites/:id', requireUser, (req, res) => {
    if (!getProduct(db, req.params.id)?.active) throw new HttpError(404, 'not_found');
    db.prepare('INSERT OR IGNORE INTO favorites VALUES (?,?)').run(req.user.id, req.params.id);
    send(res, null);
  });
  router.delete('/favorites/:id', requireUser, (req, res) => {
    db.prepare('DELETE FROM favorites WHERE user_id=? AND product_id=?').run(
      req.user.id,
      req.params.id,
    );
    send(res, null);
  });
  return router;
}
export function teamCatalogRouter(db, config) {
  const router = Router();
  router.use(requireTeam);
  router.get('/products', (req, res) => send(res, allProducts(db, true)));
  function save(input, create, revision) {
    return transaction(db, () => {
      const product = parse(productSchema, input);
      const imageDirectory = product.image.startsWith('/uploads/')
        ? config.uploadDir
        : config.mediaDir ||
          fileURLToPath(new URL('../../../frontend/public/media', import.meta.url));
      if (!existsSync(path.join(imageDirectory, path.basename(product.image))))
        throw new HttpError(400, 'invalid_image');
      if (!db.prepare('SELECT id FROM collections WHERE id=?').get(product.collectionId))
        throw new HttpError(400, 'invalid_collection');
      const existing = getProduct(db, product.id);
      if (create && existing) throw new HttpError(409, 'product_exists');
      if (!create && !existing) throw new HttpError(404, 'not_found');
      if (!create && existing.revision !== revision) throw new HttpError(409, 'product_changed');
      for (const variant of product.variants) {
        const owner = db.prepare('SELECT product_id FROM variants WHERE id=?').get(variant.id);
        if (owner && owner.product_id !== product.id) throw new HttpError(409, 'variant_exists');
      }
      const { variants, ...data } = product;
      db.prepare(
        'INSERT INTO products (id,data) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data, revision=products.revision+1',
      ).run(product.id, JSON.stringify(data));
      // Removed variants cannot leave a stock reservation stranded in a cancellable order.
      const removed = (existing?.variants || []).filter(
        (old) => !variants.some((item) => item.id === old.id),
      );
      const openOrders = db
        .prepare("SELECT lines FROM orders WHERE status IN ('pending','confirmed')")
        .all();
      if (
        removed.some((variant) =>
          openOrders.some((order) =>
            JSON.parse(order.lines).some((line) => line.variantId === variant.id),
          ),
        )
      )
        throw new HttpError(409, 'variant_in_order');
      for (const variant of removed) db.prepare('DELETE FROM variants WHERE id=?').run(variant.id);
      for (const variant of variants)
        db.prepare(
          'INSERT INTO variants VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET label=excluded.label, price_cents=excluded.price_cents, stock=excluded.stock',
        ).run(
          variant.id,
          product.id,
          JSON.stringify(variant.label),
          variant.priceCents,
          variant.stock,
        );
      return getProduct(db, product.id);
    });
  }
  router.post('/products', (req, res) => send(res, save(req.body, true), 201));
  router.put('/products/:id', (req, res) => {
    const input = parse(
      z.object({ product: productSchema, revision: z.number().int().min(1) }).strict(),
      req.body,
    );
    if (input.product.id !== req.params.id) throw new HttpError(400, 'invalid_input');
    send(res, save(input.product, false, input.revision));
  });
  return router;
}
