import nodemailer from 'nodemailer';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { openDatabase, seedDatabase } from '../src/db.js';
import { createOrder, transitionOrder } from '../src/modules/orders.js';
import { createApp } from '../src/app.js';
import { readSandboxConfig, deliverSandboxEmails, sandboxPayload } from '../src/email/sandbox.js';
import { orderMessage } from '../src/domain/order-messages.js';
const config = { enabled: true, host: 'sandbox.smtp.mailtrap.io', language: 'es' };
function fixture(t) {
  const db = openDatabase();
  seedDatabase(db);
  t.after(() => db.close());
  db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?)').run(
    'test-user',
    'Test',
    'fixture@maison.example',
    'unused',
    'customer',
    new Date().toISOString(),
  );
  const input = {
    idempotencyKey: randomUUID(),
    lines: [{ variantId: 'satin-story-1', quantity: 1 }],
  };
  return { db, input, order: createOrder(db, 'test-user', input).order };
}
test('Sandbox config is off by default and validates enabled credentials without echoing secrets', () => {
  assert.equal(readSandboxConfig({}).enabled, false);
  assert.throws(
    () =>
      readSandboxConfig({
        MAIL_ENABLED: 'true',
        SMTP_HOST: 'smtp.example.com',
        SMTP_USER: 'fixture',
        SMTP_PASSWORD: 'fixture',
      }),
    /Configure/,
  );
  assert.throws(
    () =>
      readSandboxConfig({
        MAIL_ENABLED: 'true',
        SMTP_SECURE: 'true',
        SMTP_USER: 'fixture',
        SMTP_PASSWORD: 'fixture',
      }),
    /Configure/,
  );
  assert.throws(() => readSandboxConfig({ MAIL_ENABLED: 'true' }), /Configure/);
  assert.equal(
    readSandboxConfig({
      MAIL_ENABLED: 'true',
      SMTP_USER: 'fixture',
      SMTP_PASSWORD: 'fixture',
    }).enabled,
    true,
  );
});
test('Sandbox HTML escapes catalogue text and always uses fictional addresses', () => {
  const email = orderMessage('pending', {
    id: 'demo',
    totalCents: 100,
    lines: [
      {
        name: { es: '<script>alert(1)</script>', en: 'Dress' },
        variantLabel: { es: 'M', en: 'M' },
        quantity: 1,
        subtotalCents: 100,
      },
    ],
  }).email;
  const payload = sandboxPayload(email);
  assert.ok(!payload.html.includes('<script>'));
  assert.ok(payload.html.includes('&lt;script&gt;'));
  assert.equal(payload.to[0].address, 'cliente@maison.example');
  assert.match(payload.text, /No se realizará ningún cargo/);
  assert.match(payload.html, /cid:maison-logo/);
  assert.equal(payload.attachments[0].contentType, 'image/png');
});
test('queued emails are claimed once across retries, use only fixed Sandbox host, and cancellation has its own event', async (t) => {
  const { db, input, order } = fixture(t);
  let calls = 0;
  const send = async (smtpConfig, payload) => {
    calls++;
    assert.equal(smtpConfig.host, 'sandbox.smtp.mailtrap.io');
    assert.equal(payload.to[0].address, 'cliente@maison.example');
    return { accepted: true };
  };
  await Promise.all([
    deliverSandboxEmails(db, order.id, 'pending', config, send),
    deliverSandboxEmails(db, order.id, 'pending', config, send),
  ]);
  createOrder(db, 'test-user', input);
  await deliverSandboxEmails(db, order.id, 'pending', config, send);
  assert.equal(calls, 1);
  assert.equal(db.prepare('SELECT state FROM email_deliveries').get().state, 'captured');
  transitionOrder(db, order.id, 'cancelled');
  await deliverSandboxEmails(db, order.id, 'cancelled', config, send);
  assert.equal(calls, 2);
  assert.equal(
    db.prepare("SELECT count(*) n FROM email_deliveries WHERE state='captured'").get().n,
    2,
  );
});
test('timeout or provider failure retains order and never automatically retries an ambiguous delivery', async (t) => {
  const { db, order } = fixture(t);
  let calls = 0;
  const fail = async () => {
    calls++;
    throw new Error('do not log provider details');
  };
  await deliverSandboxEmails(db, order.id, 'pending', config, fail);
  await deliverSandboxEmails(db, order.id, 'pending', config, fail);
  assert.equal(calls, 1);
  assert.equal(db.prepare('SELECT state FROM email_deliveries').get().state, 'failed_or_unknown');
  assert.equal(db.prepare('SELECT count(*) n FROM orders').get().n, 1);
  assert.equal(db.prepare('SELECT stock FROM variants WHERE id=?').get('satin-story-1').stock, 5);
});
test('disabled Sandbox does not make network calls or consume queued messages', async (t) => {
  const { db, order } = fixture(t);
  await deliverSandboxEmails(db, order.id, 'pending', { enabled: false }, () => {
    throw new Error('must not call');
  });
  assert.equal(db.prepare('SELECT state FROM email_deliveries').get().state, 'pending');
});

