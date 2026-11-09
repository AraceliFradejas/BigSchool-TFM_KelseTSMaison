// Explicit integration check: four illustrated messages, two languages, Sandbox only.
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { openDatabase, seedDatabase } from '../src/db.js';
import { createOrder, transitionOrder } from '../src/modules/orders.js';
import { getProduct } from '../src/modules/catalog.js';
import { readSandboxConfig, sendSandboxSmtp, deliverSandboxEmails } from '../src/email/sandbox.js';
import { looks } from '../../data/catalog.js';
import assert from 'node:assert/strict';
let db;
try {
  const config = readSandboxConfig({ ...process.env, MAIL_ENABLED: 'true' });
  db = openDatabase();
  seedDatabase(db);
  db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?)').run(
    'smtp-fixture',
    'Cliente ficticio Maison',
    'fixture@maison.example',
    'not-a-login',
    'customer',
    new Date().toISOString(),
  );
  const look = looks.find((look) => look.id === 'look-studio-interview');
  const lines = look.productIds.map((id) => {
    const product = getProduct(db, id);
    const variant = product.variants.find(
      (variant) => variant.stock > 0 && /^(M|37) ·/.test(variant.label.es),
    );
    assert.ok(variant, 'Fixture requires available M clothing / 37 footwear');
    return { variantId: variant.id, quantity: 1 };
  });
  const before = lines.map(
    (line) => db.prepare('SELECT stock FROM variants WHERE id=?').get(line.variantId).stock,
  );
  const evidence = {
    date: new Date().toISOString(),
    environment: 'isolated in-memory SQLite',
    transport: 'SMTP with TLS to Mailtrap Sandbox',
    look: look.name,
    orders: [],
    attempts: 0,
    replayExtraAttempts: 0,
    realChargeCents: 0,
  };
  const send = async (smtp, payload) => {
    evidence.attempts++;
    return sendSandboxSmtp(smtp, payload);
  };
  const languages = process.env.MAIL_SAMPLE_LANGUAGES === 'en' ? ['en'] : ['es', 'en'];
  for (const language of languages) {
    const input = { idempotencyKey: randomUUID(), lines };
    const { order } = createOrder(db, 'smtp-fixture', input);
    assert.equal(order.totalCents, 484000);
    await deliverSandboxEmails(db, order.id, 'pending', { ...config, language }, send);
    assert.equal(
      db.prepare('SELECT state FROM email_deliveries WHERE order_id=?').get(order.id).state,
      'captured',
    );
    const attempts = evidence.attempts;
    assert.equal(createOrder(db, 'smtp-fixture', input).order.id, order.id);
    await deliverSandboxEmails(db, order.id, 'pending', { ...config, language }, send);
    assert.equal(evidence.attempts, attempts);
    await new Promise((resolve) => setTimeout(resolve, 12000));
    transitionOrder(db, order.id, 'cancelled');
    await deliverSandboxEmails(db, order.id, 'cancelled', { ...config, language }, send);
    const events = db
      .prepare(
        'SELECT order_status,state FROM email_deliveries WHERE order_id=? ORDER BY order_status',
      )
      .all(order.id);
    assert.ok(events.every((event) => event.state === 'captured'));
    evidence.orders.push({
      language,
      id: order.id,
      totalCents: order.totalCents,
      lines: order.lines,
      events,
    });
    if (language !== languages.at(-1)) await new Promise((resolve) => setTimeout(resolve, 12000));
  }
  assert.equal(evidence.attempts, languages.length * 2);
  const after = lines.map(
    (line) => db.prepare('SELECT stock FROM variants WHERE id=?').get(line.variantId).stock,
  );
  assert.deepEqual(after, before);
  evidence.stockRestored = true;
  const dir = path.resolve('docs/evidencias/emails-2026-11-09');
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    path.join(
      dir,
      languages.length === 2 ? 'smtp-outfit-bilingual.json' : 'smtp-outfit-en-mobile.json',
    ),
    JSON.stringify(evidence, null, 2) + '\n',
  );
  console.log(
    JSON.stringify({
      attempts: evidence.attempts,
      orders: evidence.orders.map(({ language, id, totalCents, events }) => ({
        language,
        id,
        totalCents,
        events,
      })),
      stockRestored: true,
      replayExtraAttempts: 0,
    }),
  );
} catch {
  console.error(
    'Maison Sandbox verification did not complete. Review local SMTP configuration and captured messages before another attempt.',
  );
  process.exitCode = 1;
} finally {
  db?.close();
}
