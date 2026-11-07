import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
const backendRoot = fileURLToPath(new URL('../', import.meta.url));
export function readConfig(env = process.env) {
  const serverless = env.VERCEL === '1';
  const databaseProvider = env.DATABASE_PROVIDER || (serverless ? 'mongodb' : 'sqlite');
  if (
    !['sqlite', 'mongodb'].includes(databaseProvider) ||
    (serverless && databaseProvider !== 'mongodb')
  )
    throw new Error('Vercel requires DATABASE_PROVIDER=mongodb.');
  if (databaseProvider === 'mongodb' && (!env.MONGODB_URI || !env.MONGODB_DATABASE))
    throw new Error('MONGODB_URI and MONGODB_DATABASE are required for Maison.');
  const mediaStorage =
    env.MEDIA_STORAGE || (databaseProvider === 'mongodb' ? 'cloudinary' : 'local');
  if (
    !['local', 'cloudinary'].includes(mediaStorage) ||
    (serverless && mediaStorage !== 'cloudinary') ||
    (mediaStorage === 'cloudinary' && databaseProvider !== 'mongodb')
  )
    throw new Error('Cloudinary requires MongoDB; Vercel requires Cloudinary.');
  const cloudinary = {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
    folder: env.CLOUDINARY_FOLDER || 'kelsets-maison/team',
  };
  if (
    mediaStorage === 'cloudinary' &&
    (!/^[a-zA-Z0-9_-]+$/.test(cloudinary.cloudName || '') ||
      !cloudinary.apiKey ||
      !cloudinary.apiSecret ||
      !/^kelsets-maison(?:\/[a-zA-Z0-9_-]+)*$/.test(cloudinary.folder))
  )
    throw new Error('Configure Maison Cloudinary credentials and a kelsets-maison folder.');
  const production = serverless || env.NODE_ENV === 'production';
  if (production && !env.APP_ORIGIN) throw new Error('APP_ORIGIN is required in production');
  const origin = env.APP_ORIGIN || 'http://127.0.0.1:5173';
  let url;
  try {
    url = new URL(origin);
  } catch {
    // URL parser errors can retain the raw input; do not expose configuration values.
    throw new Error('APP_ORIGIN must be a valid HTTP(S) origin.');
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    origin !== url.origin ||
    (production && url.protocol !== 'https:')
  )
    throw new Error('APP_ORIGIN must be an origin (HTTPS in production)');
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('PORT must be an integer between 1 and 65535.');
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
    mongoUri: env.MONGODB_URI,
    mongoDatabase: env.MONGODB_DATABASE,
    origin,
    port,
    host: env.HOST || '127.0.0.1',
    databasePath: path.resolve(backendRoot, env.DATABASE_PATH || 'runtime/maison.sqlite'),
    uploadDir: path.resolve(backendRoot, env.UPLOAD_DIR || 'runtime/uploads'),
    frontendDir,
    mediaDir,
    trustProxy: serverless || env.TRUST_PROXY === '1',
  };
}
