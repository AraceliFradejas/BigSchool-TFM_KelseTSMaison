import { openStore } from '../src/storage/runtime.js';
import { readConfig } from '../src/config.js';
const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes('@')) {
  console.error('Usage: npm run team:grant -- your-registered-email');
  process.exit(1);
}
const db = await openStore(readConfig());
const change =
  db.kind === 'mongo'
    ? { changes: (await db.grantTeam(email)).matchedCount }
    : db.prepare("UPDATE users SET role='team' WHERE email=?").run(email);
await db.close();
if (!change.changes) {
  console.error('Register this account in Maison first.');
  process.exit(1);
}
console.log('Team access granted to the selected Maison account.');
