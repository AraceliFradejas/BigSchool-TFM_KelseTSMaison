// Prepare the complete selection before changing the cart: no partial looks.
export function mergeCartSelection(lines, pieces) {
  if (!pieces.length) throw new Error('invalid_input');
  const next = lines.map((line) => ({ ...line }));
  for (const { product, variant, quantity = 1 } of pieces) {
    if (
      !product?.active ||
      !variant ||
      !product.variants.some((item) => item.id === variant.id) ||
      !Number.isInteger(quantity) ||
      quantity < 1
    )
      throw new Error('invalid_input');
    const canonical = product.variants.find((item) => item.id === variant.id);
    const current = next.find((line) => line.variantId === variant.id);
    const total = (current?.quantity || 0) + quantity;
    if (total > Math.min(10, canonical.stock)) throw new Error('insufficient_stock');
    if (current) current.quantity = total;
    else next.push({ productId: product.id, variantId: variant.id, quantity });
    if (next.length > 30) throw new Error('invalid_input');
  }
  return next;
}
