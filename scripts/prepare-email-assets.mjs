import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { products } from '../data/catalog.js';
const target = new URL('../backend/assets/email/', import.meta.url);
await mkdir(new URL('pieces/', target), { recursive: true });
await sharp(fileURLToPath(new URL('../mobile/assets/splash-logo.png', import.meta.url)))
  .resize(400)
  .flatten({ background: '#fffaf3' })
  .png()
  .toFile(fileURLToPath(new URL('logo.png', target)));
const manifest = {};
for (const product of products) {
  if (!/^\/media\/[a-z0-9-]+\.webp$/.test(product.image)) continue;
  await sharp(fileURLToPath(new URL('../frontend/public' + product.image, import.meta.url)))
    .resize(240, 300, { fit: 'cover' })
    .jpeg({ quality: 78 })
    .toFile(fileURLToPath(new URL('pieces/' + product.id + '.jpg', target)));
  manifest[product.id] = { source: product.image, file: 'pieces/' + product.id + '.jpg' };
}
await writeFile(new URL('manifest.json', target), JSON.stringify(manifest, null, 2) + '\n');
console.log(
  'Email assets prepared: logo and ' + Object.keys(manifest).length + ' catalogue thumbnails.',
);
