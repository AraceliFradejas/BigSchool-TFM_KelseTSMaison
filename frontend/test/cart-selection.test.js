import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeCartSelection } from '../src/shared/cart-selection.js';
const piece = (id, stock = 4) => {
  const variant = { id: `${id}-m`, stock };
  return { product: { id, active: true, variants: [variant] }, variant };
};
test('a complete outfit merges with existing quantities without changing the original cart', () => {
  const original = [{ productId: 'coat', variantId: 'coat-m', quantity: 1 }];
  const merged = mergeCartSelection(original, [piece('coat'), piece('shirt'), piece('shoes')]);
  assert.equal(merged.length, 3);
  assert.equal(merged[0].quantity, 2);
  assert.equal(original[0].quantity, 1);
});
test('an unavailable piece rejects the whole outfit without partial additions', () => {
  const original = [{ productId: 'coat', variantId: 'coat-m', quantity: 1 }];
  assert.throws(
    () => mergeCartSelection(original, [piece('shirt'), piece('shoes', 0)]),
    /insufficient_stock/,
  );
  assert.deepEqual(original, [{ productId: 'coat', variantId: 'coat-m', quantity: 1 }]);
});
test('stock and 30-line limits include the existing cart and repeated selections', () => {
  assert.throws(
    () =>
      mergeCartSelection(
        [{ productId: 'coat', variantId: 'coat-m', quantity: 4 }],
        [piece('coat')],
      ),
    /insufficient_stock/,
  );
  const lines = Array.from({ length: 29 }, (_, i) => ({
    productId: `p${i}`,
    variantId: `p${i}-m`,
    quantity: 1,
  }));
  assert.throws(() => mergeCartSelection(lines, [piece('shirt'), piece('shoes')]), /invalid_input/);
  assert.equal(lines.length, 29);
  assert.throws(
    () => mergeCartSelection([], [piece('coat', 1), piece('coat', 1)]),
    /insufficient_stock/,
  );
});
