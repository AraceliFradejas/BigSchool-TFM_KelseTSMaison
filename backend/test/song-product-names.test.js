import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase, seedDatabase } from '../src/db.js';
import { migrateSongProductNames } from '../scripts/migrate-song-product-names.js';
import entries from '../../data/song-product-names.json' with { type: 'json' };
import { products } from '../../data/catalog.js';

test('all non-runway products have bilingual musical names in new installations', (t) => {
  const db = openDatabase();
  t.after(() => db.close());
  seedDatabase(db);
  const editorial = products.filter((product) => !product.tags.includes('runway'));
  assert.equal(entries.length, editorial.length);
  assert.equal(new Set(entries.map((entry) => entry.id)).size, entries.length);
  for (const product of editorial) {
    const entry = entries.find((item) => item.id === product.id);
    assert.ok(entry, product.id);
    assert.deepEqual(product.name, entry.name);
    for (const language of ['es', 'en'])
      assert.ok(product.name[language].includes(entry.songTitle));
  }
  assert.deepEqual(migrateSongProductNames(db), { products: 0 });
});

test('name migration preserves custom translations, stock, prices and historical orders', (t) => {
  const db = openDatabase();
  t.after(() => db.close());
  seedDatabase(db);
  const [original, partial, custom] = entries;
  const setName = (entry, name) => {
    const data = JSON.parse(db.prepare('SELECT data FROM products WHERE id=?').get(entry.id).data);
    data.name = name;
    db.prepare('UPDATE products SET data=? WHERE id=?').run(JSON.stringify(data), entry.id);
  };
  setName(original, original.previousName);
  setName(partial, { es: 'Edición personal', en: partial.previousName.en });
  setName(custom, { es: 'Mi pieza', en: 'My piece' });
  db.prepare('UPDATE variants SET stock=2,price_cents=12345 WHERE product_id=?').run(original.id);
  db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?)').run(
    'customer',
    'Demo',
    'demo@example.test',
    'unused',
    'customer',
    '2026-10-17',
  );
  const snapshot = JSON.stringify([
    { productId: original.id, name: original.previousName, priceCents: 12345 },
  ]);
  db.prepare('INSERT INTO orders VALUES (?,?,?,?,?,?,?,?,?)').run(
    'order',
    'customer',
    'key',
    'hash',
    snapshot,
    12345,
    'pending',
    '2026-10-17',
    '2026-10-17',
  );
  const variantsBefore = db.prepare('SELECT * FROM variants').all();
  const ordersBefore = db.prepare('SELECT * FROM orders').all();
  const revision = db.prepare('SELECT revision FROM products WHERE id=?').get(original.id).revision;
  assert.deepEqual(migrateSongProductNames(db), { products: 2 });
  const readName = (entry) =>
    JSON.parse(db.prepare('SELECT data FROM products WHERE id=?').get(entry.id).data).name;
  assert.deepEqual(readName(original), original.name);
  assert.deepEqual(readName(partial), { es: 'Edición personal', en: partial.name.en });
  assert.deepEqual(readName(custom), { es: 'Mi pieza', en: 'My piece' });
  assert.deepEqual(db.prepare('SELECT * FROM variants').all(), variantsBefore);
  assert.deepEqual(db.prepare('SELECT * FROM orders').all(), ordersBefore);
  assert.equal(
    db.prepare('SELECT revision FROM products WHERE id=?').get(original.id).revision,
    revision + 1,
  );
  assert.deepEqual(migrateSongProductNames(db), { products: 0 });
});
