import { readConfig } from '../src/config.js';
import { openDatabase, seedDatabase } from '../src/db.js';
const db = openDatabase(readConfig().databasePath);
console.log(`${seedDatabase(db)} products inserted. Existing data preserved.`);
db.close();
