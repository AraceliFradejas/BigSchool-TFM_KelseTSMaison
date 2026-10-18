import { createHash } from 'node:crypto';
import { HttpError } from '../http.js';
export function checkoutHash(checkout) {
  const lines = [...checkout.lines].sort((a, b) => a.variantId.localeCompare(b.variantId));
  const value = checkout.payment
    ? { lines, payment: checkout.payment, expectedTotalCents: checkout.expectedTotalCents }
    : lines;
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
export function demoReceipt(checkout, id, totalCents, createdAt) {
  if (!checkout.payment) return null;
  if (checkout.payment.outcome === 'declined') throw new HttpError(409, 'demo_payment_declined');
  if (checkout.expectedTotalCents !== totalCents) throw new HttpError(409, 'price_changed');
  return {
    mode: 'demo',
    status: 'simulated',
    method: checkout.payment.method,
    reference: `DEMO-${id.toUpperCase()}`,
    amountCents: totalCents,
    chargedCents: 0,
    currency: 'EUR',
    createdAt,
  };
}
