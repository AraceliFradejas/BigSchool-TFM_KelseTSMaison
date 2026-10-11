import { openDatabase } from '../src/db.js';
import { readConfig } from '../src/config.js';
const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes('@')) {
  console.error('Usage: npm run team:grant -- your-registered-email');
  process.exit(1);
}
const db = openDatabase(readConfig().databasePath);
const change = db.prepare("UPDATE users SET role='team' WHERE email=?").run(email);
db.close();
if (!change.changes) {
  console.error('Register this account in Maison first.');
  process.exit(1);
}
console.log('Team access granted to the selected local account.');
