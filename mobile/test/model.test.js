import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreBag, resolveBag, addToBag, serviceLocation, imageUrl } from '../src/model.js';
const product = {
  id: 'dress',
  active: true,
  variants: [{ id: 'dress-m', priceCents: 1000, stock: 2 }],
};
test('persist only identifiers and quantities; reject corrupt or duplicate bags', () => {
  assert.deepEqual(
    restoreBag(
      JSON.stringify([{ productId: 'dress', variantId: 'dress-m', quantity: 1, priceCents: 1 }]),
    ),
    [{ productId: 'dress', variantId: 'dress-m', quantity: 1 }],
  );
  for (const value of [
    'broken',
    'null',
    '{}',
    JSON.stringify([{ productId: 'dress', variantId: 'dress-m', quantity: -1 }]),
    JSON.stringify(Array(2).fill({ productId: 'dress', variantId: 'dress-m', quantity: 1 })),
  ])
    assert.deepEqual(restoreBag(value), []);
});
test('bag uses current API prices and flags stock loss, missing or archived pieces', () => {
  const lines = addToBag([], product, 'dress-m');
  assert.equal(resolveBag(lines, [product])[0].totalCents, 1000);
  assert.equal(
    resolveBag(lines, [
      { ...product, variants: [{ ...product.variants[0], priceCents: 1200, stock: 0 }] },
    ])[0].valid,
    false,
  );
  assert.equal(resolveBag(lines, [{ ...product, active: false }])[0].valid, false);
  assert.equal(resolveBag(lines, [])[0].valid, false);
  assert.throws(
    () => addToBag([...lines.map((l) => ({ ...l, quantity: 2 }))], product, 'dress-m'),
    /insufficient_stock/,
  );
});
test('mobile uses public HTTPS API and same-origin image paths', () => {
  assert.equal(serviceLocation().origin, 'https://kelsets-maison.vercel.app');
  for (const url of [
    'http://example.com/api/v1',
    'https://a:b@example.com/api/v1',
    'https://example.com/api/v1?secret=x',
  ])
    assert.throws(() => serviceLocation(url));
  assert.ok(imageUrl('/media/satin-story.webp').startsWith('https://kelsets-maison.vercel.app/'));
  assert.equal(imageUrl('https://third-party.example/photo.jpg'), undefined);
});

test('complete outfits require an explicit available variant for every piece', async () => {
  const { outfitSelection } = await import('../src/model.js');
  const look = {
    complete: true,
    products: [
      product,
      { ...product, id: 'coat', variants: [{ id: 'coat-s', stock: 1, priceCents: 2000 }] },
    ],
  };
  assert.throws(() => outfitSelection(look, { dress: 'dress-m' }), /insufficient_stock/);
  assert.throws(() => outfitSelection({ ...look, complete: false }, {}), /invalid_input/);
  const pieces = outfitSelection(look, { dress: 'dress-m', coat: 'coat-s' });
  const { mergeCartSelection } = await import('@maison/contracts/cart-selection');
  assert.equal(mergeCartSelection([], pieces).length, 2);
  const original = [{ productId: 'coat', variantId: 'coat-s', quantity: 1 }];
  assert.throws(() => mergeCartSelection(original, pieces), /insufficient_stock/);
  assert.equal(original.length, 1);
  assert.equal(original[0].quantity, 1);
});
