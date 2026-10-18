import test from 'node:test';
import assert from 'node:assert/strict';
import { formatMoney } from '@maison/contracts/money';
import { money } from '../../mobile/src/model.js';
import { products } from '../../data/catalog.js';
const normalize = (value) => value.replace(/\u00a0|\u202f/g, ' ');
test('Spanish euro amounts always group four digits and larger totals on web and mobile', () => {
  for (const [cents, expected] of [
    [0, '0,00 €'],
    [9500, '95,00 €'],
    [99999, '999,99 €'],
    [100000, '1.000,00 €'],
    [185000, '1.850,00 €'],
    [999999, '9.999,99 €'],
    [1000000, '10.000,00 €'],
    [123456789, '1.234.567,89 €'],
  ]) {
    assert.equal(normalize(formatMoney(cents, 'es')), expected);
    assert.equal(normalize(money(cents, 'es')), expected);
  }
  assert.equal(formatMoney(185000, 'en'), '€1,850.00');
});
test('every seeded catalogue variant follows the Spanish thousands and decimal convention', () => {
  const variants = products.flatMap((p) => p.variants);
  assert.ok(variants.length >= 996);
  for (const variant of variants) {
    const amount = normalize(formatMoney(variant.priceCents, 'es'));
    assert.match(amount, /^\d{1,3}(?:\.\d{3})*,\d{2} €$/);
    assert.equal(
      Number(amount.replace(' €', '').replaceAll('.', '').replace(',', '.')),
      variant.priceCents / 100,
    );
  }
});
