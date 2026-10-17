import songProductNames from './song-product-names.json' with { type: 'json' };
import { runwayCollections, runwayProducts, runwayLooks } from './runway-edit.js';
import { luxuryCollections, createLuxuryProducts, luxuryLooks } from './luxury-edit.js';
import { newCollections, createNewProducts, newLooks } from './swiftie-edit.js';
const musicalNames = new Map(songProductNames.map((entry) => [entry.id, entry.name]));
const translated = (es, en) => ({ es, en });
export const collections = [
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    color: '#bd8c49',
    description: translated('La luz que se queda contigo.', 'The light that stays with you.'),
  },
  {
    id: 'midnight-velvet',
    name: 'Midnight Velvet',
    color: '#293347',
    description: translated(
      'Cuando la noche tiene su propia historia.',
      'When the night has a story of its own.',
    ),
  },
  {
    id: 'wildflower',
    name: 'Wildflower',
    color: '#74866f',
    description: translated(
      'Un poco de aire, un poco de libertad.',
      'A little fresh air, a little freedom.',
    ),
  },
  {
    id: 'crimson-letters',
    name: 'Crimson Letters',
    color: '#9e2936',
    description: translated('Detalles que dicen mucho.', 'Details that say so much.'),
  },
  {
    id: 'sunday-together',
    name: 'Sunday Together',
    color: '#998479',
    description: translated('Los pequeños planes también cuentan.', 'Small plans matter too.'),
  },
  ...newCollections,
  ...luxuryCollections,
  ...runwayCollections,
];
function product(id, es, en, category, collectionId, priceCents, labels, tags, description) {
  return {
    id,
    name: musicalNames.get(id) || translated(es, en),
    category,
    collectionId,
    image: `/media/${id}.webp`,
    active: true,
    tags,
    description: translated(...description),
    variants: labels.map(([labelEs, labelEn], i) => ({
      id: `${id}-${i + 1}`,
      label: translated(labelEs, labelEn),
      priceCents: Array.isArray(priceCents) ? priceCents[i] : priceCents,
      stock: i === 2 ? 0 : 6 + i * 2,
    })),
  };
}
export const products = [
  product(
    'satin-story',
    'Vestido Satin Story',
    'Satin Story dress',
    'fashion',
    'golden-hour',
    185000,
    [
      ['S · Champán', 'S · Champagne'],
      ['M · Champán', 'M · Champagne'],
      ['L · Champán', 'L · Champagne'],
    ],
    ['dinner', 'gold'],
    [
      'Vestido midi de satén ficticio, con escote suave y caída fluida. Una pieza para las cenas que se alargan y los recuerdos que empiezan al atardecer.',
      'A fictional satin midi dress with a soft neckline and fluid drape. For long dinners and memories that begin at sunset.',
    ],
  ),
  product(
    'sunlit-hoops',
    'Pendientes Sunlit',
    'Sunlit earrings',
    'accessories',
    'golden-hour',
    45000,
    [['Dorado · Par', 'Gold · Pair']],
    ['dinner', 'gold'],
    [
      'Aros de acabado dorado y silueta orgánica. Su tamaño contenido acompaña el look sin quitarle protagonismo.',
      'Gold-finish hoops with an organic silhouette. Their understated size complements your outfit without stealing the spotlight.',
    ],
  ),
  product(
    'warm-notes',
    'Perfume Warm Notes',
    'Warm Notes fragrance',
    'beauty',
    'golden-hour',
    [9500, 14500],
    [
      ['30 ml', '30 ml'],
      ['50 ml', '50 ml'],
    ],
    ['dinner', 'gold'],
    [
      'Fragancia de demostración con una historia de ámbar y flores suaves. Las notas son una descripción creativa, no una formulación comercial.',
      'A demonstration fragrance with a story of amber and soft flowers. The notes are a creative description, not a commercial formula.',
    ],
  ),
  product(
    'velvet-night',
    'Blazer Velvet Night',
    'Velvet Night blazer',
    'fashion',
    'midnight-velvet',
    185000,
    [
      ['S · Azul noche', 'S · Midnight blue'],
      ['M · Azul noche', 'M · Midnight blue'],
      ['L · Azul noche', 'L · Midnight blue'],
    ],
    ['dinner', 'concert', 'dark'],
    [
      'Blazer de terciopelo ficticio con líneas rectas y solapa clásica. Pensado para combinar con prendas sencillas y un accesorio especial.',
      'A fictional velvet blazer with clean lines and classic lapels. Pair it with simple pieces and a special accessory.',
    ],
  ),
  product(
    'after-hours',
    'Bolso After Hours',
    'After Hours bag',
    'accessories',
    'midnight-velvet',
    225000,
    [
      ['Negro · Única', 'Black · One size'],
      ['Azul noche · Única', 'Midnight blue · One size'],
    ],
    ['dinner', 'concert', 'dark'],
    [
      'Bolso pequeño de líneas curvas con asa corta. Tiene el tamaño de esos imprescindibles que te acompañan toda la noche.',
      'A small curved bag with a short handle. Sized for the essentials that stay with you all evening.',
    ],
  ),
  product(
    'moonlit-shade',
    'Sombra Moonlit',
    'Moonlit eyeshadow',
    'beauty',
    'midnight-velvet',
    6500,
    [
      ['Grafito · 4 g', 'Graphite · 4 g'],
      ['Azul noche · 4 g', 'Midnight blue · 4 g'],
    ],
    ['dinner', 'concert', 'dark'],
    [
      'Sombra de ojos de demostración en tonos nocturnos. Una propuesta de color para completar la selección editorial.',
      'A demonstration eyeshadow in night-time shades. A colour suggestion to complete the editorial selection.',
    ],
  ),
  product(
    'field-notes',
    'Blusa Field Notes',
    'Field Notes blouse',
    'fashion',
    'wildflower',
    79000,
    [
      ['S · Salvia', 'S · Sage'],
      ['M · Salvia', 'M · Sage'],
      ['L · Salvia', 'L · Sage'],
    ],
    ['everyday', 'weekend', 'natural'],
    [
      'Blusa fluida de inspiración botánica, con manga amplia y cuello abierto. Fácil de combinar para una mañana sin prisas.',
      'A flowing botanical-inspired blouse with wide sleeves and an open neck. Easy to style for an unhurried morning.',
    ],
  ),
  product(
    'woven-days',
    'Bolso Woven Days',
    'Woven Days bag',
    'accessories',
    'wildflower',
    125000,
    [['Arena · Única', 'Sand · One size']],
    ['everyday', 'weekend', 'natural'],
    [
      'Bolso de textura trenzada ficticia y asas redondeadas. Un detalle natural para paseos, escapadas y planes improvisados.',
      'A fictional woven-texture bag with rounded handles. A natural detail for walks, getaways and spontaneous plans.',
    ],
  ),
  product(
    'petal-touch',
    'Colorete Petal Touch',
    'Petal Touch blush',
    'beauty',
    'wildflower',
    6800,
    [
      ['Rosa suave · 6 g', 'Soft pink · 6 g'],
      ['Melocotón · 6 g', 'Peach · 6 g'],
    ],
    ['everyday', 'weekend', 'natural'],
    [
      'Colorete de demostración con una paleta suave de rosas y melocotón. Selección estética sin promesas sobre la piel.',
      'A demonstration blush in soft pink and peach shades. An aesthetic selection without claims about skin benefits.',
    ],
  ),
  product(
    'red-letter',
    'Camisa Red Letter',
    'Red Letter shirt',
    'fashion',
    'crimson-letters',
    95000,
    [
      ['S · Rojo', 'S · Red'],
      ['M · Rojo', 'M · Red'],
      ['L · Rojo', 'L · Red'],
    ],
    ['concert', 'dinner', 'red'],
    [
      'Camisa roja de caída suave y puños amplios. Para los días en los que te apetece que una sola pieza cuente la historia.',
      'A softly draped red shirt with wide cuffs. For days when you want one piece to tell the story.',
    ],
  ),
  product(
    'little-letter',
    'Pañuelo Little Letter',
    'Little Letter scarf',
    'accessories',
    'crimson-letters',
    39000,
    [['Rojo y marfil · 60 cm', 'Red and ivory · 60 cm']],
    ['concert', 'everyday', 'red'],
    [
      'Pañuelo de estampado geométrico propio. Puedes llevarlo al cuello, en el pelo o como detalle en el bolso.',
      'A scarf with an original geometric pattern. Wear it around your neck, in your hair or as a detail on your bag.',
    ],
  ),
  product(
    'crimson-kiss',
    'Labial Crimson Kiss',
    'Crimson Kiss lipstick',
    'beauty',
    'crimson-letters',
    5500,
    [
      ['Rojo carta · 3 g', 'Letter red · 3 g'],
      ['Rojo vino · 3 g', 'Wine red · 3 g'],
    ],
    ['concert', 'dinner', 'red'],
    [
      'Labial ficticio en dos tonos rojos. Un acento de color pensado para acompañar prendas sencillas o un look completo en rojo.',
      'A fictional lipstick in two red shades. A colour accent for simple pieces or a complete red look.',
    ],
  ),
  product(
    'slow-sunday',
    'Jersey Slow Sunday',
    'Slow Sunday sweater',
    'fashion',
    'sunday-together',
    89000,
    [
      ['S · Marfil', 'S · Ivory'],
      ['M · Marfil', 'M · Ivory'],
      ['L · Marfil', 'L · Ivory'],
    ],
    ['weekend', 'everyday', 'natural'],
    [
      'Jersey de punto ficticio con cuello redondo y silueta relajada. Para leer, pasear o compartir una tarde de partido.',
      'A fictional knit sweater with a crew neck and relaxed silhouette. For reading, walking or sharing an afternoon watching a game.',
    ],
  ),
  product(
    'weekend-cap',
    'Gorra Weekend Club',
    'Weekend Club cap',
    'accessories',
    'sunday-together',
    32000,
    [
      ['Burdeos · Ajustable', 'Burgundy · Adjustable'],
      ['Marfil · Ajustable', 'Ivory · Adjustable'],
    ],
    ['weekend', 'everyday', 'natural'],
    [
      'Gorra de silueta clásica inspirada en los planes deportivos de KelseTS. Un diseño propio, sin escudos ni emblemas de equipos.',
      'A classic cap inspired by KelseTS sporting days out. An original design without team crests or emblems.',
    ],
  ),
  product(
    'soft-morning',
    'Bálsamo Soft Morning',
    'Soft Morning balm',
    'beauty',
    'sunday-together',
    4800,
    [
      ['Natural · 10 g', 'Natural · 10 g'],
      ['Rosa · 10 g', 'Pink · 10 g'],
    ],
    ['weekend', 'everyday', 'natural'],
    [
      'Bálsamo labial de demostración para completar una selección sencilla. Producto ficticio; no se vende ni se atribuyen efectos cosméticos.',
      'A demonstration lip balm to complete a simple selection. A fictional product, with no sales or cosmetic claims.',
    ],
  ),
];
products.push(...createNewProducts(product), ...createLuxuryProducts(product), ...runwayProducts);
export const looks = [
  ...collections.slice(0, 5).map((collection, i) => ({
    id: `look-${collection.id}`,
    collectionId: collection.id,
    name: collection.name,
    description: collection.description,
    productIds: products.slice(i * 3, i * 3 + 3).map((item) => item.id),
  })),
  ...newLooks,
  ...luxuryLooks,
  ...runwayLooks,
];
