import { restoreBag } from './model.js';
export const cartStorageKey = (userId) => `@kelsets-maison/cart/v2/${userId || 'guest'}`;
export function restoreCart(value, makeKey) {
  try {
    const stored = JSON.parse(value || 'null');
    if (!stored) return { key: makeKey(), lines: [] };
    const lines = restoreBag(JSON.stringify(Array.isArray(stored) ? stored : stored.lines));
    const key =
      !Array.isArray(stored) &&
      /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(stored.key || '')
        ? stored.key
        : makeKey();
    return { key, lines };
  } catch {
    return { key: makeKey(), lines: [] };
  }
}
export { combineGuestBag } from '@maison/contracts/cart-selection';
