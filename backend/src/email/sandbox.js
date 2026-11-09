import { renderOrderEmail } from './template.js';
import nodemailer from 'nodemailer';

// Only Mailtrap Sandbox is allowed; no real-recipient SMTP host is configurable.
export function readSandboxConfig(env = process.env) {
  const enabled = env.MAIL_ENABLED === 'true';
  const host = env.SMTP_HOST || 'sandbox.smtp.mailtrap.io';
  const port = Number(env.SMTP_PORT || 2525);
  const secure = env.SMTP_SECURE === 'true';
  const user = env.SMTP_USER || '';
  const password = env.SMTP_PASSWORD || '';
  const language = env.MAIL_LANGUAGE || 'es';
  const from = env.MAIL_FROM || 'KelseTS Maison <boutique@maison.example>';
  const publicAppUrl = env.PUBLIC_APP_URL || 'https://kelsets-maison.vercel.app';
  let url;
  try {
    url = new URL(publicAppUrl);
  } catch {
    throw new Error('Configure a valid PUBLIC_APP_URL for Maison.');
  }
  if (
    enabled &&
    (host !== 'sandbox.smtp.mailtrap.io' ||
      ![2525, 587, 465].includes(port) ||
      secure !== (port === 465) ||
      !user ||
      !password ||
      !['es', 'en'].includes(language) ||
      /[\r\n]/.test(from) ||
      !/^[^<>]+ <[^<>\s]+@maison\.example>$/.test(from) ||
      !['https:', 'http:'].includes(url.protocol) ||
      url.username ||
      url.password)
  )
    throw new Error(
      'Configure Maison Mailtrap Sandbox SMTP settings, fictional sender and es/en language.',
    );
  return { enabled, host, port, secure, user, password, language, from, publicAppUrl: url.origin };
}

export async function sendSandboxSmtp(config, payload) {
  if (config.host !== 'sandbox.smtp.mailtrap.io') throw new Error('sandbox_only');
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
    requireTLS: true,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
    logger: false,
    debug: false,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  try {
    const { category, ...message } = payload;
    const info = await transport.sendMail({ ...message, from: config.from });
    return { accepted: info.accepted?.length === 1 && !info.rejected?.length };
  } finally {
    transport.close();
  }
}

// Enqueued inside the same transaction as the order event.
export function queueSandboxEmail(db, id, orderId, status) {
  if (db.kind === 'mongo')
    return db
      .collection('email_deliveries')
      .insertOne({ id, orderId, orderStatus: status, state: 'pending' }, db.options());
  db.prepare('INSERT INTO email_deliveries (id,order_id,order_status,state) VALUES (?,?,?,?)').run(
    id,
    orderId,
    status,
    'pending',
  );
}

export function sandboxPayload(
  email,
  language = 'es',
  appUrl = 'https://kelsets-maison.vercel.app',
) {
  return renderOrderEmail(email, language, appUrl);
}

export async function deliverSandboxEmails(db, orderId, status, config, request = sendSandboxSmtp) {
  if (!config?.enabled) return;
  // Claims are atomic across server instances. A failed/uncertain attempt is never retried
  // automatically: the provider may have accepted a request whose response was lost.
  let rows;
  try {
    rows =
      db.kind === 'mongo'
        ? await db.collection('messages').find({ orderId }).toArray()
        : db
            .prepare('SELECT id,data FROM messages WHERE order_id=?')
            .all(orderId)
            .map((row) => ({ id: row.id, ...JSON.parse(row.data) }));
    for (const row of rows.filter((row) => row.email?.orderStatus === status)) {
      const claim =
        db.kind === 'mongo'
          ? (
              await db
                .collection('email_deliveries')
                .updateOne({ id: row.id, state: 'pending' }, { $set: { state: 'sending' } })
            ).modifiedCount
          : db
              .prepare("UPDATE email_deliveries SET state='sending' WHERE id=? AND state='pending'")
              .run(row.id).changes;
      if (!claim) continue;
      let state = 'failed_or_unknown';
      try {
        const result = await request(
          config,
          sandboxPayload(row.email, config.language, config.publicAppUrl),
        );
        if (result.accepted === true) state = 'captured';
      } catch (error) {
        // Only fixed protocol codes; never provider responses or credential-bearing errors.
        const codes = [
          'EAUTH',
          'EENVELOPE',
          'EMESSAGE',
          'ETIMEDOUT',
          'ECONNECTION',
          'ESOCKET',
          'EDNS',
          'ETLS',
        ];
        const code = codes.includes(error.code) ? error.code : 'unclassified';
        const response = Number.isInteger(error.responseCode) ? error.responseCode : 'none';
        const reason = /too many emails|rate limit/i.test(String(error.response || ''))
          ? 'rate_limit'
          : 'unclassified';
        console.warn(
          `Maison Sandbox SMTP failure: ${code}; response ${response}; reason ${reason}.`,
        );
      }
      if (db.kind === 'mongo')
        await db
          .collection('email_deliveries')
          .updateOne({ id: row.id }, { $set: { state, attemptedAt: new Date().toISOString() } });
      else
        db.prepare('UPDATE email_deliveries SET state=?,attempted_at=? WHERE id=?').run(
          state,
          new Date().toISOString(),
          row.id,
        );
    }
  } catch {
    // Email delivery must not turn a committed order into a failed checkout response.
    console.warn('Maison Sandbox delivery needs review. Order remains recorded.');
  }
}

export async function sandboxDeliveryStatus(db, id) {
  const row =
    db.kind === 'mongo'
      ? await db.collection('email_deliveries').findOne({ id })
      : db.prepare('SELECT state,attempted_at FROM email_deliveries WHERE id=?').get(id);
  return row
    ? { state: row.state, attemptedAt: row.attemptedAt || row.attempted_at || null }
    : null;
}
