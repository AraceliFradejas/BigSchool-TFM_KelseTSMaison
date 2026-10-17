import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, cpSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { openDatabase, seedDatabase } from '../src/db.js';
import { createApp } from '../src/app.js';

const origin = 'https://maison.example.test';
function setup(t) {
  const dir = mkdtempSync(path.join(tmpdir(), 'maison-deployment-'));
  const databasePath = path.join(dir, 'runtime', 'maison.sqlite');
  const uploadDir = path.join(dir, 'runtime', 'uploads');
  const frontendDir = path.join(dir, 'dist');
  mkdirSync(uploadDir, { recursive: true });
  mkdirSync(path.join(frontendDir, 'assets'), { recursive: true });
  writeFileSync(
    path.join(frontendDir, 'index.html'),
    '<!doctype html><title>Maison fixture</title><div id="root"></div>',
  );
  writeFileSync(path.join(frontendDir, 'assets', 'app.js'), 'console.log("Maison fixture");');
  const db = openDatabase(databasePath);
  seedDatabase(db);
  const config = {
    production: true,
    origin,
    databasePath,
    uploadDir,
    frontendDir,
    trustProxy: true,
  };
  const app = createApp({ db, config, limits: false });
  let closed = false;
  const close = () => {
    if (closed) return;
    db.close();
    closed = true;
  };
  t.after(() => {
    close();
    rmSync(dir, { recursive: true, force: true });
  });
  return { dir, db, config, app, close };
}
const post = (app, route, body, requestOrigin = origin) =>
  request(app)
    .post(`/api/v1${route}`)
    .set('Origin', requestOrigin)
    .set('X-Maison-Request', '1')
    .send(body);
const registration = {
  name: 'Deployment Demo',
  email: 'deployment@example.test',
  password: 'Deployment-Demo-2026',
};

test('production serves SPA routes and assets, keeping missing files and API routes as 404s', async (t) => {
  const { app } = setup(t);
  for (const route of ['/', '/catalog?category=fashion', '/products/satin-story', '/account']) {
    const response = await request(app).get(route);
    assert.equal(response.status, 200);
    assert.match(response.headers['content-type'], /text\/html/);
    assert.match(response.text, /Maison fixture/);
    assert.equal(response.headers['cache-control'], 'no-cache');
  }
  const asset = await request(app).get('/assets/app.js');
  assert.equal(asset.status, 200);
  assert.match(asset.headers['content-type'], /javascript/);
  for (const route of ['/assets/missing.js', '/media/missing.webp', '/uploads/missing.webp'])
    assert.equal((await request(app).get(route)).status, 404, route);
  const missingApi = await request(app).get('/api/v1/missing');
  assert.equal(missingApi.status, 401);
  assert.match(missingApi.headers['content-type'], /application\/json/);
  const health = await request(app).get('/api/v1/health');
  assert.equal(health.status, 200);
  assert.equal(health.headers['cache-control'], 'no-store');
  assert.match(health.headers['strict-transport-security'], /max-age=/);
  assert.match(health.headers['content-security-policy'], /upgrade-insecure-requests/);
  assert.equal(health.headers['x-powered-by'], undefined);
});

test('production sessions use secure cookies and mutations reject development origins', async (t) => {
  const { app, db } = setup(t);
  for (const foreign of [
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    'https://other.example.test',
  ])
    assert.equal((await post(app, '/auth/register', registration, foreign)).status, 403);
  assert.equal(db.prepare('SELECT count(*) AS count FROM users').get().count, 0);
  const response = await post(app, '/auth/register', registration);
  assert.equal(response.status, 201);
  const cookie = response.headers['set-cookie'][0];
  for (const flag of [/; Secure/i, /; HttpOnly/i, /; SameSite=Lax/i, /; Path=\/api/i])
    assert.match(cookie, flag);
  assert.equal(response.body.data.role, 'customer');
  const me = await request(app).get('/api/v1/auth/me').set('Cookie', cookie.split(';')[0]);
  assert.equal(me.body.data.email, registration.email);
  const unknown = await request(app).get('/api/v1/missing').set('Cookie', cookie.split(';')[0]);
  assert.equal(unknown.status, 404);
  assert.match(unknown.headers['content-type'], /application\/json/);
});

test('closed runtime backup restores orders, sessions, stock and uploaded images independently', async (t) => {
  const { app, db, dir, config, close } = setup(t);
  const registered = await post(app, '/auth/register', registration);
  const cookie = registered.headers['set-cookie'][0].split(';')[0];
  const order = await post(app, '/orders', {
    idempotencyKey: '7c965392-b248-4c2d-8541-1e93c312ed32',
    lines: [{ variantId: 'satin-story-1', quantity: 2 }],
  }).set('Cookie', cookie);
  assert.equal(order.status, 201, JSON.stringify(order.body));
  const stock = db.prepare('SELECT stock FROM variants WHERE id=?').get('satin-story-1').stock;
  const image = Buffer.from('fixture uploaded image');
  writeFileSync(path.join(config.uploadDir, 'demo.webp'), image);
  const product = JSON.parse(
    db.prepare('SELECT data FROM products WHERE id=?').get('satin-story').data,
  );
  product.image = '/uploads/demo.webp';
  db.prepare('UPDATE products SET data=? WHERE id=?').run(JSON.stringify(product), product.id);
  const ordersBefore = db.prepare('SELECT * FROM orders').all();
  const messagesBefore = db.prepare('SELECT * FROM messages').all();
  close();
  const restoredRuntime = path.join(dir, 'restored-runtime');
  cpSync(path.join(dir, 'runtime'), restoredRuntime, {
    recursive: true,
    errorOnExist: true,
    force: false,
  });
  const restored = openDatabase(path.join(restoredRuntime, 'maison.sqlite'));
  t.after(() => restored.close());
  assert.equal(seedDatabase(restored), 0);
  assert.equal(restored.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  assert.deepEqual(restored.prepare('SELECT * FROM orders').all(), ordersBefore);
  assert.deepEqual(restored.prepare('SELECT * FROM messages').all(), messagesBefore);
  assert.equal(
    restored.prepare('SELECT stock FROM variants WHERE id=?').get('satin-story-1').stock,
    stock,
  );
  assert.deepEqual(readFileSync(path.join(restoredRuntime, 'uploads', 'demo.webp')), image);
  const restoredApp = createApp({
    db: restored,
    config: { ...config, uploadDir: path.join(restoredRuntime, 'uploads') },
    limits: false,
  });
  const me = await request(restoredApp).get('/api/v1/auth/me').set('Cookie', cookie);
  assert.equal(me.body.data.email, registration.email);
  const history = await request(restoredApp).get('/api/v1/orders').set('Cookie', cookie);
  assert.equal(history.body.data[0].id, order.body.data.id);
  const uploaded = await request(restoredApp).get('/uploads/demo.webp');
  assert.equal(uploaded.status, 200);
  assert.deepEqual(uploaded.body, image);
  restored.prepare('UPDATE variants SET stock=1 WHERE id=?').run('satin-story-1');
  const source = openDatabase(config.databasePath);
  try {
    assert.equal(
      source.prepare('SELECT stock FROM variants WHERE id=?').get('satin-story-1').stock,
      stock,
    );
  } finally {
    source.close();
  }
});
