// Read-only smoke check. No accounts, orders or uploads are created.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

export async function checkDeployment(origin, { allowLocalHttp = false } = {}) {
  const base = new URL(origin);
  assert.equal(base.origin, origin, 'Use an origin without path or trailing slash');
  assert.ok(
    base.protocol === 'https:' ||
      (allowLocalHttp && base.protocol === 'http:' && base.hostname === '127.0.0.1'),
    'A public deployment requires HTTPS',
  );
  const get = async (route) => {
    const url = new URL(route, base);
    assert.equal(url.origin, origin, 'Resources must use the same origin');
    const response = await fetch(url, {
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    });
    return response;
  };
  let html;
  for (const route of ['/', '/catalog', '/runway', '/access', '/account']) {
    const response = await get(route);
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get('content-type') || '', /text\/html/, route);
    assert.match(response.headers.get('strict-transport-security') || '', /max-age=/);
    assert.match(response.headers.get('content-security-policy') || '', /default-src/);
    const body = await response.text();
    assert.match(body, /id="root"/, route);
    if (html === undefined) html = body;
    else assert.equal(body, html, route);
  }
  const assets = [...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map((match) => match[1]);
  assert.ok(
    assets.some((asset) => asset.endsWith('.js')),
    'Missing JS bundle',
  );
  assert.ok(
    assets.some((asset) => asset.endsWith('.css')),
    'Missing stylesheet',
  );
  for (const asset of assets) {
    const response = await get(asset);
    assert.equal(response.status, 200, asset);
    assert.doesNotMatch(response.headers.get('content-type') || '', /text\/html/, asset);
    await response.arrayBuffer();
  }
  const health = await get('/api/v1/health');
  assert.equal(health.status, 200);
  assert.equal(health.headers.get('cache-control'), 'no-store');
  assert.equal((await health.json()).data.mode, 'demo');
  const catalogue = await get('/api/v1/products');
  assert.equal(catalogue.status, 200);
  const items = (await catalogue.json()).data.items;
  assert.ok(items.length > 0, 'Empty catalogue');
  const image = await get(items[0].image);
  assert.equal(image.status, 200);
  assert.match(image.headers.get('content-type') || '', /^image\//);
  assert.ok((await image.arrayBuffer()).byteLength > 0);
  for (const route of ['/api/v1/orders', '/api/v1/team/products']) {
    const response = await get(route);
    assert.equal(response.status, 401, route);
    assert.match(response.headers.get('content-type') || '', /application\/json/);
    await response.arrayBuffer();
  }
  const missing = await get('/assets/maison-deployment-check-missing.js');
  assert.equal(missing.status, 404);
  await missing.arrayBuffer();
  return `5 SPA routes, ${assets.length} assets, headers, health, catalogue, image, private access and missing asset`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    assert.equal(
      process.argv.length,
      3,
      'Usage: npm run check:deployment -- https://your-maison-host',
    );
    console.log(`Deployment verified: ${await checkDeployment(process.argv[2])}.`);
    console.log(
      'Read-only check; purchase, upload, restart and persistence still require validation.',
    );
  } catch (error) {
    console.error(`Deployment check failed: ${error.message}`);
    process.exitCode = 1;
  }
}
