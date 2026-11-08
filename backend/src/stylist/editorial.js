import { variantSize } from '@maison/contracts';

// Both modes share these hard constraints; the model cannot relax them.
export function eligibleLooks(looks, preferences) {
  return looks
    .filter((look) => look.complete)
    .map((look) => {
      const products = look.products.filter(
        (item) => item.active && (!preferences.excludeBeauty || item.category !== 'beauty'),
      );
      const pieces = products.map((product) => ({
        product,
        variant: product.variants
          .filter((variant) => {
            const size = variantSize(variant);
            const footwear =
              product.tags.includes('footwear') ||
              (product.category === 'accessories' &&
                product.variants.some((v) => /^\d+$/.test(variantSize(v) || '')));
            const requested = footwear
              ? preferences.shoeSize
              : product.category === 'fashion'
                ? preferences.size
                : undefined;
            return variant.stock > 0 && (!requested || size === 'one' || size === requested);
          })
          .sort((a, b) => a.priceCents - b.priceCents)[0],
      }));
      const totalCents = pieces.reduce((sum, piece) => sum + (piece.variant?.priceCents || 0), 0);
      const fashion = products.find((item) => item.category === 'fashion');
      const valid =
        pieces.length >= 2 &&
        products.some((p) => p.category === 'fashion') &&
        pieces.every((piece) => piece.variant) &&
        totalCents <= preferences.budgetCents &&
        (preferences.occasion === 'any' ||
          look.mood === preferences.occasion ||
          fashion?.tags.includes(preferences.occasion)) &&
        (preferences.color === 'any' ||
          products.some((item) => item.tags.includes(preferences.color)));
      return { ...look, pieces, totalCents, valid };
    })
    .filter((look) => look.valid);
}

// A request for a formal dinner should not fall back to the first casual combinations.
export function rankEditorialLooks(looks, preferences) {
  const latest = (preferences.style || '').split(/Ahora:/).at(-1);
  if (!/\b(?:elegant\w*|formal\w*|gala|michelin)\b|fine dining/i.test(latest)) return looks;
  const score = (look) =>
    look.pieces
      .filter((piece) => piece.product.category === 'fashion')
      .reduce((sum, piece) => {
        const text = `${piece.product.name.es} ${piece.product.name.en} ${piece.product.description?.es || ''}`;
        return (
          sum +
          (/vestido|dress|blazer|americana|sastre|tailor/i.test(text) ? 2 : 0) +
          (/satin|saten|seda|silk|velvet|terciopelo/i.test(text) ? 1 : 0) -
          (/deportiv|sport|jogger/i.test(text) ? 10 : 0)
        );
      }, 0);
  const formal = looks.filter((look) => score(look) >= 2).sort((a, b) => score(b) - score(a));
  return formal;
}
