import { createApiClient } from '@maison/api-client';
import { mergeCartSelection } from '@maison/contracts/cart-selection';

export function serviceLocation(value = 'https://kelsets-maison.vercel.app/api/v1') {
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !url.pathname.endsWith('/api/v1')
  )
    throw new Error('Use an HTTPS Maison API URL ending in /api/v1.');
  return { baseUrl: url.href.replace(/\/$/, ''), origin: url.origin };
}
export const service = serviceLocation(process.env.EXPO_PUBLIC_API_URL);
export const api = createApiClient({ baseUrl: service.baseUrl });
export function imageUrl(path) {
  return /^\/(?:media|uploads|api\/v1\/images)\/[a-zA-Z0-9._-]+\.(?:webp|png|jpg|jpeg|svg)$/.test(
    path || '',
  )
    ? `${service.origin}${path}`
    : undefined;
}
export function restoreBag(value) {
  try {
    const lines = JSON.parse(value || '[]');
    if (!Array.isArray(lines) || lines.length > 30) return [];
    const ids = new Set();
    for (const line of lines) {
      if (
        !line ||
        typeof line.productId !== 'string' ||
        !/^[a-z0-9-]{1,80}$/.test(line.productId) ||
        typeof line.variantId !== 'string' ||
        !/^[a-z0-9-]{1,80}$/.test(line.variantId) ||
        !Number.isInteger(line.quantity) ||
        line.quantity < 1 ||
        line.quantity > 10 ||
        ids.has(line.variantId)
      )
        return [];
      ids.add(line.variantId);
    }
    return lines.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity }));
  } catch {
    return [];
  }
}
export function addToBag(lines, product, variantId) {
  return mergeCartSelection(lines, [
    { product, variant: product.variants.find((v) => v.id === variantId) },
  ]);
}
export function resolveBag(lines, products) {
  return lines.map((line) => {
    const product = products.find((p) => p?.id === line.productId);
    const variant = product?.variants.find((v) => v.id === line.variantId);
    return {
      ...line,
      product,
      variant,
      valid: Boolean(product?.active && variant && variant.stock >= line.quantity),
      totalCents: variant ? variant.priceCents * line.quantity : 0,
    };
  });
}
export { formatMoney as money } from '@maison/contracts/money';

export function outfitSelection(look, selected) {
  if (!look?.complete || !look.products?.length) throw new Error('invalid_input');
  return look.products.map((product) => {
    const variant = product.variants.find((v) => v.id === selected[product.id]);
    if (!product.active || !variant || variant.stock <= 0) throw new Error('insufficient_stock');
    return { product, variant };
  });
}
