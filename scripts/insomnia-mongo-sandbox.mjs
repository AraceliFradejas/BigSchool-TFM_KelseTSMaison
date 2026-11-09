// Disposable MongoDB replica set, never Atlas. No .env or production services loaded.
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { openMongo } from '../backend/src/storage/mongo.js';
import { createApp } from '../backend/src/app.js';
import { hashPassword } from '../backend/src/modules/auth.js';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { writeFileSync } from 'node:fs';
const password = process.env.MAISON_TEST_PASSWORD;
if (!password || password.length < 10)
  throw new Error('Set a disposable MAISON_TEST_PASSWORD (10+ characters).');
const repl = await MongoMemoryReplSet.create({
  binary: { downloadDir: path.join(tmpdir(), 'maison-mongodb-binaries'), version: '8.0.16' },
  replSet: { count: 1 },
});
const uri = repl.getUri();
const database = 'maison_insomnia_demo';
const db = await openMongo({ mongoUri: uri, mongoDatabase: database });
await db.seed();
for (const [id, email, role] of [
  ['preview-customer', 'preview@maison.example', 'customer'],
  ['preview-team', 'team@maison.example', 'team'],
  ['preview-other', 'other@maison.example', 'customer'],
]) {
  await db.insertUser({
    id,
    name: 'Maison Demo',
    email,
    password_hash: await hashPassword(password),
    role,
    created_at: new Date().toISOString(),
  });
}
const root = decodeURIComponent(new URL('../', import.meta.url).pathname);
const server = createApp({
  db,
  limits: false,
  config: {
    production: false,
    origin: 'http://127.0.0.1:3181',
    uploadDir: '/tmp/maison-insomnia-mongo-uploads',
    frontendDir: root + 'frontend/dist',
    mediaDir: root + 'frontend/public/media',
    trustProxy: false,
  },
}).listen(3181, '127.0.0.1');
writeFileSync(
  path.join(tmpdir(), 'maison-insomnia-mongo-connection.json'),
  JSON.stringify({ uri, database, api: 'http://127.0.0.1:3181/api/v1' }, null, 2),
);
console.log(
  JSON.stringify({
    localMongoUri: uri,
    database,
    api: 'http://127.0.0.1:3181/api/v1',
    externalServices: 'disabled',
  }),
);
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  server.close();
  await db.close();
  await repl.stop();
  process.exit(0);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
