import test from 'node:test';
import assert from 'node:assert/strict';
import { createNativeSession } from '../src/native-session.js';
const first = 'a'.repeat(64);
const second = 'b'.repeat(64);
function fixture() {
  let value = null;
  return {
    read: async () => value,
    write: async (next) => {
      value = next;
    },
    remove: async () => {
      value = null;
    },
  };
}

test('an opaque token survives a new session manager and is removed on logout', async () => {
  const storage = fixture();
  const original = createNativeSession(storage);
  assert.equal(await original.restore(), null);
  await original.save(first);
  const reopened = createNativeSession(storage);
  assert.equal(reopened.getAccessToken(), null);
  assert.equal(await reopened.restore(), first);
  await reopened.clear();
  assert.equal(reopened.getAccessToken(), null);
  assert.equal(await createNativeSession(storage).restore(), null);
});

test('corrupt storage is discarded and only an opaque token can be stored', async () => {
  const storage = fixture();
  await storage.write('a password or malformed token');
  const session = createNativeSession(storage);
  assert.equal(await session.restore(), null);
  assert.equal(await storage.read(), null);
  await assert.rejects(
    session.save({ token: first, password: 'private' }),
    (error) => error.code === 'invalid_response',
  );
  assert.equal(await storage.read(), null);
});

test('storage failures fail closed and concurrent writes cannot reanimate a cleared token', async () => {
  const broken = createNativeSession({
    read: async () => {
      throw new Error('private storage detail');
    },
    write: async () => {
      throw new Error('private');
    },
    remove: async () => {
      throw new Error('private');
    },
  });
  await assert.rejects(
    broken.restore(),
    (error) => error.code === 'session_storage_unavailable' && !error.message.includes('private'),
  );
  await assert.rejects(broken.save(first));
  assert.equal(broken.getAccessToken(), null);
  const storage = fixture();
  const session = createNativeSession(storage);
  await Promise.all([session.save(first), session.save(second), session.clear()]);
  assert.equal(session.getAccessToken(), null);
  assert.equal(await storage.read(), null);
});
