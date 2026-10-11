import { Router } from 'express';
import { randomUUID, createHash } from 'node:crypto';
import { z } from 'zod';
import { checkoutSchema, orderStatuses, transitions } from '@maison/contracts';
import { HttpError, parse, send } from '../http.js';
import { transaction } from '../db.js';
import { getProduct } from './catalog.js';
import { requireUser, requireTeam } from './auth.js';

const publicOrder = (row) => ({
  id: row.id,
  lines: JSON.parse(row.lines),
  totalCents: row.total_cents,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  demo: true,
});
function message(db, userId, orderId, status) {
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
  db.prepare('INSERT INTO messages VALUES (?,?,?,?,?)').run(
    randomUUID(),
    userId,
    orderId,
    JSON.stringify({ title: titles[status], body: descriptions[status] }),
    new Date().toISOString(),
  );
}
export function createOrder(db, userId, input) {
  const checkout = parse(checkoutSchema, input);
  const requestHash = createHash('sha256')
    .update(
      JSON.stringify([...checkout.lines].sort((a, b) => a.variantId.localeCompare(b.variantId))),
    )
    .digest('hex');
  return transaction(db, () => {
    const existing = db
      .prepare('SELECT * FROM orders WHERE user_id=? AND idempotency_key=?')
      .get(userId, checkout.idempotencyKey);
    if (existing) {
      if (existing.request_hash !== requestHash) throw new HttpError(409, 'idempotency_conflict');
      return { order: publicOrder(existing), replay: true };
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
    message(db, userId, id, 'pending');
    return {
      order: publicOrder(db.prepare('SELECT * FROM orders WHERE id=?').get(id)),
      replay: false,
    };
  });
}
export function transitionOrder(db, id, status) {
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
    return publicOrder(db.prepare('SELECT * FROM orders WHERE id=?').get(id));
  });
}
export function ordersRouter(db) {
  const router = Router();
  router.use(requireUser);
  router.post('/orders', (req, res) => {
    const result = createOrder(db, req.user.id, req.body);
    send(res, result.order, result.replay ? 200 : 201);
  });
  router.get('/orders', (req, res) =>
    send(
      res,
      db
        .prepare('SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC')
        .all(req.user.id)
        .map(publicOrder),
    ),
  );
  router.get('/orders/:id', (req, res) => {
    const row = db
      .prepare('SELECT * FROM orders WHERE id=? AND user_id=?')
      .get(req.params.id, req.user.id);
    if (!row) throw new HttpError(404, 'not_found');
    send(res, publicOrder(row));
  });
  router.get('/messages', (req, res) =>
    send(
      res,
      db
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
  router.get('/orders', (req, res) =>
    send(
      res,
      db
        .prepare(
          'SELECT o.*,u.name AS customer_name FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC',
        )
        .all()
        .map((row) => ({ ...publicOrder(row), customerName: row.customer_name })),
    ),
  );
  router.patch('/orders/:id', (req, res) => {
    const input = parse(z.object({ status: z.enum(orderStatuses) }).strict(), req.body);
    send(res, transitionOrder(db, req.params.id, input.status));
  });
  return router;
}
