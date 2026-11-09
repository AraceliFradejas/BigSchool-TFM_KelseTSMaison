import { openDatabase, seedDatabase } from '../backend/src/db.js';
import { createApp } from '../backend/src/app.js';
import { hashPassword } from '../backend/src/modules/auth.js';
const root = decodeURIComponent(new URL('../', import.meta.url).pathname);
const testPassword = process.env.MAISON_TEST_PASSWORD;
if (!testPassword || testPassword.length < 10)
  throw new Error('Set MAISON_TEST_PASSWORD (10+ characters), for disposable local accounts only.');
const db = openDatabase(process.env.MAISON_TEST_DATABASE || '/tmp/maison-insomnia.sqlite');
seedDatabase(db);
for (const [id, email, role] of [
  ['preview-customer', 'preview@maison.example', 'customer'],
  ['preview-team', 'team@maison.example', 'team'],
  ['preview-other', 'other@maison.example', 'customer'],
]) {
  if (!db.prepare('SELECT id FROM users WHERE id=?').get(id))
    db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?)').run(
      id,
      'Maison Demo',
      email,
      await hashPassword(testPassword),
      role,
      new Date().toISOString(),
    );
}
createApp({
  db,
  limits: false,
  config: {
    production: false,
    origin: 'http://127.0.0.1:3179',
    uploadDir: '/tmp/maison-email-uploads',
    frontendDir: root + '/frontend/dist',
    mediaDir: root + '/frontend/public/media',
    trustProxy: false,
  },
}).listen(3179, '127.0.0.1', () => console.log('Isolated Maison preview http://127.0.0.1:3179'));
