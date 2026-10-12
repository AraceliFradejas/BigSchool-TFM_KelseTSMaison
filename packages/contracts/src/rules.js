export const categories = ['fashion', 'accessories', 'beauty'];
export const orderStatuses = ['pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'];
export const transitions = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['dispatched', 'cancelled'],
  dispatched: ['delivered'],
  delivered: [],
  cancelled: [],
};

export const catalogueSizes = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '35',
  '36',
  '37',
  '38',
  '39',
  '40',
  '41',
  '42',
  'one',
];

// Existing labels also contain colours and formats; only recognised sizes qualify.
export function variantSize(variant) {
  const parts = variant.label.en.split('·').map((part) => part.trim());
  if (parts.includes('One size')) return 'one';
  return catalogueSizes.find((size) => parts.includes(size));
}
