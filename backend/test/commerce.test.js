import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import sharp from 'sharp';
import { openDatabase, seedDatabase } from '../src/db.js';
import { createApp } from '../src/app.js';
import { getProduct } from '../src/modules/catalog.js';
import { migrateCatalogImages } from '../scripts/migrate-catalog-images.js';

function setup(t) {
  const db = openDatabase();
  seedDatabase(db);
  const dir = mkdtempSync(path.join(tmpdir(), 'maison-test-'));
  const config = {
    production: false,
    origin: 'http://127.0.0.1:5173',
    uploadDir: dir,
    frontendDir: path.join(dir, 'absent'),
    trustProxy: false,
  };
  const app = createApp({ db, config, limits: false });
  t.after(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });
  return { db, app, dir, agent: request.agent(app) };
}
function post(agent, url, body) {
  return agent.post(`/api/v1${url}`).set('X-Maison-Request', '1').send(body);
}
async function register(agent, email = 'customer@example.test') {
  const response = await post(agent, '/auth/register', {
    name: 'Maison Test',
    email,
    password: 'Maison-Test-2026',
  });
  assert.equal(response.status, 201, JSON.stringify(response.body));
  return response.body.data;
}
const checkout = (variantId = 'satin-story-1', quantity = 1, idempotencyKey = randomUUID()) => ({
  idempotencyKey,
  lines: [{ variantId, quantity }],
});
function draft(db, id = 'satin-story') {
  const { revision, ...product } = getProduct(db, id);
  return { product, revision };
}

