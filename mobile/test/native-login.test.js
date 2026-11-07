import test from 'node:test';
import assert from 'node:assert/strict';
import { loginNative } from '../src/native-login.js';

const token = 'a'.repeat(64);
const user = { id: 'customer-1', name: 'Maison Demo' };
const cart = { key: 'demo-cart', lines: [{ variantId: 'demo', quantity: 1 }] };
const input = { email: 'native@example.test', password: 'Demo-Maison-2026' };
function fixture(overrides = {}) {
  const calls = [];
  const deps = {
    request: async (path, options) => {
      calls.push('request');
      assert.equal(path, overrides.register ? '/auth/native/register' : '/auth/native/login');
      assert.deepEqual(options, { method: 'POST', body: input });
      return { user, token };
    },
    verifyToken: async (value) => {
      calls.push('verify');
      assert.equal(value, token);
      return user;
    },
    revokeToken: async (value) => {
      calls.push('revoke');
      assert.equal(value, token);
    },
    session: {
      save: async (value) => {
        calls.push('save');
        assert.equal(value, token);
      },
      clear: async () => {
        calls.push('clear');
      },
    },
    prepareCart: async (verified) => {
      calls.push('prepare');
      assert.equal(verified, user);
      return cart;
    },
    clearGuest: async () => {
      calls.push('guest');
      return true;
    },
  };
  return { calls, deps };
}

test('verifies identity, saves token, then persists own bag before clearing guest', async () => {
  for (const register of [false, true]) {
    const { deps, calls } = fixture({ register });
    assert.deepEqual(await loginNative(deps, input, register), { user, cart });
    assert.deepEqual(calls, ['request', 'verify', 'save', 'prepare', 'guest']);
  }
});

test('verification network failure never persists the token and preserves the original error', async () => {
  const { deps, calls } = fixture();
  const original = new Error('network_error');
  deps.verifyToken = async () => {
    calls.push('verify');
    throw original;
  };
  deps.revokeToken = async () => {
    calls.push('revoke');
    throw new Error('cleanup failed');
  };
  deps.session.clear = async () => {
    calls.push('clear');
    throw new Error('storage failed');
  };
  await assert.rejects(loginNative(deps, input), (error) => error === original);
  assert.deepEqual(calls, ['request', 'verify', 'revoke', 'clear']);
});

test('own bag persistence failure revokes and clears the saved session without clearing guest', async () => {
  const { deps, calls } = fixture();
  const original = new Error('storage_unavailable');
  deps.prepareCart = async () => {
    calls.push('prepare');
    throw original;
  };
  await assert.rejects(loginNative(deps, input), (error) => error === original);
  assert.deepEqual(calls, ['request', 'verify', 'save', 'prepare', 'revoke', 'clear']);
});

test('a retained guest bag does not turn verified durable login into failure', async () => {
  const { deps, calls } = fixture();
  deps.clearGuest = async () => {
    calls.push('guest');
    return false;
  };
  assert.deepEqual(await loginNative(deps, input), { user, cart });
  assert.deepEqual(calls, ['request', 'verify', 'save', 'prepare', 'guest']);
});

test('identity mismatch revokes and clears without saving or modifying bags', async () => {
  const { deps, calls } = fixture();
  deps.verifyToken = async () => {
    calls.push('verify');
    return { id: 'another-customer' };
  };
  await assert.rejects(loginNative(deps, input), { code: 'session_unavailable' });
  assert.deepEqual(calls, ['request', 'verify', 'revoke', 'clear']);
});

test('no cleanup runs when request fails or no valid token was issued', async () => {
  for (const issued of [undefined, { user, token: 'invalid' }, { user, token: 123 }]) {
    const { deps, calls } = fixture();
    deps.request = async () => {
      calls.push('request');
      return issued;
    };
    await assert.rejects(loginNative(deps, input), { code: 'invalid_response' });
    assert.deepEqual(calls, ['request']);
  }
  const { deps, calls } = fixture();
  const original = new Error('network_error');
  deps.request = async () => {
    calls.push('request');
    throw original;
  };
  await assert.rejects(loginNative(deps, input), (error) => error === original);
  assert.deepEqual(calls, ['request']);
});

test('malformed user with an issued token cleans up', async () => {
  const malformed = fixture();
  malformed.deps.request = async () => {
    malformed.calls.push('request');
    return { token };
  };
  await assert.rejects(loginNative(malformed.deps, input), { code: 'invalid_response' });
  assert.deepEqual(malformed.calls, ['request', 'revoke', 'clear']);
});

test('SecureStore write failure never prepares own bag or clears guest', async () => {
  const { deps, calls } = fixture();
  const original = new Error('session_storage_unavailable');
  deps.session.save = async () => {
    calls.push('save');
    throw original;
  };
  await assert.rejects(loginNative(deps, input), (error) => error === original);
  assert.deepEqual(calls, ['request', 'verify', 'save', 'revoke', 'clear']);
});
