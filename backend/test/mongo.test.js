import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import sharp from 'sharp';
import { openMongo } from '../src/storage/mongo.js';
import { createApp } from '../src/app.js';
import {
  createCloudinaryStorage,
  cloudinaryImageUrl,
  fetchCloudinaryImage,
} from '../src/storage/cloudinary.js';

const origin = 'https://maison.example.test';
const credentials = {
  name: 'Mongo Demo',
  email: 'mongo@example.test',
  password: 'Maison-Demo-2026',
};
const mutation = (app, method, route, body, cookie) => {
  const req = request(app)
    [method](`/api/v1${route}`)
    .set('Origin', origin)
    .set('X-Maison-Request', '1');
  if (cookie) req.set('Cookie', cookie);
  return req.send(body);
};

test(
  'MongoDB replica set preserves the Maison shopping and Team guarantees',
  { timeout: 180000 },
  async (t) => {
    const repl = await MongoMemoryReplSet.create({
      binary: { downloadDir: path.join(tmpdir(), 'maison-mongodb-binaries'), version: '8.0.16' },
      replSet: { count: 1 },
    });
    t.after(() => repl.stop());
    const db = await openMongo({
      mongoUri: repl.getUri(),
      mongoDatabase: `maison_test_${randomUUID().replaceAll('-', '')}`,
    });
    t.after(() => db.close());
    await db.seed();
    const uploaded = new Map();
    const config = {
      production: true,
      serverless: true,
      origin,
      trustProxy: true,
      mediaStorage: 'cloudinary',
      cloudinary: { cloudName: 'maison-test', folder: 'kelsets-maison/team' },
    };
    const app = createApp({
      db,
      config,
      limits: false,
      cloudStorage: {
        upload: async (buffer, id) => uploaded.set(id, buffer),
        destroy: async (id) => uploaded.delete(id),
      },
      imageFetch: async (url) =>
        new Response(uploaded.get(url.split('/image/upload/')[1].replace(/\.webp$/, '')), {
          headers: { 'content-type': 'image/webp' },
        }),
    });
    let cookie;
    let user;
    await t.test(
      'seed is idempotent and public catalogue keeps filters, names and variants',
      async () => {
        assert.equal(await db.seed(), 0);
        assert.equal(await db.collection('products').countDocuments(), 190);
        const res = await request(app).get(
          '/api/v1/products?size=M&available=1&maxPriceCents=100000',
        );
        assert.equal(res.status, 200);
        assert.ok(res.body.data.items.length > 0);
        assert.ok(
          res.body.data.items.every((p) =>
            p.variants.some((v) => /M/.test(v.label.es) && v.stock > 0 && v.priceCents <= 100000),
          ),
        );
        const looks = await request(app).get('/api/v1/looks');
        assert.equal(looks.status, 200);
        assert.equal(looks.body.data.length, 57);
        assert.ok(looks.body.data.every((look) => look.complete));
      },
    );
    await t.test('registration, login, favorites and session privacy use MongoDB', async () => {
      const res = await mutation(app, 'post', '/auth/register', credentials);
      assert.equal(res.status, 201);
      assert.equal(res.body.data.role, 'customer');
      assert.equal(res.body.data.password_hash, undefined);
      cookie = res.headers['set-cookie'][0].split(';')[0];
      assert.match(res.headers['set-cookie'][0], /; Secure/);
      user = res.body.data;
      const repeat = await mutation(app, 'post', '/auth/register', credentials);
      assert.equal(repeat.status, 409);
      assert.equal(
        (await request(app).get('/api/v1/team/products').set('Cookie', cookie)).status,
        403,
      );
      assert.equal((await mutation(app, 'put', '/favorites/satin-story', {}, cookie)).status, 200);
      assert.equal(
        (await request(app).get('/api/v1/favorites').set('Cookie', cookie)).body.data.length,
        1,
      );
      const other = await mutation(app, 'post', '/auth/register', {
        ...credentials,
        email: 'other@example.test',
      });
      const otherCookie = other.headers['set-cookie'][0].split(';')[0];
      assert.equal(
        (await request(app).get('/api/v1/favorites').set('Cookie', otherCookie)).body.data.length,
        0,
      );
      assert.equal(
        (
          await mutation(app, 'post', '/auth/login', {
            email: credentials.email,
            password: 'wrong-password',
          })
        ).status,
        401,
      );
    });
    let order;
    await t.test(
      'simultaneous identical checkouts produce one order, stock deduction and message',
      async () => {
        const before = await db.getProduct('satin-story');
        const payload = {
          idempotencyKey: randomUUID(),
          lines: [{ variantId: 'satin-story-1', quantity: 1 }],
        };
        const results = await Promise.all([
          mutation(app, 'post', '/orders', payload, cookie),
          mutation(app, 'post', '/orders', payload, cookie),
        ]);
        assert.deepEqual(results.map((r) => r.status).sort(), [200, 201]);
        assert.equal(results[0].body.data.id, results[1].body.data.id);
        order = results[0].body.data;
        assert.equal(order.totalCents, before.variants[0].priceCents);
        assert.equal(
          (await db.getProduct('satin-story')).variants[0].stock,
          before.variants[0].stock - 1,
        );
        assert.equal((await db.getMessages(user.id)).length, 1);
        const conflict = await mutation(
          app,
          'post',
          '/orders',
          { ...payload, lines: [{ variantId: 'satin-story-1', quantity: 2 }] },
          cookie,
        );
        assert.equal(conflict.status, 409);
        assert.equal((await request(app).get(`/api/v1/orders/${order.id}`)).status, 401);
        const other = await mutation(app, 'post', '/auth/login', {
          email: 'other@example.test',
          password: credentials.password,
        });
        assert.equal(
          (
            await request(app)
              .get(`/api/v1/orders/${order.id}`)
              .set('Cookie', other.headers['set-cookie'][0].split(';')[0])
          ).status,
          404,
        );
      },
    );
    await t.test('multi-piece failure rolls back all earlier stock and messages', async () => {
      const before = (await db.getProduct('satin-story')).variants[0].stock;
      const result = await mutation(
        app,
        'post',
        '/orders',
        {
          idempotencyKey: randomUUID(),
          lines: [
            { variantId: 'satin-story-1', quantity: 1 },
            { variantId: 'missing', quantity: 1 },
          ],
        },
        cookie,
      );
      assert.equal(result.status, 409);
      assert.equal((await db.getProduct('satin-story')).variants[0].stock, before);
      assert.equal((await db.getMessages(user.id)).length, 1);
    });
    await t.test('competing orders cannot oversell the final unit', async () => {
      await db.collection('variants').updateOne({ id: 'satin-story-2' }, { $set: { stock: 1 } });
      const payload = () => ({
        idempotencyKey: randomUUID(),
        lines: [{ variantId: 'satin-story-2', quantity: 1 }],
      });
      const results = await Promise.all([
        mutation(app, 'post', '/orders', payload(), cookie),
        mutation(app, 'post', '/orders', payload(), cookie),
      ]);
      assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
      assert.equal((await db.collection('variants').findOne({ id: 'satin-story-2' })).stock, 0);
    });
    await t.test(
      'Team edits protect revisions, reserved variants and historical names',
      async () => {
        await db.grantTeam(credentials.email);
        const current = await db.getProduct('satin-story');
        const { revision, ...product } = current;
        const reserved = await mutation(
          app,
          'put',
          '/team/products/satin-story',
          {
            revision,
            product: {
              ...product,
              variants: product.variants.filter((v) => v.id !== 'satin-story-1'),
            },
          },
          cookie,
        );
        assert.equal(reserved.status, 409);
        const updated = await mutation(
          app,
          'put',
          '/team/products/satin-story',
          {
            revision,
            product: {
              ...product,
              name: { es: 'Vestido · Historia propia', en: 'Dress · Own Story' },
            },
          },
          cookie,
        );
        assert.equal(updated.status, 200);
        assert.equal(
          (await mutation(app, 'put', '/team/products/satin-story', { revision, product }, cookie))
            .status,
          409,
        );
        assert.deepEqual((await db.getOrder(order.id, user.id)).lines[0].name, order.lines[0].name);
        await db.seed();
        assert.equal((await db.getProduct('satin-story')).name.en, 'Dress · Own Story');
      },
    );
    await t.test('cancellation restores stock once and records each valid transition', async () => {
      const before = (await db.getProduct('satin-story')).variants[0].stock;
      assert.equal(
        (await mutation(app, 'patch', `/team/orders/${order.id}`, { status: 'dispatched' }, cookie))
          .status,
        409,
      );
      assert.equal(
        (await mutation(app, 'patch', `/team/orders/${order.id}`, { status: 'confirmed' }, cookie))
          .status,
        200,
      );
      const results = await Promise.all([
        mutation(app, 'patch', `/team/orders/${order.id}`, { status: 'cancelled' }, cookie),
        mutation(app, 'patch', `/team/orders/${order.id}`, { status: 'cancelled' }, cookie),
      ]);
      assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
      assert.equal((await db.getProduct('satin-story')).variants[0].stock, before + 1);
      assert.equal((await db.getMessages(user.id)).filter((m) => m.orderId === order.id).length, 3);
    });
    await t.test(
      'Team uploads normalize images, store cloud reference and preserve delivery after product changes',
      async () => {
        const image = await sharp({
          create: { width: 10, height: 10, channels: 3, background: '#aa3344' },
        })
          .png()
          .toBuffer();
        const res = await request(app)
          .post('/api/v1/team/images')
          .set('Cookie', cookie)
          .set('Origin', origin)
          .set('X-Maison-Request', '1')
          .attach('image', image, 'demo.png');
        assert.equal(res.status, 201);
        assert.match(res.body.data.image, /^\/api\/v1\/images\/.*\.webp$/);
        const delivered = await request(app).get(res.body.data.image);
        assert.equal(delivered.status, 200);
        assert.equal((await sharp(delivered.body).metadata()).format, 'webp');
        const { revision, ...product } = await db.getProduct('satin-story');
        const saved = await mutation(
          app,
          'put',
          '/team/products/satin-story',
          { revision, product: { ...product, image: res.body.data.image } },
          cookie,
        );
        assert.equal(saved.status, 200);
        assert.equal((await db.getOrder(order.id, user.id)).lines[0].image, order.lines[0].image);
        assert.equal(
          (await request(app).get('/api/v1/images/00000000-0000-0000-0000-000000000000.webp'))
            .status,
          404,
        );
      },
    );
    await t.test('logout revokes the persisted session', async () => {
      assert.equal((await mutation(app, 'post', '/auth/logout', {}, cookie)).status, 200);
      assert.equal(
        (await request(app).get('/api/v1/auth/me').set('Cookie', cookie)).body.data,
        null,
      );
    });
  },
);