test('HTTP checkout still returns success when Sandbox is unavailable and replay never resends', async (t) => {
  const { db } = fixture(t);
  let calls = 0;
  const app = createApp({
    db,
    limits: false,
    config: {
      production: false,
      origin: 'http://127.0.0.1:3179',
      uploadDir: '/tmp/maison-sandbox-test',
      frontendDir: '/tmp/maison-no-frontend',
      emailSandbox: config,
    },
    emailRequest: async () => {
      calls++;
      throw new Error('timeout');
    },
  });
  const agent = request.agent(app);
  assert.equal(
    (
      await agent.post('/api/v1/auth/register').set('X-Maison-Request', '1').send({
        name: 'Sandbox Customer',
        email: 'sandbox@maison.example',
        password: 'Disposable-Fixture-2026',
      })
    ).status,
    201,
  );
  const payload = {
    idempotencyKey: randomUUID(),
    lines: [{ variantId: 'satin-story-1', quantity: 1 }],
  };
  const first = await agent.post('/api/v1/orders').set('X-Maison-Request', '1').send(payload);
  const replay = await agent.post('/api/v1/orders').set('X-Maison-Request', '1').send(payload);
  assert.equal(first.status, 201);
  assert.equal(replay.status, 200);
  assert.equal(first.body.data.id, replay.body.data.id);
  assert.equal(calls, 1);
});

test('SMTP payload produces a real recipient envelope and HTML/text MIME parts', async () => {
  const email = orderMessage('pending', { id: 'fixture', totalCents: 100, lines: [] }).email;
  const transport = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    newline: 'unix',
  });
  const result = await transport.sendMail(sandboxPayload(email));
  assert.deepEqual(result.envelope.to, ['cliente@maison.example']);
  assert.equal(result.envelope.from, 'boutique@maison.example');
  assert.match(result.message.toString(), /multipart\/alternative/);
});

test('complete outfit email carries catalogue totals, historical names and four inline product photos', (t) => {
  const { db } = fixture(t);
  const order = createOrder(db, 'test-user', {
    idempotencyKey: randomUUID(),
    lines: [
      { variantId: 'ivory-interview-2', quantity: 1 },
      { variantId: 'ivory-lines-2', quantity: 1 },
      { variantId: 'studio-satin-2', quantity: 1 },
      { variantId: 'coffee-loafers-2', quantity: 1 },
    ],
  }).order;
  const email = orderMessage('pending', order).email;
  assert.equal(email.order.lookName, 'Studio Interview');
  const payload = sandboxPayload(email, 'es');
  assert.equal(payload.attachments.length, 5);
  assert.match(payload.html, /Studio Interview/);
  assert.ok(payload.html.includes('4.840,00'));
  assert.ok(payload.html.includes('2.250,00'));
  assert.match(payload.html, /cid:maison-piece-3/);
  assert.ok(!payload.html.includes('Cargo real: 0'));
  assert.match(payload.text, /No se realizará ningún cargo/);
  const cancelled = sandboxPayload(orderMessage('cancelled', order).email, 'en');
  assert.match(cancelled.html, /Cancelled amount/);
  assert.ok(cancelled.html.includes('4.840,00'));
  assert.match(cancelled.text, /does not issue a bank refund/);
});
