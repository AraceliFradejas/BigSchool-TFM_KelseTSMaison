import { checkoutHash, demoReceipt } from '../modules/demo-payment.js';
import { MongoClient } from 'mongodb';
import { randomUUID, createHash } from 'node:crypto';
import { products, collections, looks } from '../../../data/catalog.js';
import { productSchema, checkoutSchema, transitions } from '@maison/contracts';
import { HttpError, parse } from '../http.js';
import { orderMessage } from '../modules/orders.js';

const clean = (row) => {
  if (!row) return null;
  const { _id, position, ...data } = row;
  return data;
};
const publicOrder = (row) =>
  row && {
    id: row.id,
    lines: row.lines,
    totalCents: row.totalCents,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    demo: true,
    payment: row.payment || null,
  };

export async function openMongo({ mongoUri, mongoDatabase }) {
  if (!mongoUri || !mongoDatabase)
    throw new Error('Configure MONGODB_URI and MONGODB_DATABASE for Maison.');
  const client = new MongoClient(mongoUri, { maxPoolSize: 5, serverSelectionTimeoutMS: 8000 });
  try {
    await client.connect();
    const store = new MongoStore(client, client.db(mongoDatabase));
    await store.initialize();
    return store;
  } catch (error) {
    await client.close();
    // Never include the URI or provider error (which may contain credentials) in logs.
    throw new Error('Maison MongoDB connection or index initialization failed.', { cause: error });
  }
}