test('public catalogue exposes bilingual variants and filters with pagination', async (t) => {
  const { app } = setup(t);
  const first = await request(app).get('/api/v1/products');
  assert.equal(first.body.data.total, 15);
  assert.equal(first.body.data.items.length, 12);
  const second = await request(app).get('/api/v1/products?page=2');
  assert.equal(second.body.data.items.length, 3);
  const beauty = await request(app).get('/api/v1/products?category=beauty&q=labial');
  assert.deepEqual(
    beauty.body.data.items.map((product) => product.id),
    ['crimson-kiss', 'soft-morning'],
  );
  const garment = await request(app).get('/api/v1/products/satin-story');
  assert.equal(garment.body.data.variants[2].stock, 0);
  assert.ok(garment.body.data.name.en);
});
test('registration rejects role injection and password hashes never reach the client', async (t) => {
  const { agent, db } = setup(t);
  const invalid = await post(agent, '/auth/register', {
    name: 'Admin',
    email: 'admin@example.test',
    password: 'Maison-Test-2026',
    role: 'team',
  });
  assert.equal(invalid.status, 400);
  const user = await register(agent);
  assert.equal(user.role, 'customer');
  assert.equal(user.password, undefined);
  assert.equal(user.password_hash, undefined);
  const hash = db.prepare('SELECT password_hash FROM users WHERE id=?').get(user.id).password_hash;
  assert.ok(!hash.includes('Maison-Test-2026'));
  const me = await agent.get('/api/v1/auth/me');
  assert.deepEqual(me.body.data, user);
});
test('unsafe requests require the custom header and reject a foreign origin', async (t) => {
  const { app, agent } = setup(t);
  assert.equal((await request(app).post('/api/v1/auth/logout')).status, 403);
  assert.equal(
    (
      await agent
        .post('/api/v1/auth/logout')
        .set('X-Maison-Request', '1')
        .set('Origin', 'https://foreign.example')
    ).status,
    403,
  );
});
test('logout revokes a previously copied session cookie', async (t) => {
  const { agent, app } = setup(t);
  const response = await post(agent, '/auth/register', {
    name: 'Session Test',
    email: 'session@example.test',
    password: 'Maison-Test-2026',
  });
  const cookie = response.headers['set-cookie'][0].split(';')[0];
  assert.match(response.headers['set-cookie'][0], /HttpOnly/);
  await post(agent, '/auth/logout', {});
  const me = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);
  assert.equal(me.body.data, null);
});
test('customers cannot manage products, stock or orders', async (t) => {
  const { agent, db } = setup(t);
  await register(agent);
  assert.equal((await agent.get('/api/v1/team/products')).status, 403);
  assert.equal(
    (
      await agent
        .put('/api/v1/team/products/satin-story')
        .set('X-Maison-Request', '1')
        .send(draft(db))
    ).status,
    403,
  );
  assert.equal((await post(agent, '/team/images', {})).status, 403);
});
test('order prices come from the server and snapshots survive product changes', async (t) => {
  const { agent, db } = setup(t);
  const user = await register(agent);
  const forged = { ...checkout(), priceCents: 1 };
  assert.equal((await post(agent, '/orders', forged)).status, 400);
  const response = await post(agent, '/orders', checkout('satin-story-1', 2));
  assert.equal(response.status, 201, JSON.stringify(response.body));
  const order = response.body.data;
  assert.equal(order.totalCents, 15800);
  assert.equal(order.demo, true);
  assert.equal(getProduct(db, 'satin-story').variants[0].stock, 4);
  db.prepare("UPDATE users SET role='team' WHERE id=?").run(user.id);
  const update = draft(db);
  update.product.name.es = 'Nombre cambiado';
  update.product.variants[0].priceCents = 9900;
  const edited = await agent
    .put('/api/v1/team/products/satin-story')
    .set('X-Maison-Request', '1')
    .send(update);
  assert.equal(edited.status, 200, JSON.stringify(edited.body));
  const saved = await agent.get(`/api/v1/orders/${order.id}`);
  assert.equal(saved.body.data.lines[0].unitPriceCents, 7900);
  assert.equal(saved.body.data.lines[0].name.es, 'Vestido Satin Story');
  assert.equal((await agent.get('/api/v1/messages')).body.data.length, 1);
});
test('replaying the same order does not consume stock or duplicate communications', async (t) => {
  const { agent, db } = setup(t);
  await register(agent);
  const body = checkout();
  const first = await post(agent, '/orders', body);
  const replay = await post(agent, '/orders', body);
  assert.equal(replay.status, 200);
  assert.equal(replay.body.data.id, first.body.data.id);
  assert.equal(getProduct(db, 'satin-story').variants[0].stock, 5);
  assert.equal((await agent.get('/api/v1/messages')).body.data.length, 1);
  assert.equal(
    (
      await post(agent, '/orders', {
        ...body,
        lines: [{ variantId: 'satin-story-1', quantity: 2 }],
      })
    ).status,
    409,
  );
});
test('a multi-piece order rolls back all stock when a later piece is unavailable', async (t) => {
  const { agent, db } = setup(t);
  await register(agent);
  const response = await post(agent, '/orders', {
    idempotencyKey: randomUUID(),
    lines: [
      { variantId: 'satin-story-1', quantity: 2 },
      { variantId: 'satin-story-3', quantity: 1 },
    ],
  });
  assert.equal(response.status, 409);
  assert.equal(response.body.error, 'insufficient_stock');
  assert.equal(getProduct(db, 'satin-story').variants[0].stock, 6);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM orders').get().count, 0);
});
test('competing checkouts cannot sell the last unit twice', async (t) => {
  const { app, db } = setup(t);
  const first = request.agent(app);
  const second = request.agent(app);
  await register(first, 'one@example.test');
  await register(second, 'two@example.test');
  db.prepare('UPDATE variants SET stock=1 WHERE id=?').run('satin-story-1');
  const responses = await Promise.all([
    post(first, '/orders', checkout()),
    post(second, '/orders', checkout()),
  ]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409]);
  assert.equal(getProduct(db, 'satin-story').variants[0].stock, 0);
});
test('order details, messages and favorites stay private to each customer', async (t) => {
  const { app, agent } = setup(t);
  await register(agent);
  const other = request.agent(app);
  await register(other, 'other@example.test');
  const order = (await post(agent, '/orders', checkout())).body.data;
  assert.equal((await other.get(`/api/v1/orders/${order.id}`)).status, 404);
  assert.equal((await other.get('/api/v1/orders')).body.data.length, 0);
  assert.equal((await other.get('/api/v1/messages')).body.data.length, 0);
  await agent.put('/api/v1/favorites/satin-story').set('X-Maison-Request', '1');
  assert.equal((await other.get('/api/v1/favorites')).body.data.length, 0);
});
test('cancellation restores units once and cannot reopen a terminal order', async (t) => {
  const { db, agent } = setup(t);
  const user = await register(agent);
  const order = (await post(agent, '/orders', checkout())).body.data;
  db.prepare("UPDATE users SET role='team' WHERE id=?").run(user.id);
  const cancelled = await agent
    .patch(`/api/v1/team/orders/${order.id}`)
    .set('X-Maison-Request', '1')
    .send({ status: 'cancelled' });
  assert.equal(cancelled.status, 200);
  assert.equal(getProduct(db, 'satin-story').variants[0].stock, 6);
  assert.equal(
    (
      await agent
        .patch(`/api/v1/team/orders/${order.id}`)
        .set('X-Maison-Request', '1')
        .send({ status: 'cancelled' })
    ).status,
    409,
  );
  assert.equal(getProduct(db, 'satin-story').variants[0].stock, 6);
  assert.equal((await agent.get('/api/v1/messages')).body.data.length, 2);
});
test('dispatch cannot skip confirmation or allow later cancellation', async (t) => {
  const { db, agent } = setup(t);
  const user = await register(agent);
  const order = (await post(agent, '/orders', checkout())).body.data;
  db.prepare("UPDATE users SET role='team' WHERE id=?").run(user.id);
  const change = (status) =>
    agent.patch(`/api/v1/team/orders/${order.id}`).set('X-Maison-Request', '1').send({ status });
  assert.equal((await change('dispatched')).status, 409);
  assert.equal((await change('confirmed')).status, 200);
  assert.equal((await change('dispatched')).status, 200);
  assert.equal((await change('cancelled')).status, 409);
  assert.equal((await change('delivered')).status, 200);
});
test('stale Team edits cannot overwrite stock changed by a checkout', async (t) => {
  const { db, agent, app } = setup(t);
  const user = await register(agent);
  db.prepare("UPDATE users SET role='team' WHERE id=?").run(user.id);
  const stale = draft(db);
  const buyer = request.agent(app);
  await register(buyer, 'buyer@example.test');
  await post(buyer, '/orders', checkout());
  const response = await agent
    .put('/api/v1/team/products/satin-story')
    .set('X-Maison-Request', '1')
    .send(stale);
  assert.equal(response.status, 409);
  assert.equal(response.body.error, 'product_changed');
  assert.equal(getProduct(db, 'satin-story').variants[0].stock, 5);
});
test('Team cannot remove a variant reserved in an open order', async (t) => {
  const { db, agent } = setup(t);
  const user = await register(agent);
  await post(agent, '/orders', checkout());
  db.prepare("UPDATE users SET role='team' WHERE id=?").run(user.id);
  const update = draft(db);
  update.product.variants = update.product.variants.filter(
    (variant) => variant.id !== 'satin-story-1',
  );
  const response = await agent
    .put('/api/v1/team/products/satin-story')
    .set('X-Maison-Request', '1')
    .send(update);
  assert.equal(response.status, 409);
  assert.equal(response.body.error, 'variant_in_order');
  assert.equal(getProduct(db, 'satin-story').variants.length, 3);
});
test('archived products cannot be bought and disappear from public catalogue', async (t) => {
  const { db, agent } = setup(t);
  const user = await register(agent);
  db.prepare("UPDATE users SET role='team' WHERE id=?").run(user.id);
  const update = draft(db);
  update.product.active = false;
  assert.equal(
    (await agent.put('/api/v1/team/products/satin-story').set('X-Maison-Request', '1').send(update))
      .status,
    200,
  );
  assert.equal((await agent.get('/api/v1/products/satin-story')).status, 404);
  assert.equal((await post(agent, '/orders', checkout())).body.error, 'product_unavailable');
});
test('Team rejects nonexistent images and creates a new bilingual product', async (t) => {
  const { db, agent } = setup(t);
  const user = await register(agent);
  db.prepare("UPDATE users SET role='team' WHERE id=?").run(user.id);
  const update = draft(db);
  update.product.image = '/media/missing-image.svg';
  assert.equal(
    (await agent.put('/api/v1/team/products/satin-story').set('X-Maison-Request', '1').send(update))
      .status,
    400,
  );
  const product = draft(db).product;
  product.id = 'new-piece';
  product.name = { es: 'Nueva pieza', en: 'New piece' };
  product.variants = [{ ...product.variants[0], id: 'new-piece-1', stock: 3 }];
  assert.equal((await post(agent, '/team/products', product)).status, 201);
  const created = await agent.get('/api/v1/products/new-piece');
  assert.equal(created.body.data.name.en, 'New piece');
  assert.equal(created.body.data.variants[0].stock, 3);
});
test('SQLite persists catalogue edits across close and reopen', (t) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'maison-persistence-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const filename = path.join(dir, 'store.sqlite');
  const first = openDatabase(filename);
  seedDatabase(first);
  first.prepare("UPDATE variants SET stock=3 WHERE id='satin-story-1'").run();
  first.close();
  const second = openDatabase(filename);
  assert.equal(seedDatabase(second), 0);
  assert.equal(getProduct(second, 'satin-story').variants[0].stock, 3);
  second.close();
});
test('editorial suggestions respect budget, exclusions and actual stock', async (t) => {
  const { db, agent } = setup(t);
  const body = { occasion: 'dinner', color: 'dark', budgetCents: 14000, excludeBeauty: true };
  const response = await post(agent, '/stylist', body);
  assert.equal(response.body.data.mode, 'editorial');
  assert.equal(response.body.data.looks.length, 1);
  const look = response.body.data.looks[0];
  assert.equal(look.totalCents, 13800);
  assert.ok(
    look.pieces.every((piece) => piece.product.category !== 'beauty' && piece.variant.stock > 0),
  );
  assert.equal(
    (await post(agent, '/stylist', { ...body, budgetCents: 1000 })).body.data.looks.length,
    0,
  );
  db.prepare("UPDATE variants SET stock=0 WHERE product_id='velvet-night'").run();
  assert.equal((await post(agent, '/stylist', body)).body.data.looks.length, 0);
});
test('the seed preserves edited products, consumed stock and existing users', (t) => {
  const { db } = setup(t);
  db.prepare("UPDATE variants SET stock=2 WHERE id='satin-story-1'").run();
  assert.equal(seedDatabase(db), 0);
  assert.equal(getProduct(db, 'satin-story').variants[0].stock, 2);
});
test('catalog image migration preserves custom images and stock and is idempotent', (t) => {
  const { db } = setup(t);
  const original = JSON.parse(
    db.prepare("SELECT data FROM products WHERE id='satin-story'").get().data,
  );
  original.image = '/media/satin-story.svg';
  db.prepare("UPDATE products SET data=? WHERE id='satin-story'").run(JSON.stringify(original));
  const custom = JSON.parse(
    db.prepare("SELECT data FROM products WHERE id='warm-notes'").get().data,
  );
  custom.image = '/uploads/custom.webp';
  db.prepare("UPDATE products SET data=? WHERE id='warm-notes'").run(JSON.stringify(custom));
  db.prepare("UPDATE variants SET stock=2 WHERE id='satin-story-1'").run();
  assert.equal(migrateCatalogImages(db), 1);
  assert.equal(getProduct(db, 'satin-story').image, '/media/satin-story.webp');
  assert.equal(getProduct(db, 'satin-story').revision, 2);
  assert.equal(getProduct(db, 'satin-story').variants[0].stock, 2);
  assert.equal(getProduct(db, 'warm-notes').image, '/uploads/custom.webp');
  assert.equal(migrateCatalogImages(db), 0);
});
test('image uploads reject SVG and forged headers, then normalize a valid raster', async (t) => {
  const { agent, db, dir } = setup(t);
  const user = await register(agent);
  db.prepare("UPDATE users SET role='team' WHERE id=?").run(user.id);
  const upload = (buffer, filename) =>
    agent
      .post('/api/v1/team/images')
      .set('X-Maison-Request', '1')
      .attach('image', buffer, filename);
  assert.equal((await upload(Buffer.from('<svg onload="alert(1)"/>'), 'evil.svg')).status, 400);
  assert.equal(
    (
      await upload(
        Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), Buffer.alloc(30)]),
        'fake.png',
      )
    ).status,
    400,
  );
  const image = await sharp({
    create: { width: 10, height: 10, channels: 3, background: '#942e3d' },
  })
    .png()
    .toBuffer();
  const response = await upload(image, 'image.png');
  assert.equal(response.status, 201, JSON.stringify(response.body));
  assert.match(response.body.data.image, /^\/uploads\/[a-f0-9-]+\.webp$/);
  assert.equal(readdirSync(dir).length, 1);
});
