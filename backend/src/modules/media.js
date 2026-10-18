import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import catalogImages from '../../../frontend/src/shared/catalog-images.json' with { type: 'json' };
import { createCloudinaryStorage, fetchCloudinaryImage } from '../storage/cloudinary.js';
import { Router } from 'express';
import multer from 'multer';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { requireTeam } from './auth.js';
import { HttpError, send } from '../http.js';
export function mediaRouter(uploadDir, { db, config = {}, cloudStorage } = {}) {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024, files: 1, fields: 0 },
  });
  router.post('/images', requireTeam, upload.single('image'), async (req, res) => {
    const file = req.file;
    if (!file) throw new HttpError(400, 'invalid_image');
    const buffer = file.buffer;
    let extension;
    if (
      buffer.length > 12 &&
      buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
      extension = 'png';
    else if (buffer.length > 12 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255)
      extension = 'jpg';
    else if (
      buffer.length > 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    )
      extension = 'webp';
    if (!extension) throw new HttpError(400, 'invalid_image');
    let normalized;
    try {
      normalized = await sharp(buffer, { limitInputPixels: 20000000, animated: false })
        .rotate()
        .resize({ width: 1600, height: 2000, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      throw new HttpError(400, 'invalid_image');
    }
    if (normalized.length > 4 * 1024 * 1024) throw new HttpError(413, 'file_too_large');
    const id = randomUUID();
    const name = `${id}.webp`;
    if (config.mediaStorage === 'cloudinary') {
      const storage = cloudStorage || createCloudinaryStorage(config.cloudinary);
      const publicId = `${config.cloudinary.folder}/${id}`;
      await storage.upload(normalized, publicId);
      try {
        await db.saveImage({ id, publicId, createdAt: new Date().toISOString() });
      } catch (error) {
        await storage
          .destroy(publicId)
          .catch(() => console.warn('Maison: new image cleanup failed.'));
        throw error;
      }
      return send(res, { image: `/api/v1/images/${name}` }, 201);
    }
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, name), normalized, { flag: 'wx' });
    send(res, { image: `/uploads/${name}` }, 201);
  });
  return router;
}

export function imageDeliveryRouter(db, config, fetchImage) {
  const router = Router();
  router.get('/images/:name', async (req, res) => {
    if (!/^[a-f0-9-]{36}\.webp$/.test(req.params.name)) throw new HttpError(404, 'not_found');
    const record = await db.findImage(req.params.name.slice(0, -5));
    if (!record) throw new HttpError(404, 'not_found');
    const image = await fetchCloudinaryImage(record, config.cloudinary, fetchImage);
    res.set('Cache-Control', 'public, max-age=300').type(image.type).send(image.buffer);
  });
  return router;
}
export async function validateProductImage(image, config, db) {
  if (image.startsWith('/api/v1/images/')) {
    if (db.kind !== 'mongo' || !(await db.findImage(path.basename(image, '.webp'))))
      throw new HttpError(400, 'invalid_image');
    return;
  }
  if (config.serverless) {
    if (!Object.hasOwn(catalogImages, image)) throw new HttpError(400, 'invalid_image');
    return;
  }
  const directory = image.startsWith('/uploads/')
    ? config.uploadDir
    : config.mediaDir || fileURLToPath(new URL('../../../frontend/public/media', import.meta.url));
  if (!existsSync(path.join(directory, path.basename(image))))
    throw new HttpError(400, 'invalid_image');
}