export class MongoStore {
  kind = 'mongo';
  constructor(client, database, session) {
    this.client = client;
    this.database = database;
    this.session = session;
  }
  collection(name) {
    return this.database.collection(name);
  }
  options() {
    return this.session ? { session: this.session } : {};
  }
  close() {
    return this.client.close();
  }
  async initialize() {
    for (const name of [
      'users',
      'sessions',
      'products',
      'variants',
      'collections',
      'looks',
      'orders',
      'messages',
      'images',
    ])
      await this.collection(name).createIndex({ id: 1 }, { unique: true });
    await this.collection('users').createIndex({ email: 1 }, { unique: true });
    await this.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await this.collection('variants').createIndex({ productId: 1 });
    await this.collection('favorites').createIndex({ userId: 1, productId: 1 }, { unique: true });
    await this.collection('orders').createIndex({ userId: 1, idempotencyKey: 1 }, { unique: true });
    await this.collection('orders').createIndex({ userId: 1, createdAt: -1 });
    await this.collection('messages').createIndex({ userId: 1, createdAt: -1 });
  }
  async transaction(action) {
    const session = this.client.startSession();
    try {
      return await session.withTransaction(
        () => action(new MongoStore(this.client, this.database, session)),
        { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } },
      );
    } finally {
      await session.endSession();
    }
  }
  async seed() {
    // Explicit operation; never run at every serverless cold start.
    let inserted = 0;
    for (const [position, input] of products.entries()) {
      const product = productSchema.parse(input);
      inserted += await this.transaction(async (tx) => {
        const { variants, ...data } = product;
        const result = await tx.collection('products').updateOne(
          { id: product.id },
          {
            $setOnInsert: {
              ...data,
              variantIds: variants.map((v) => v.id),
              revision: 1,
              position,
            },
          },
          { ...tx.options(), upsert: true },
        );
        if (!result.upsertedCount) return 0;
        for (const variant of variants)
          await tx
            .collection('variants')
            .insertOne({ ...variant, productId: product.id }, tx.options());
        return 1;
      });
    }
    for (const [name, entries] of [
      ['collections', collections],
      ['looks', looks],
    ])
      for (const [position, item] of entries.entries())
        await this.collection(name).updateOne(
          { id: item.id },
          { $setOnInsert: { ...item, position } },
          { upsert: true },
        );
    return inserted;
  }
  async getProduct(id) {
    const product = clean(await this.collection('products').findOne({ id }, this.options()));
    if (!product) return null;
    const variants = await this.collection('variants')
      .find({ productId: id }, this.options())
      .toArray();
    // Retain the editor's variant ordering without relying on MongoDB's natural order.
    const ordered = product.variantIds || variants.map((variant) => variant.id);
    delete product.variantIds;
    return {
      ...product,
      variants: variants
        .sort((a, b) => ordered.indexOf(a.id) - ordered.indexOf(b.id))
        .map(({ productId, ...v }) => clean(v)),
    };
  }
  async allProducts(includeInactive = false) {
    const rows = await this.collection('products')
      .find(includeInactive ? {} : { active: true }, this.options())
      .sort({ position: 1, id: 1 })
      .toArray();
    const variants = await this.collection('variants')
      .find({ productId: { $in: rows.map((row) => row.id) } }, this.options())
      .toArray();
    return rows.map((row) => {
      const { variantIds, ...product } = clean(row);
      const pieces = variants.filter((v) => v.productId === row.id);
      if (variantIds) pieces.sort((a, b) => variantIds.indexOf(a.id) - variantIds.indexOf(b.id));
      return { ...product, variants: pieces.map(({ productId, ...v }) => clean(v)) };
    });
  }
  async getCollections() {
    return (
      await this.collection('collections')
        .find({}, this.options())
        .sort({ position: 1, id: 1 })
        .toArray()
    ).map(clean);
  }
  async getLooks() {
    const products = new Map((await this.allProducts()).map((product) => [product.id, product]));
    return (
      await this.collection('looks').find({}, this.options()).sort({ position: 1, id: 1 }).toArray()
    ).map((row) => {
      const look = clean(row);
      const pieces = look.productIds.map((id) => products.get(id)).filter(Boolean);
      return { ...look, products: pieces, complete: pieces.length === look.productIds.length };
    });
  }
  findUser(email) {
    return this.collection('users').findOne({ email }, this.options());
  }
  async insertUser(user) {
    try {
      await this.collection('users').insertOne(user, this.options());
    } catch (error) {
      if (error.code === 11000) throw new HttpError(409, 'email_exists');
      throw error;
    }
  }
  async findSessionUser(id, now) {
    const session = await this.collection('sessions').findOne({
      id,
      expiresAt: { $gt: new Date(now) },
    });
    return session && this.collection('users').findOne({ id: session.userId });
  }
  async startSession(oldId, id, userId, expires) {
    await this.transaction(async (tx) => {
      if (oldId) await tx.collection('sessions').deleteOne({ id: oldId }, tx.options());
      await tx
        .collection('sessions')
        .insertOne({ id, userId, expiresAt: new Date(expires) }, tx.options());
    });
  }
  deleteSession(id) {
    return this.collection('sessions').deleteOne({ id });
  }
  grantTeam(email) {
    return this.collection('users').updateOne({ email }, { $set: { role: 'team' } });
  }
  async getFavorites(userId) {
    const result = [];
    for (const row of await this.collection('favorites').find({ userId }).toArray()) {
      const product = await this.getProduct(row.productId);
      if (product?.active) result.push(product);
    }
    return result;
  }
  async setFavorite(userId, productId, enabled) {
    if (!enabled) return this.collection('favorites').deleteOne({ userId, productId });
    try {
      await this.collection('favorites').updateOne(
        { userId, productId },
        { $setOnInsert: { userId, productId } },
        { upsert: true },
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }
  async saveProduct(product, create, revision) {
    try {
      return await this.transaction(async (tx) => {
        if (
          !(await tx.collection('collections').findOne({ id: product.collectionId }, tx.options()))
        )
          throw new HttpError(400, 'invalid_collection');
        const existing = await tx.getProduct(product.id);
        if (create && existing) throw new HttpError(409, 'product_exists');
        if (!create && !existing) throw new HttpError(404, 'not_found');
        if (!create && existing.revision !== revision) throw new HttpError(409, 'product_changed');
        const removed = (existing?.variants || []).filter(
          (v) => !product.variants.some((next) => next.id === v.id),
        );
        if (
          removed.length &&
          (await tx.collection('orders').findOne(
            {
              status: { $in: ['pending', 'confirmed'] },
              'lines.variantId': { $in: removed.map((v) => v.id) },
            },
            tx.options(),
          ))
        )
          throw new HttpError(409, 'variant_in_order');
        const { variants, ...data } = product;
        const variantIds = variants.map((v) => v.id);
        if (create)
          await tx
            .collection('products')
            .insertOne({ ...data, variantIds, revision: 1, position: Date.now() }, tx.options());
        else {
          const change = await tx
            .collection('products')
            .updateOne(
              { id: product.id, revision },
              { $set: { ...data, variantIds }, $inc: { revision: 1 } },
              tx.options(),
            );
          if (!change.modifiedCount) throw new HttpError(409, 'product_changed');
        }
        for (const old of removed)
          await tx.collection('variants').deleteOne({ id: old.id }, tx.options());
        for (const variant of variants) {
          const owner = await tx.collection('variants').findOne({ id: variant.id }, tx.options());
          if (owner && owner.productId !== product.id) throw new HttpError(409, 'variant_exists');
          await tx
            .collection('variants')
            .updateOne(
              { id: variant.id },
              { $set: { ...variant, productId: product.id } },
              { ...tx.options(), upsert: true },
            );
        }
        return tx.getProduct(product.id);
      });
    } catch (error) {
      if (error.code === 11000)
        throw new HttpError(409, create ? 'product_exists' : 'variant_exists');
      throw error;
    }
  }
  async message(userId, orderId, status) {
    await this.collection('messages').insertOne(
      {
        id: randomUUID(),
        userId,
        orderId,
        ...orderMessage(status),
        createdAt: new Date().toISOString(),
      },
      this.options(),
    );
  }
  async createOrder(userId, input) {
    const checkout = parse(checkoutSchema, input);
    const requestHash = checkoutHash(checkout);
    const replay = (row) => {
      if (row.requestHash !== requestHash) throw new HttpError(409, 'idempotency_conflict');
      return { order: publicOrder(row), replay: true };
    };
    try {
      return await this.transaction(async (tx) => {
        const existing = await tx
          .collection('orders')
          .findOne({ userId, idempotencyKey: checkout.idempotencyKey }, tx.options());
        if (existing) return replay(existing);
        const lines = [];
        for (const line of checkout.lines) {
          const variant = await tx
            .collection('variants')
            .findOne({ id: line.variantId }, tx.options());
          const product = variant && (await tx.getProduct(variant.productId));
          if (!product?.active) throw new HttpError(409, 'product_unavailable');
          const change = await tx
            .collection('variants')
            .updateOne(
              { id: variant.id, stock: { $gte: line.quantity } },
              { $inc: { stock: -line.quantity } },
              tx.options(),
            );
          if (!change.modifiedCount) throw new HttpError(409, 'insufficient_stock');
          await tx
            .collection('products')
            .updateOne({ id: product.id }, { $inc: { revision: 1 } }, tx.options());
          lines.push({
            productId: product.id,
            variantId: variant.id,
            name: product.name,
            variantLabel: variant.label,
            image: product.image,
            quantity: line.quantity,
            unitPriceCents: variant.priceCents,
            subtotalCents: line.quantity * variant.priceCents,
          });
        }
        const now = new Date().toISOString();
        const order = {
          id: randomUUID(),
          userId,
          idempotencyKey: checkout.idempotencyKey,
          requestHash,
          lines,
          totalCents: lines.reduce((total, line) => total + line.subtotalCents, 0),
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        };
        order.payment = demoReceipt(checkout, order.id, order.totalCents, now);
        await tx.collection('orders').insertOne(order, tx.options());
        await tx.message(userId, order.id, 'pending');
        return { order: publicOrder(order), replay: false };
      });
    } catch (error) {
      if (error.code === 11000) {
        const existing = await this.collection('orders').findOne({
          userId,
          idempotencyKey: checkout.idempotencyKey,
        });
        if (existing) return replay(existing);
      }
      throw error;
    }
  }
  async transitionOrder(id, status) {
    return this.transaction(async (tx) => {
      const order = await tx.collection('orders').findOne({ id }, tx.options());
      if (!order) throw new HttpError(404, 'not_found');
      if (!transitions[order.status]?.includes(status))
        throw new HttpError(409, 'invalid_transition');
      if (status === 'cancelled')
        for (const line of order.lines) {
          const change = await tx
            .collection('variants')
            .updateOne({ id: line.variantId }, { $inc: { stock: line.quantity } }, tx.options());
          if (!change.modifiedCount) throw new HttpError(409, 'variant_missing');
          await tx
            .collection('products')
            .updateOne({ id: line.productId }, { $inc: { revision: 1 } }, tx.options());
        }
      order.status = status;
      order.updatedAt = new Date().toISOString();
      await tx
        .collection('orders')
        .updateOne({ id }, { $set: { status, updatedAt: order.updatedAt } }, tx.options());
      await tx.message(order.userId, id, status);
      return publicOrder(order);
    });
  }
  async getOrders(userId) {
    const rows = await this.collection('orders')
      .find(userId ? { userId } : {})
      .sort({ createdAt: -1, id: 1 })
      .toArray();
    const result = [];
    for (const row of rows) {
      const order = publicOrder(row);
      if (!userId)
        order.customerName = (await this.collection('users').findOne({ id: row.userId }))?.name;
      result.push(order);
    }
    return result;
  }
  async getOrder(id, userId) {
    return publicOrder(await this.collection('orders').findOne({ id, userId }));
  }
  async getMessages(userId) {
    return (
      await this.collection('messages').find({ userId }).sort({ createdAt: -1, id: 1 }).toArray()
    ).map(({ _id, userId, ...row }) => row);
  }
  findImage(id) {
    return this.collection('images').findOne({ id });
  }
  saveImage(image) {
    return this.collection('images').insertOne(image);
  }
}
