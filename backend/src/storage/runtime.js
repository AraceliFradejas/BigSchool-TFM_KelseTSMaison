import { openMongo } from './mongo.js';

let connection;
export function connectMongo(config) {
  connection ??= openMongo(config).catch((error) => {
    connection = undefined;
    throw error;
  });
  return connection;
}
export async function openStore(config) {
  if (config.databaseProvider === 'mongodb') return connectMongo(config);
  // SQLite stays available for isolated local demos and existing migrations only.
  const { openDatabase, seedDatabase } = await import('../db.js');
  const db = openDatabase(config.databasePath);
  seedDatabase(db);
  return db;
}
