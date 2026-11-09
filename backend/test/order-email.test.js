import test from 'node:test';
import assert from 'node:assert/strict';
import { orderMessage } from '../src/domain/order-messages.js';

test('every order event has a bilingual, fictional and explicitly unsent email snapshot', () => {
  const order = {
    id: 'demo-order',
    totalCents: 185000,
    lines: [
      {
        name: { es: 'Vestido <especial>', en: 'Special dress' },
        variantLabel: { es: 'M · Negro', en: 'M · Black' },
        quantity: 1,
        subtotalCents: 185000,
      },
    ],
  };
  for (const status of ['pending', 'confirmed', 'dispatched', 'delivered', 'cancelled']) {
    const { email } = orderMessage(status, order);
    assert.equal(email.orderStatus, status);
    assert.equal(email.deliveryStatus, 'not_sent');
    assert.equal(email.to, 'cliente@maison.example');
    assert.ok(email.subject.es.startsWith('[DEMO]'));
    assert.match(email.body.es, /Cargo real: 0,00/);
    assert.match(email.body.en, /Actual charge: 0,00/);
    assert.ok(email.body.es.includes('Vestido <especial>'));
    assert.ok(email.body.en.includes('M · Black'));
    assert.ok(email.body.es.includes('1.850,00'));
  }
  assert.match(orderMessage('cancelled', order).email.body.es, /cancelado/);
});
