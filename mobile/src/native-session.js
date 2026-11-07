const validToken = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const storageError = () =>
  Object.assign(new Error('session_storage_unavailable'), { code: 'session_storage_unavailable' });

// The storage port is backed by SecureStore on device and a fake in unit tests.
// It accepts only the opaque session token, never a password or a user profile.
export function createNativeSession({ read, write, remove }) {
  let token = null;
  let restored = false;
  let queue = Promise.resolve();
  const run = (work) => {
    const result = queue.catch(() => {}).then(work);
    queue = result;
    return result;
  };
  return {
    getAccessToken: () => token,
    restore: () =>
      run(async () => {
        if (restored) return token;
        try {
          const stored = await read();
          if (stored && !validToken(stored)) await remove();
          token = validToken(stored) ? stored : null;
          restored = true;
          return token;
        } catch {
          throw storageError();
        }
      }),
    save: (value) =>
      run(async () => {
        if (!validToken(value))
          throw Object.assign(new Error('invalid_response'), { code: 'invalid_response' });
        try {
          await write(value);
        } catch {
          throw storageError();
        }
        token = value;
        restored = true;
      }),
    clear: () => {
      token = null;
      restored = true;
      return run(async () => {
        try {
          await remove();
        } catch {
          throw storageError();
        } finally {
          token = null;
        }
      });
    },
  };
}
