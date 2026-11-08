import { requestedDressCode } from '@maison/contracts/stylist-pieces';
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
  const code =
    preferences.dressCode && preferences.dressCode !== 'any'
      ? preferences.dressCode
      : requestedDressCode(preferences.style);
  if (!['gala', 'elegant'].includes(code)) return looks;
  const score = (look) => {
    const fashion = look.pieces.filter((piece) => piece.product.category === 'fashion');
    const dress = fashion.some((piece) =>
      /vestido|dress|gown/i.test(`${piece.product.name.es} ${piece.product.name.en}`),
    );
    const tailoring = fashion.some((piece) =>
      /blazer|americana|sastre|tailor|tuxedo|esmoquin/i.test(
        `${piece.product.name.es} ${piece.product.name.en}`,
      ),
    );
    const sporty = fashion.some((piece) =>
      /deportiv|sport|jogger/i.test(`${piece.product.name.es} ${piece.product.name.en}`),
    );
    if (sporty) return -1;
    if (code === 'gala')
      return dress
        ? 10 + (look.mood === 'event' ? 2 : 0)
        : /tuxedo|esmoquin/i.test(look.name)
          ? 8
          : -1;
    return (dress ? 5 : tailoring ? 3 : 0) - (/interview|presentation/i.test(look.name) ? 1 : 0);
  };
  return looks.filter((look) => score(look) > 0).sort((a, b) => score(b) - score(a));
}
