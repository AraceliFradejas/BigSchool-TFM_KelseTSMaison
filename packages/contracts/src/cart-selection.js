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

// Merging saved bags does not reserve stock; availability is revalidated before checkout.
export function combineGuestBag(existing, guest, makeKey) {
  const lines = existing.lines.map((line) => ({ ...line }));
  for (const line of guest.lines) {
    const match = lines.find((item) => item.variantId === line.variantId);
    if (match) match.quantity = Math.min(10, match.quantity + line.quantity);
    else if (lines.length < 30) lines.push({ ...line });
  }
  return guest.lines.length ? { key: makeKey(), lines } : existing;
}
