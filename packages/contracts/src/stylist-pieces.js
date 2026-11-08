const normalize = (text) =>
  String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
export const pieceTypes = [
  'trousers',
  'shoes',
  'bags',
  'tops',
  'jackets',
  'skirts',
  'dresses',
  'jewellery',
  'beauty',
  'accessories',
];
const patterns = {
  trousers: /\b(pantalon(?:es)?|trousers|pants)\b/,
  shoes:
    /\b(zapatos?|calzado|salones?|mocasines?|botas?|sandalias?|zapatillas?|shoes?|footwear|heels?|loafers?|boots?|sandals?|sneakers?)\b/,
  bags: /\b(bolsos?|bolsas?|bags?|handbags?|clutch)\b/,
  tops: /\b(camisas?|blusas?|tops?|jerseys?|cardigan|shirts?|blouses?|sweaters?)\b/,
  jackets: /\b(blazers?|americanas?|chaquetas?|abrigos?|jackets?|coats?)\b/,
  skirts: /\b(faldas?|minifaldas?|skirts?|miniskirts?)\b/,
  dresses: /\b(vestidos?|dresses?|gowns?)\b/,
  jewellery:
    /\b(joyas?|pendientes?|pulseras?|collares?|anillos?|jewellery|jewelry|earrings?|bracelets?|necklaces?|rings?)\b/,
  beauty:
    /\b(belleza|maquillaje|labial|perfume|colorete|sombra|balsamo|beauty|makeup|lipstick|fragrance|blush)\b/,
  accessories:
    /\b(accesorios?|panuelos?|cinturones?|gafas|accessories|scarves|scarfs?|belts?|glasses)\b/,
};
export function requestedPieceType(text) {
  const value = normalize(text);
  const mentions = pieceTypes.flatMap((type) =>
    [...value.matchAll(new RegExp(patterns[type].source, 'g'))].map((match) => ({
      type,
      index: match.index,
    })),
  );
  return mentions.sort((a, b) => b.index - a.index)[0]?.type || null;
}
export function matchesPieceType(product, type) {
  if (!product?.name) return false;
  if (type === 'beauty') return product.category === 'beauty';
  if (type === 'accessories') return product.category === 'accessories';
  if (type === 'shoes' && product.tags?.includes('footwear')) return true;
  return (
    (['shoes', 'bags', 'jewellery'].includes(type)
      ? product.category === 'accessories'
      : product.category === 'fashion') &&
    patterns[type]?.test(normalize(`${product.name.es} ${product.name.en}`))
  );
}
export const pieceLabel = (type, language = 'es') =>
  ({
    trousers: ['pantalones', 'trousers'],
    shoes: ['zapatos', 'shoes'],
    bags: ['bolsos', 'bags'],
    tops: ['partes de arriba', 'tops'],
    jackets: ['chaquetas', 'jackets'],
    skirts: ['faldas', 'skirts'],
    dresses: ['vestidos', 'dresses'],
    jewellery: ['joyas', 'jewellery'],
    beauty: ['belleza', 'beauty pieces'],
    accessories: ['accesorios', 'accessories'],
  })[type]?.[language === 'es' ? 0 : 1] || type;
export function requestedDressCode(text) {
  const value = normalize(text);
  if (/\b(gala|black tie|evening gown)\b/.test(value)) return 'gala';
  if (/\b(informal|casual|deportiv\w*|sport\w*)\b/.test(value)) return 'casual';
  if (/\b(elegant\w*|formal\w*|michelin)\b|fine dining/.test(value)) return 'elegant';
  return null;
}

export const productPieceType = (product) =>
  pieceTypes.find((type) => matchesPieceType(product, type)) || null;
export const replacesPieceType = (type) => !['beauty', 'jewellery', 'accessories'].includes(type);

export const pieceColors = [
  'any',
  'black',
  'white',
  'navy',
  'red',
  'beige',
  'brown',
  'gold',
  'silver',
  'green',
];
const colorPatterns = {
  black: /\b(negro|negra|negros|negras|black)\b/,
  white: /\b(blanco|blanca|white|marfil|ivory)\b/,
  navy: /\b(azul noche|azul marino|navy|midnight blue)\b/,
  red: /\b(rojo|roja|red|burdeos|burgundy)\b/,
  beige: /\b(beige|arena|sand)\b/,
  brown: /\b(marron|brown|chocolate|cafe|coffee)\b/,
  gold: /\b(dorado|dorada|gold|golden)\b/,
  silver: /\b(plateado|plateada|silver)\b/,
  green: /\b(verde|green)\b/,
};
export function matchesPieceColor(product, variant, color) {
  if (!color || color === 'any') return true;
  return (
    colorPatterns[color]?.test(
      normalize(
        [product.name?.es, product.name?.en, variant?.label?.es, variant?.label?.en].join(' '),
      ),
    ) || false
  );
}
