import { randomUUID } from 'node:crypto';
import { registerSchema } from '@maison/contracts';
import { openMongo } from '../src/storage/mongo.js';
import { hashPassword } from '../src/modules/auth.js';

// Explicit local command only. Never run from a public route or serverless startup.
let db;
try {
  if (process.env.DATABASE_PROVIDER !== 'mongodb') throw new Error('mongodb_required');
  const input = registerSchema.parse({
    name: 'Team Maison',
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });
  db = await openMongo({
    mongoUri: process.env.MONGODB_URI,
    mongoDatabase: process.env.MONGODB_DATABASE,
  });
  if (await db.findUser(input.email)) throw new Error('account_already_exists');
  await db.insertUser({
    id: randomUUID(),
    name: input.name,
    email: input.email,
    password_hash: await hashPassword(input.password),
    role: 'team',
    created_at: new Date().toISOString(),
  });
  console.log('Team Maison account created. Credentials remain in the private local environment.');
} catch (error) {
  console.error(
    error.message === 'account_already_exists'
      ? 'Account already exists. No password or role has been changed.'
      : 'Team creation failed. Check the private configuration and database access.',
  );
  process.exitCode = 1;
} finally {
  await db?.close();
}
