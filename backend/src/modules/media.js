import { Router } from 'express';
import multer from 'multer';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { requireTeam } from './auth.js';
import { HttpError, send } from '../http.js';
export function mediaRouter(uploadDir) {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 },
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
    const name = `${randomUUID()}.webp`;
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, name), normalized, { flag: 'wx' });
    send(res, { image: `/uploads/${name}` }, 201);
  });
  return router;
}
