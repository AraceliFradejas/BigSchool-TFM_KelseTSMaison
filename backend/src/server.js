import { readConfig } from './config.js';
import { openDatabase, seedDatabase } from './db.js';
import { createApp } from './app.js';
const config = readConfig();
const db = openDatabase(config.databasePath);
seedDatabase(db);
const server = createApp({ db, config }).listen(config.port, config.host, () =>
  console.log(`Maison API: http://${config.host}:${config.port}/api/v1/health`),
);
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
