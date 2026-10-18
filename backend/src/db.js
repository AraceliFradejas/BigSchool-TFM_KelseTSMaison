import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { products, collections, looks } from '../../data/catalog.js';
import { productSchema } from '@maison/contracts';

export function openDatabase(filename = ':memory:') {
  if (filename !== ':memory:') mkdirSync(path.dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer','team')), created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS collections (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS variants (id TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id), label TEXT NOT NULL, price_cents INTEGER NOT NULL CHECK(price_cents > 0), stock INTEGER NOT NULL CHECK(stock >= 0));
    CREATE INDEX IF NOT EXISTS variants_product ON variants(product_id);
    CREATE TABLE IF NOT EXISTS looks (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS favorites (user_id TEXT NOT NULL REFERENCES users(id), product_id TEXT NOT NULL REFERENCES products(id), PRIMARY KEY(user_id, product_id));
    CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), idempotency_key TEXT NOT NULL, request_hash TEXT NOT NULL, lines TEXT NOT NULL, total_cents INTEGER NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(user_id, idempotency_key));
    CREATE INDEX IF NOT EXISTS orders_user ON orders(user_id);
    CREATE TABLE IF NOT EXISTS demo_payments (order_id TEXT PRIMARY KEY REFERENCES orders(id), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), order_id TEXT REFERENCES orders(id), data TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS messages_user ON messages(user_id);`);
  return db;
}
export function transaction(db, action) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = action();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
export function seedDatabase(db) {
  // Only insert missing records. Reruns never reset managed stock or product edits.
  return transaction(db, () => {
    for (const item of collections)
      db.prepare('INSERT OR IGNORE INTO collections VALUES (?,?)').run(
        item.id,
        JSON.stringify(item),
      );
    let inserted = 0;
    for (const entry of products) {
      const item = productSchema.parse(entry);
      const { variants, ...data } = item;
      const result = db
        .prepare('INSERT OR IGNORE INTO products (id,data) VALUES (?,?)')
        .run(item.id, JSON.stringify(data));
      if (!result.changes) continue;
      inserted++;
      for (const variant of variants)
        db.prepare('INSERT INTO variants VALUES (?,?,?,?,?)').run(
          variant.id,
          item.id,
          JSON.stringify(variant.label),
          variant.priceCents,
          variant.stock,
        );
    }
    for (const look of looks)
      db.prepare('INSERT OR IGNORE INTO looks VALUES (?,?)').run(look.id, JSON.stringify(look));
    return inserted;
  });
}
