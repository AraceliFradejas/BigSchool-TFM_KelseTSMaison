import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fulfillmentSchema,
  fulfillmentSnapshot,
  postalCodeCovered,
  fulfillmentLines,
} from '@maison/contracts/fulfillment';
import {
  demoBoutiques,
  distanceKm,
  distanceLabel,
  streetViewUrl,
  boutiqueMapUrl,
} from '@maison/contracts/boutiques';
const pickup = { method: 'pickup', recipientName: 'Alex Maison', boutiqueId: 'madrid-milla-oro' };
const home = {
  method: 'home',
  recipientName: 'Alex Maison',
  address: {
    street: 'Calle Ficticia, 10',
    city: 'Madrid',
    area: 'madrid',
    country: 'ES',
    postalCode: '28001',
  },
};
test('delivery accepts only the selected coverage and known fictional boutiques', () => {
  for (const [area, code] of [
    ['madrid', '28001'],
    ['madrid', '28922'],
    ['barcelona', '08001'],
    ['barcelona', '08042'],
    ['marbella', '29602'],
    ['marbella', '29660'],
    ['marbella', '29670'],
  ])
    assert.equal(postalCodeCovered(area, code), true);
  for (const [area, code] of [
    ['madrid', '08001'],
    ['madrid', '28000'],
    ['barcelona', '08100'],
    ['barcelona', '08000'],
    ['marbella', '29001'],
    ['marbella', '29678'],
    ['other', '28001'],
  ])
    assert.equal(postalCodeCovered(area, code), false);
  assert.equal(fulfillmentSchema.safeParse(home).success, true);
  for (const b of demoBoutiques)
    assert.equal(fulfillmentSchema.safeParse({ ...pickup, boutiqueId: b.id }).success, true);
  for (const invalid of [
    { ...pickup, boutiqueId: 'real-store' },
    { ...home, recipientName: ' ' },
    { ...home, address: { ...home.address, postalCode: '08001' } },
    { ...pickup, estimatedTo: '2026-10-19' },
    { ...pickup, latitude: 40.4, longitude: -3.7 },
    { ...pickup, address: home.address },
  ])
    assert.equal(fulfillmentSchema.safeParse(invalid).success, false);
});
test('estimated dates skip weekends, use the Madrid calendar and snapshot the selected boutique', () => {
  const friday = '2026-10-16T10:00:00Z';
  const first = fulfillmentSnapshot(pickup, friday);
  assert.equal(first.estimatedFrom, '2026-10-19');
  assert.equal(first.estimatedTo, '2026-10-20');
  assert.equal(first.shippingCents, 0);
  assert.equal(first.boutique.name, 'Maison · Milla de Oro');
  const delivery = fulfillmentSnapshot(home, friday);
  assert.equal(delivery.estimatedFrom, '2026-10-21');
  assert.equal(delivery.estimatedTo, '2026-10-23');
  assert.equal(fulfillmentSnapshot(pickup, '2026-10-18T22:30:00Z').estimatedFrom, '2026-10-20');
  first.boutique.name = 'Changed';
  assert.equal(demoBoutiques[0].name, 'Maison · Milla de Oro');
  assert.ok(fulfillmentLines(delivery, 'es').some((line) => line.includes('21/10/2026')));
});
test('distances are geodesic and street links carry only the public boutique point', () => {
  const madrid = demoBoutiques[0],
    barcelona = demoBoutiques[1];
  assert.equal(distanceKm(madrid, madrid), 0);
  assert.equal(
    distanceLabel({ latitude: 0, longitude: 0 }, madrid, 'en'),
    distanceLabel({ latitude: 0, longitude: 0 }, madrid, 'es'),
  );
  assert.match(distanceLabel({ latitude: 0, longitude: 0 }, madrid, 'en'), /\d\.\d{3}/);
  const km = distanceKm(madrid, barcelona);
  assert.ok(km > 490 && km < 520);
  assert.ok(Math.abs(km - distanceKm(barcelona, madrid)) < 0.000001);
  assert.throws(() => distanceKm({ latitude: NaN, longitude: 0 }, madrid), RangeError);
  for (const b of demoBoutiques) {
    const street = new URL(streetViewUrl(b));
    assert.equal(street.searchParams.get('map_action'), 'pano');
    assert.equal(street.searchParams.get('viewpoint'), `${b.latitude},${b.longitude}`);
    assert.equal(
      new URL(boutiqueMapUrl(b)).searchParams.get('query'),
      `${b.latitude},${b.longitude}`,
    );
  }
});
