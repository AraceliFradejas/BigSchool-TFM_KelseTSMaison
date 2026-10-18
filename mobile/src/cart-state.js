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
export function combineGuestBag(existing, guest, makeKey) {
  const lines = existing.lines.map((line) => ({ ...line }));
  for (const line of guest.lines) {
    const match = lines.find((item) => item.variantId === line.variantId);
    if (match) match.quantity = Math.min(10, match.quantity + line.quantity);
    else if (lines.length < 30) lines.push({ ...line });
  }
  return guest.lines.length ? { key: makeKey(), lines } : existing;
}
