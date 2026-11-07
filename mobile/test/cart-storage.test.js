import test from 'node:test';
import assert from 'node:assert/strict';
import { createCartStorage } from '../src/cart-storage.js';
import { cartStorageKey } from '../src/cart-state.js';

test('an unreadable saved bag fails closed instead of becoming an empty writable bag', async () => {
  const errors = [];
  let writes = 0;
  const store = createCartStorage(
    {
      getItem: async () => {
        throw new Error('private storage error');
      },
      setItem: async () => {
        writes++;
      },
    },
    () => 'new',
    (value) => errors.push(value),
  );
  await assert.rejects(store.read('customer'), (error) => error.code === 'storage_unavailable');
  assert.equal(writes, 0);
  assert.deepEqual(errors, [true]);
});

test('a failed account write retains the guest source and reports failure to its caller', async () => {
  const original = {
    key: '00000000-0000-4000-8000-000000000001',
    lines: [{ productId: 'dress', variantId: 'dress-m', quantity: 1 }],
  };
  const values = new Map([[cartStorageKey(null), JSON.stringify(original)]]);
  const errors = [];
  const store = createCartStorage(
    {
      getItem: async (key) => values.get(key) ?? null,
      setItem: async (key, value) => {
        if (key === cartStorageKey('customer')) throw new Error('write failed');
        values.set(key, value);
      },
    },
    () => 'new',
    (value) => errors.push(value),
  );
  assert.equal(await store.save('customer', original), false);
  assert.deepEqual(await store.read(null), original);
  assert.deepEqual(errors, [true]);
});

test('reads wait for the queued write and preserve account isolation', async () => {
  const values = new Map();
  const store = createCartStorage(
    {
      getItem: async (key) => values.get(key) ?? null,
      setItem: async (key, value) => {
        await Promise.resolve();
        values.set(key, value);
      },
    },
    () => 'new',
  );
  const cart = { key: '00000000-0000-4000-8000-000000000001', lines: [] };
  const writing = store.save('one', cart);
  assert.deepEqual(await store.read('one'), cart);
  assert.equal(await writing, true);
  assert.equal((await store.read('two')).key, 'new');
});
