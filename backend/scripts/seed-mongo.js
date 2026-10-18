import { openMongo } from '../src/storage/mongo.js';
// Seeding MongoDB does not require Cloudinary to be configured yet.
if (process.env.DATABASE_PROVIDER !== 'mongodb')
  throw new Error('Set DATABASE_PROVIDER=mongodb first.');
const db = await openMongo({
  mongoUri: process.env.MONGODB_URI,
  mongoDatabase: process.env.MONGODB_DATABASE,
});
try {
  console.log(`Maison: ${await db.seed()} new products seeded. Existing data preserved.`);
} finally {
  await db.close();
}
