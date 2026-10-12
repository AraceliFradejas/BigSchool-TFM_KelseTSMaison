import entries from './runway-edit.json' with { type: 'json' };
const tr = (es, en) => ({ es, en });
export const runwayCollections = [
  {
    id: 'runway-wardrobe',
    name: 'The Runway Wardrobe',
    color: '#9c7560',
    description: tr(
      'Los 36 looks del cuaderno Maison, del metro a la gala. Cada pieza cuenta.',
      'The 36 Maison sketchbook looks, from the subway to gala. Every piece matters.',
    ),
  },
];
export const runwayProducts = entries.flatMap((look) =>
  look.pieces.map((piece) => {
    const accessory = ['bag', 'scarf', 'socks'].includes(piece.kind);
    const sizes =
      piece.kind === 'shoes'
        ? ['35', '36', '37', '38', '39', '40', '41', '42']
        : accessory
          ? ['one']
          : ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    return {
      id: piece.id,
      name: piece.name,
      category: accessory || piece.kind === 'shoes' ? 'accessories' : 'fashion',
      collectionId: 'runway-wardrobe',
      image: `/media/${piece.id}.webp`,
      active: true,
      tags: ['luxury', 'runway', look.mood, ...(piece.kind === 'shoes' ? ['footwear'] : [])],
      description: tr(
        `${piece.name.es}. Pieza del look ${look.name}, número ${look.position} de la pasarela Maison. Se vende esta pieza por separado. También puedes elegir las tallas de todas sus piezas y añadir el look completo. Diseño y existencias ficticios para pedidos de demostración.`,
        `${piece.name.en}. Part of ${look.name}, look ${look.position} on the Maison runway. This piece is sold separately. You can also choose each piece's size and add the complete look. Fictional design and inventory for demonstration orders.`,
      ),
      variants: sizes.map((size, i) => ({
        id: `${piece.id}-${size.toLowerCase()}`,
        label: tr(size === 'one' ? 'Única' : size, size === 'one' ? 'One size' : size),
        priceCents: piece.priceCents,
        stock: 5 + (i % 3),
      })),
    };
  }),
);
export const runwayLooks = entries.map((look) => ({
  id: look.id,
  sourceId: look.sourceId,
  position: look.position,
  name: look.name,
  songTitle: look.songTitle,
  songAlbum: look.songAlbum,
  collectionId: 'runway-wardrobe',
  mood: look.mood,
  image: look.image,
  description: tr(
    `Look ${look.position} del cuaderno Maison. Elige cada pieza por separado o combina todas para llevarte el conjunto.`,
    `Look ${look.position} from the Maison sketchbook. Choose individual pieces or combine them all for the complete outfit.`,
  ),
  productIds: look.pieces.map((piece) => piece.id),
}));
