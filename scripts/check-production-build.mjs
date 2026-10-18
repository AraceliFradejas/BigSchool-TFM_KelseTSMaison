// Validate the real Vite build through Express, using disposable data and a loopback port.
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../backend/src/app.js';
import { openDatabase, seedDatabase } from '../backend/src/db.js';
import { checkDeployment } from './check-deployment.mjs';

const frontendDir = fileURLToPath(new URL('../frontend/dist/', import.meta.url));
let index;
try {
  index = readFileSync(path.join(frontendDir, 'index.html'), 'utf8');
} catch {
  throw new Error('Build missing. Run npm run build before npm run check:production.');
}
const dir = mkdtempSync(path.join(tmpdir(), 'maison-built-check-'));
let db;
let server;
try {
  db = openDatabase(path.join(dir, 'maison.sqlite'));
  seedDatabase(db);
  const app = createApp({
    db,
    config: {
      production: true,
      origin: 'https://maison.example.test',
      uploadDir: path.join(dir, 'uploads'),
      frontendDir,
      mediaDir: path.join(frontendDir, 'media'),
      trustProxy: false,
    },
    limits: false,
  });
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  console.log(`Deployment smoke check: ${await checkDeployment(base, { allowLocalHttp: true })}.`);
  const get = (route) => fetch(`${base}${route}`, { signal: AbortSignal.timeout(10000) });
  for (const route of ['/', '/catalog', '/products/satin-story', '/runway', '/access']) {
    const response = await get(route);
    assert.equal(response.status, 200, route);
    assert.equal(await response.text(), index, route);
  }
  const assets = [...index.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map((match) => match[1]);
  assert.ok(
    assets.some((asset) => asset.endsWith('.js')),
    'Build must reference JavaScript',
  );
  assert.ok(
    assets.some((asset) => asset.endsWith('.css')),
    'Build must reference CSS',
  );
  for (const asset of assets) {
    const response = await get(asset);
    assert.equal(response.status, 200, asset);
    assert.doesNotMatch(response.headers.get('content-type') || '', /text\/html/, asset);
    await response.arrayBuffer();
  }
  const health = await get('/api/v1/health');
  assert.equal(health.status, 200);
  assert.equal((await health.json()).data.mode, 'demo');
  const catalogue = await get('/api/v1/products');
  assert.equal(catalogue.status, 200);
  const payload = await catalogue.json();
  assert.ok(payload.data.items.length > 0);
  const image = await get(payload.data.items[0].image);
  assert.equal(image.status, 200);
  assert.match(image.headers.get('content-type'), /^image\//);
  await image.arrayBuffer();
  const missing = await get('/assets/missing.js');
  assert.equal(missing.status, 404);
  console.log(
    `Production build verified: 5 SPA routes, ${assets.length} assets, health, catalogue and product image.`,
  );
  console.log(
    'Local HTTP check with production configuration; public HTTPS and Docker are not tested.',
  );
} finally {
  if (server?.listening)
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  db?.close();
  rmSync(dir, { recursive: true, force: true });
}
