import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
const backendRoot = fileURLToPath(new URL('../', import.meta.url));
export function readConfig() {
  const production = process.env.NODE_ENV === 'production';
  if (production && !process.env.APP_ORIGIN)
    throw new Error('APP_ORIGIN is required in production');
  const origin = process.env.APP_ORIGIN || 'http://127.0.0.1:5173';
  const url = new URL(origin);
  if (origin !== url.origin || (production && url.protocol !== 'https:'))
    throw new Error('APP_ORIGIN must be an origin (HTTPS in production)');
  const frontendDir = fileURLToPath(new URL('../../frontend/dist', import.meta.url));
  const mediaDir = existsSync(path.join(frontendDir, 'media'))
    ? path.join(frontendDir, 'media')
    : fileURLToPath(new URL('../../frontend/public/media', import.meta.url));
  return {
    production,
    origin,
    port: Number(process.env.PORT || 3000),
    host: process.env.HOST || '127.0.0.1',
    databasePath: path.resolve(backendRoot, process.env.DATABASE_PATH || 'runtime/maison.sqlite'),
    uploadDir: path.resolve(backendRoot, process.env.UPLOAD_DIR || 'runtime/uploads'),
    frontendDir,
    mediaDir,
    trustProxy: process.env.TRUST_PROXY === '1',
  };
}
