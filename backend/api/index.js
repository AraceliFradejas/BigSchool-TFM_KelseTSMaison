import { readConfig } from '../src/config.js';
import { connectMongo } from '../src/storage/runtime.js';
import { createApp } from '../src/app.js';

let application;
async function getApp() {
  application ??= (async () => {
    const config = readConfig();
    if (config.databaseProvider !== 'mongodb' || config.mediaStorage !== 'cloudinary')
      throw new Error('Serverless Maison requires MongoDB and Cloudinary.');
    return createApp({ db: await connectMongo(config), config: { ...config, serverless: true } });
  })().catch((error) => {
    application = undefined;
    throw error;
  });
  return application;
}
export default async function handler(req, res) {
  try {
    return (await getApp())(req, res);
  } catch {
    // Never return connection strings, cloud credentials or provider errors.
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ success: false, error: 'service_unavailable' }));
  }
}
