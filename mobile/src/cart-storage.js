import { cartStorageKey, restoreCart } from './cart-state.js';

export function createCartStorage(storage, makeKey, onError = () => {}) {
  let writes = Promise.resolve();
  return {
    save(scope, value) {
      writes = writes
        .catch(() => {})
        .then(() => storage.setItem(cartStorageKey(scope), JSON.stringify(value)))
        .then(() => {
          onError(false);
          return true;
        })
        .catch(() => {
          onError(true);
          return false;
        });
      return writes;
    },
    async read(scope) {
      await writes;
      try {
        let value = await storage.getItem(cartStorageKey(scope));
        if (!scope && value === null) value = await storage.getItem('@kelsets-maison/bag/v1');
        return restoreCart(value, makeKey);
      } catch {
        // An unreadable bag is not an empty bag: never overwrite it silently.
        onError(true);
        throw Object.assign(new Error('storage_unavailable'), { code: 'storage_unavailable' });
      }
    },
  };
}
