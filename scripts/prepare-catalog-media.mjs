import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { products } from '../data/catalog.js';

const images = {};
for (const image of new Set(products.map((product) => product.image))) {
  const filename = fileURLToPath(new URL(`../frontend/public${image}`, import.meta.url));
  const metadata = await sharp(filename).metadata();
  images[image] = metadata.width;
  await sharp(filename)
    .resize({ width: 600, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(filename.replace('.webp', '-small.webp'));
}
await writeFile(
  new URL('../frontend/src/shared/catalog-images.json', import.meta.url),
  JSON.stringify(images, null, 2) + '\n',
);
console.log(`${products.length} responsive product images prepared.`);