test('Cloudinary delivery restricts destination, format and response size', async () => {
  const config = { cloudName: 'maison-test', folder: 'kelsets-maison/team' };
  assert.throws(() => cloudinaryImageUrl('kelsets-cars/old', config.cloudName, config.folder));
  assert.throws(() =>
    cloudinaryImageUrl('https://other.test/image', config.cloudName, config.folder),
  );
  const record = { publicId: 'kelsets-maison/team/test' };
  await assert.rejects(
    fetchCloudinaryImage(
      record,
      config,
      async () => new Response('html', { headers: { 'content-type': 'text/html' } }),
    ),
    { code: 'media_unavailable' },
  );
  await assert.rejects(
    fetchCloudinaryImage(
      record,
      config,
      async () =>
        new Response(Buffer.alloc(4 * 1024 * 1024 + 1), {
          headers: { 'content-type': 'image/webp' },
        }),
    ),
    { code: 'media_unavailable' },
  );
  const storage = createCloudinaryStorage(
    { ...config, apiKey: 'test', apiSecret: 'test' },
    {
      upload_stream: (options, callback) => ({
        end: () => callback(new Error('Provider credentials must stay private')),
      }),
    },
  );
  await assert.rejects(storage.upload(Buffer.from('demo'), record.publicId), {
    code: 'media_unavailable',
  });
});
