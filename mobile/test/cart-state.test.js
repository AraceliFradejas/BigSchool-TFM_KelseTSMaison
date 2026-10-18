import test from 'node:test';
import assert from 'node:assert/strict';
import { cartStorageKey, restoreCart, combineGuestBag } from '../src/cart-state.js';
const key = '00000000-0000-4000-8000-000000000001';
const line = { productId: 'dress', variantId: 'dress-m', quantity: 2 };
test('cart survives retry with the same attempt key and isolates account storage', () => {
  assert.deepEqual(
    restoreCart(JSON.stringify({ key, lines: [{ ...line, priceCents: 1 }] }), () => 'new'),
    { key, lines: [line] },
  );
  assert.notEqual(cartStorageKey('one'), cartStorageKey('two'));
  assert.notEqual(cartStorageKey('one'), cartStorageKey(null));
  assert.deepEqual(
    restoreCart('broken', () => key),
    { key, lines: [] },
  );
  assert.deepEqual(
    restoreCart(JSON.stringify([line]), () => key),
    { key, lines: [line] },
  );
});
test('guest merge creates a fresh attempt, caps quantities and leaves both originals unchanged', () => {
  const own = { key, lines: [line] };
  const guest = { key, lines: [{ ...line, quantity: 9 }] };
  const result = combineGuestBag(own, guest, () => 'new');
  assert.equal(result.key, 'new');
  assert.equal(result.lines[0].quantity, 10);
  assert.equal(own.lines[0].quantity, 2);
  assert.equal(guest.lines[0].quantity, 9);
  assert.equal(
    combineGuestBag(own, { lines: [] }, () => 'new'),
    own,
  );
});
