import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
const backendRoot = fileURLToPath(new URL('../', import.meta.url));
export function readConfig() {
  const serverless = process.env.VERCEL === '1';
  const databaseProvider = process.env.DATABASE_PROVIDER || (serverless ? 'mongodb' : 'sqlite');
  if (
    !['sqlite', 'mongodb'].includes(databaseProvider) ||
    (serverless && databaseProvider !== 'mongodb')
  )
    throw new Error('Vercel requires DATABASE_PROVIDER=mongodb.');
  if (databaseProvider === 'mongodb' && (!process.env.MONGODB_URI || !process.env.MONGODB_DATABASE))
    throw new Error('MONGODB_URI and MONGODB_DATABASE are required for Maison.');
  const mediaStorage =
    process.env.MEDIA_STORAGE || (databaseProvider === 'mongodb' ? 'cloudinary' : 'local');
  if (
    !['local', 'cloudinary'].includes(mediaStorage) ||
    (serverless && mediaStorage !== 'cloudinary') ||
    (mediaStorage === 'cloudinary' && databaseProvider !== 'mongodb')
  )
    throw new Error('Cloudinary requires MongoDB; Vercel requires Cloudinary.');
  const cloudinary = {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || 'kelsets-maison/team',
  };
  if (
    mediaStorage === 'cloudinary' &&
    (!/^[a-zA-Z0-9_-]+$/.test(cloudinary.cloudName || '') ||
      !cloudinary.apiKey ||
      !cloudinary.apiSecret ||
      !/^kelsets-maison(?:\/[a-zA-Z0-9_-]+)*$/.test(cloudinary.folder))
  )
    throw new Error('Configure Maison Cloudinary credentials and a kelsets-maison folder.');
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
    serverless,
    databaseProvider,
    mediaStorage,
    cloudinary,
    mongoUri: process.env.MONGODB_URI,
    mongoDatabase: process.env.MONGODB_DATABASE,
    origin,
    port: Number(process.env.PORT || 3000),
    host: process.env.HOST || '127.0.0.1',
    databasePath: path.resolve(backendRoot, process.env.DATABASE_PATH || 'runtime/maison.sqlite'),
    uploadDir: path.resolve(backendRoot, process.env.UPLOAD_DIR || 'runtime/uploads'),
    frontendDir,
    mediaDir,
    trustProxy: serverless || process.env.TRUST_PROXY === '1',
  };
}
