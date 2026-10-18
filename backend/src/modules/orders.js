import { checkoutHash, demoReceipt } from './demo-payment.js';
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { checkoutSchema, demoCheckoutSchema, orderStatuses, transitions } from '@maison/contracts';
import { HttpError, parse, send } from '../http.js';
import { transaction } from '../db.js';
import { getProduct } from './catalog.js';
import { requireUser, requireTeam } from './auth.js';

export const publicOrder = (row, db) => ({
  id: row.id,
  lines: JSON.parse(row.lines),
  totalCents: row.total_cents,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  demo: true,
  payment: db
    ? JSON.parse(
        db.prepare('SELECT data FROM demo_payments WHERE order_id=?').get(row.id)?.data || 'null',
      )
    : null,
});
export function orderMessage(status) {
  const titles = {
    pending: { es: 'Tu selección ya tiene una historia', en: 'Your selection has a story now' },
    confirmed: { es: 'Selección confirmada', en: 'Selection confirmed' },
    dispatched: { es: 'Un paso más en el recorrido', en: 'Another step in the journey' },
    delivered: { es: 'Historia completada', en: 'Story completed' },
    cancelled: { es: 'Pedido de demostración cancelado', en: 'Demonstration order cancelled' },
  };
  const descriptions = {
    pending: {
      es: 'Hemos registrado tu pedido de demostración. No se ha realizado ningún cobro ni se enviarán productos.',
      en: 'Your demonstration order has been recorded. No payment has been taken and no products will be shipped.',
    },
    confirmed: {
      es: 'Team ha confirmado tu pedido de demostración. Puedes consultar sus piezas en tu cuenta.',
      en: 'Team has confirmed your demonstration order. You can view its pieces in your account.',
    },
    dispatched: {
      es: 'Tu pedido figura como enviado dentro de la simulación. Este estado no representa un envío real.',
      en: 'Your order is marked as dispatched within the simulation. This status does not represent a real shipment.',
    },
    delivered: {
      es: 'Tu pedido figura como entregado dentro de la simulación. Gracias por recorrer Maison.',
      en: 'Your order is marked as delivered within the simulation. Thank you for exploring Maison.',
    },
    cancelled: {
      es: 'El pedido se ha cancelado y sus unidades vuelven a estar disponibles en el catálogo de demostración.',
      en: 'The order has been cancelled and its units are available again in the demonstration catalogue.',
    },
  };
  return { title: titles[status], body: descriptions[status] };
}
function message(db, userId, orderId, status) {
  db.prepare('INSERT INTO messages VALUES (?,?,?,?,?)').run(
    randomUUID(),
    userId,
    orderId,
    JSON.stringify(orderMessage(status)),
    new Date().toISOString(),
  );
}
export function createOrder(db, userId, input) {
  if (db.kind === 'mongo') return db.createOrder(userId, input);
  const checkout = parse(checkoutSchema, input);
  const requestHash = checkoutHash(checkout);
  return transaction(db, () => {
    const existing = db
      .prepare('SELECT * FROM orders WHERE user_id=? AND idempotency_key=?')
      .get(userId, checkout.idempotencyKey);
    if (existing) {
      if (existing.request_hash !== requestHash) throw new HttpError(409, 'idempotency_conflict');
      return { order: publicOrder(existing, db), replay: true };
    }
    const lines = checkout.lines.map((line) => {
      const variant = db.prepare('SELECT * FROM variants WHERE id=?').get(line.variantId);
      const product = variant && getProduct(db, variant.product_id);
      if (!product?.active) throw new HttpError(409, 'product_unavailable');
      const change = db
        .prepare('UPDATE variants SET stock=stock-? WHERE id=? AND stock>=?')
        .run(line.quantity, line.variantId, line.quantity);
      if (!change.changes) throw new HttpError(409, 'insufficient_stock');
      db.prepare('UPDATE products SET revision=revision+1 WHERE id=?').run(product.id);
      return {
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        variantLabel: JSON.parse(variant.label),
        image: product.image,
        quantity: line.quantity,
        unitPriceCents: variant.price_cents,
        subtotalCents: line.quantity * variant.price_cents,
      };
    });
    const id = randomUUID();
    const now = new Date().toISOString();
    const totalCents = lines.reduce((total, line) => total + line.subtotalCents, 0);
    db.prepare('INSERT INTO orders VALUES (?,?,?,?,?,?,?,?,?)').run(
      id,
      userId,
      checkout.idempotencyKey,
      requestHash,
      JSON.stringify(lines),
      totalCents,
      'pending',
      now,
      now,
    );
    const payment = demoReceipt(checkout, id, totalCents, now);
    if (payment)
      db.prepare('INSERT INTO demo_payments VALUES (?,?)').run(id, JSON.stringify(payment));
    message(db, userId, id, 'pending');
    return {
      order: publicOrder(db.prepare('SELECT * FROM orders WHERE id=?').get(id), db),
      replay: false,
    };
  });
}
export function transitionOrder(db, id, status) {
  if (db.kind === 'mongo') return db.transitionOrder(id, status);
  return transaction(db, () => {
    const order = db.prepare('SELECT * FROM orders WHERE id=?').get(id);
    if (!order) throw new HttpError(404, 'not_found');
    if (!transitions[order.status].includes(status)) throw new HttpError(409, 'invalid_transition');
    if (status === 'cancelled') {
      for (const line of JSON.parse(order.lines)) {
        const result = db
          .prepare('UPDATE variants SET stock=stock+? WHERE id=?')
          .run(line.quantity, line.variantId);
        if (!result.changes) throw new HttpError(409, 'variant_missing');
        db.prepare('UPDATE products SET revision=revision+1 WHERE id=?').run(line.productId);
      }
    }
    db.prepare('UPDATE orders SET status=?, updated_at=? WHERE id=?').run(
      status,
      new Date().toISOString(),
      id,
    );
    message(db, order.user_id, id, status);
    return publicOrder(db.prepare('SELECT * FROM orders WHERE id=?').get(id), db);
  });
}
export function ordersRouter(db) {
  const router = Router();
  router.use(requireUser);
  router.post('/checkout/demo', async (req, res) => {
    const input = parse(demoCheckoutSchema, req.body);
    const result = await createOrder(db, req.user.id, input);
    send(res, result.order, result.replay ? 200 : 201);
  });
  router.post('/orders', async (req, res) => {
    const result = await createOrder(db, req.user.id, req.body);
    send(res, result.order, result.replay ? 200 : 201);
  });
  router.get('/orders', async (req, res) =>
    send(
      res,
      db.kind === 'mongo'
        ? await db.getOrders(req.user.id)
        : db
            .prepare('SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC')
            .all(req.user.id)
            .map((row) => publicOrder(row, db)),
    ),
  );
  router.get('/orders/:id', async (req, res) => {
    if (db.kind === 'mongo') {
      const order = await db.getOrder(req.params.id, req.user.id);
      if (!order) throw new HttpError(404, 'not_found');
      return send(res, order);
    }
    const row = db
      .prepare('SELECT * FROM orders WHERE id=? AND user_id=?')
      .get(req.params.id, req.user.id);
    if (!row) throw new HttpError(404, 'not_found');
    send(res, publicOrder(row, db));
  });
  router.get('/messages', async (req, res) =>
    send(
      res,
      db.kind === 'mongo'
        ? await db.getMessages(req.user.id)
        : db
            .prepare('SELECT * FROM messages WHERE user_id=? ORDER BY created_at DESC')
            .all(req.user.id)
            .map((row) => ({
              id: row.id,
              orderId: row.order_id,
              createdAt: row.created_at,
              ...JSON.parse(row.data),
            })),
    ),
  );
  return router;
}
export function teamOrdersRouter(db) {
  const router = Router();
  router.use(requireTeam);
  router.get('/orders', async (req, res) =>
    send(
      res,
      db.kind === 'mongo'
        ? await db.getOrders()
        : db
            .prepare(
              'SELECT o.*,u.name AS customer_name FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC',
            )
            .all()
            .map((row) => ({ ...publicOrder(row, db), customerName: row.customer_name })),
    ),
  );
  router.patch('/orders/:id', async (req, res) => {
    const input = parse(z.object({ status: z.enum(orderStatuses) }).strict(), req.body);
    send(res, await transitionOrder(db, req.params.id, input.status));
  });
  return router;
}
