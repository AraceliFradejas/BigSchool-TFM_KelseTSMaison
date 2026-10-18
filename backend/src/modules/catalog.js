import { Router } from 'express';
import { z } from 'zod';
import { validateProductImage } from './media.js';
import { productSchema, stylistSchema, catalogQuerySchema, variantSize } from '@maison/contracts';
import { HttpError, parse, send } from '../http.js';
import { transaction } from '../db.js';
import { requireUser, requireTeam } from './auth.js';

export function getProduct(db, id) {
  if (db.kind === 'mongo') return db.getProduct(id);
  const row = db.prepare('SELECT data, revision FROM products WHERE id=?').get(id);
  if (!row) return null;
  return {
    ...JSON.parse(row.data),
    revision: row.revision,
    variants: db
      .prepare('SELECT * FROM variants WHERE product_id=? ORDER BY rowid')
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
  if (db.kind === 'mongo') return db.allProducts(includeInactive);
  return db
    .prepare('SELECT id FROM products ORDER BY rowid')
    .all()
    .map((row) => getProduct(db, row.id))
    .filter((item) => includeInactive || item.active);
}
export function getLooks(db) {
  if (db.kind === 'mongo') return db.getLooks();
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
  router.get('/collections', async (req, res) =>
    send(
      res,
      db.kind === 'mongo'
        ? await db.getCollections()
        : db
            .prepare('SELECT data FROM collections ORDER BY rowid')
            .all()
            .map((row) => JSON.parse(row.data)),
    ),
  );
  router.get('/products', async (req, res) => {
    let items = await allProducts(db);
    const {
      q = '',
      category,
      collection,
      available,
      luxury,
      runway,
      size,
      maxPriceCents,
      page: requestedPage,
      sort = 'editorial',
    } = parse(catalogQuerySchema, req.query);
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
    if (luxury === '1') items = items.filter((item) => item.tags.includes('luxury'));
    if (runway === '1') items = items.filter((item) => item.tags.includes('runway'));
    // Size, budget and availability must match the same variant.
    items = items.flatMap((item) => {
      const eligible = item.variants.filter(
        (variant) =>
          (!size || variantSize(variant) === size) &&
          (available !== '1' || variant.stock > 0) &&
          (maxPriceCents === undefined || variant.priceCents <= maxPriceCents),
      );
      return eligible.length
        ? [
            {
              ...item,
              matchedPriceCents: Math.min(...eligible.map((variant) => variant.priceCents)),
            },
          ]
        : [];
    });
    const price = (item) => item.matchedPriceCents;
    if (sort === 'price-asc') items.sort((a, b) => price(a) - price(b));
    if (sort === 'price-desc') items.sort((a, b) => price(b) - price(a));
    const pageSize = 12;
    const page = Math.min(requestedPage, Math.max(1, Math.ceil(items.length / pageSize)));
    send(res, {
      items: items.slice((page - 1) * pageSize, page * pageSize),
      total: items.length,
      page,
      pageSize,
    });
  });
  router.get('/products/:id', async (req, res) => {
    const product = await getProduct(db, req.params.id);
    if (!product?.active) throw new HttpError(404, 'not_found');
    send(res, product);
  });
  router.get('/looks', async (req, res) => send(res, await getLooks(db)));
  router.post('/stylist', async (req, res) => {
    const preferences = parse(stylistSchema, req.body);
    const results = (await getLooks(db))
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
          preferences.occasion === 'any' ||
          look.mood === preferences.occasion ||
          fashion?.tags.includes(preferences.occasion);
        const fitsColor =
          preferences.color === 'any' ||
          products.some((item) => item.tags.includes(preferences.color));
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
  router.get('/favorites', requireUser, async (req, res) =>
    send(
      res,
      db.kind === 'mongo'
        ? await db.getFavorites(req.user.id)
        : db
            .prepare('SELECT product_id FROM favorites WHERE user_id=?')
            .all(req.user.id)
            .map((row) => getProduct(db, row.product_id))
            .filter((item) => item?.active),
    ),
  );
  router.put('/favorites/:id', requireUser, async (req, res) => {
    if (!(await getProduct(db, req.params.id))?.active) throw new HttpError(404, 'not_found');
    if (db.kind === 'mongo') await db.setFavorite(req.user.id, req.params.id, true);
    else db.prepare('INSERT OR IGNORE INTO favorites VALUES (?,?)').run(req.user.id, req.params.id);
    send(res, null);
  });
  router.delete('/favorites/:id', requireUser, async (req, res) => {
    if (db.kind === 'mongo') await db.setFavorite(req.user.id, req.params.id, false);
    else
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
  router.get('/products', async (req, res) => send(res, await allProducts(db, true)));
  async function save(input, create, revision) {
    const candidate = parse(productSchema, input);
    await validateProductImage(candidate.image, config, db);
    if (db.kind === 'mongo') return db.saveProduct(candidate, create, revision);
    return transaction(db, () => {
      const product = parse(productSchema, input);
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
  router.post('/products', async (req, res) => send(res, await save(req.body, true), 201));
  router.put('/products/:id', async (req, res) => {
    const input = parse(
      z.object({ product: productSchema, revision: z.number().int().min(1) }).strict(),
      req.body,
    );
    if (input.product.id !== req.params.id) throw new HttpError(400, 'invalid_input');
    send(res, await save(input.product, false, input.revision));
  });
  return router;
}
