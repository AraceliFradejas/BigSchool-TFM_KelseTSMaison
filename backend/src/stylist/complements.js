import {
  matchesPieceType,
  matchesPieceColor,
  pieceLabel,
  productPieceType,
  replacesPieceType,
} from '@maison/contracts/stylist-pieces';
import { variantSize } from '@maison/contracts';
function variantFor(product, preferences) {
  const requested = matchesPieceType(product, 'shoes')
    ? preferences.shoeSize
    : product.category === 'fashion'
      ? preferences.size
      : undefined;
  return product.variants
    .filter(
      (variant) =>
        variant.stock > 0 &&
        (!requested || variantSize(variant) === requested || variantSize(variant) === 'one') &&
        matchesPieceColor(product, variant, preferences.followUp?.pieceColor),
    )
    .sort((a, b) => a.priceCents - b.priceCents)[0];
}
export async function recommendComplements({ getLooks, getProducts, preferences }) {
  const es = preferences.language !== 'en',
    kind = preferences.followUp.pieceType,
    label = pieceLabel(kind, preferences.language);
  const allLooks = await getLooks();
  const original = allLooks.find(
    (look) => look.id === preferences.followUp.referenceLookId && look.complete,
  );
  // Validate the retained pieces, not the unavailable slot the user wants to replace.
  const retainedProducts = original?.products.filter(
    (product) =>
      product.active &&
      (!preferences.excludeBeauty || product.category !== 'beauty') &&
      (!replacesPieceType(kind) || !matchesPieceType(product, kind)),
  );
  const basePieces = retainedProducts?.map((product) => ({
    product,
    variant: variantFor(product, { ...preferences, followUp: undefined }),
  }));
  let reference =
    original && basePieces.length && basePieces.every((piece) => piece.variant)
      ? {
          ...original,
          pieces: basePieces,
          products: retainedProducts,
          totalCents: basePieces.reduce((sum, piece) => sum + piece.variant.priceCents, 0),
          pendingPieceType: kind,
        }
      : null;
  let selectedAdditions = [];
  const response = (message, complements = []) => ({
    mode: 'editorial',
    reason: 'catalog_follow_up',
    message,
    looks: [],
    complements,
    ...(reference ? { referenceLook: reference } : {}),
    selectedAdditions,
    preferences,
  });
  if (preferences.followUp.referenceLookId && !reference)
    return response(
      es
        ? 'El conjunto ha cambiado o ya no encaja con tu talla y presupuesto. ¿Revisamos las opciones disponibles?'
        : 'The outfit has changed or no longer fits your size and budget. Shall we review the available options?',
    );
  const products = [
    ...new Map(
      (getProducts ? await getProducts() : allLooks.flatMap((look) => look.products)).map(
        (product) => [product.id, product],
      ),
    ).values(),
  ];
  for (const id of new Set(preferences.followUp.selectedProductIds || [])) {
    const product = products.find(
      (item) =>
        item.id === id && item.active && (!preferences.excludeBeauty || item.category !== 'beauty'),
    );
    const variant = product && variantFor(product, { ...preferences, followUp: undefined });
    if (!product || !variant)
      return response(
        es
          ? 'Una de las piezas elegidas ya no está disponible con tu talla. ¿Revisamos la elección?'
          : 'One of your chosen pieces is no longer available in your size. Shall we review your choice?',
      );
    const type = productPieceType(product),
      piece = { product, variant };
    selectedAdditions = selectedAdditions.filter(
      (old) =>
        old.product.id !== id && (!replacesPieceType(type) || !matchesPieceType(old.product, type)),
    );
    selectedAdditions.push(piece);
    if (reference) {
      const kept = reference.pieces.filter(
        (old) =>
          old.product.id !== id &&
          (!replacesPieceType(type) || !matchesPieceType(old.product, type)),
      );
      const pieces = [...kept, piece];
      reference = {
        ...reference,
        pieces,
        products: pieces.map((item) => item.product),
        totalCents: pieces.reduce((sum, item) => sum + item.variant.priceCents, 0),
      };
    }
  }
  if (reference && reference.totalCents > preferences.budgetCents)
    return response(
      es
        ? 'La combinación elegida supera el presupuesto actual. ¿Qué pieza quieres cambiar?'
        : 'Your chosen combination exceeds the current budget. Which piece would you like to change?',
    );
  const retained =
    reference?.pieces.filter(
      (piece) => !replacesPieceType(kind) || !matchesPieceType(piece.product, kind),
    ) || [];
  const baseCents = retained.reduce((sum, piece) => sum + piece.variant.priceCents, 0);
  const existing = new Set([
    ...(original?.products.map((product) => product.id) || []),
    ...(reference?.pieces.map((piece) => piece.product.id) || []),
  ]);
  const colours = new Set(
    (reference?.pieces || [])
      .filter((piece) => piece.product.category === 'fashion')
      .flatMap((piece) => piece.product.tags)
      .filter((tag) => ['dark', 'red', 'natural', 'gold', 'green', 'silver'].includes(tag)),
  );
  const sporty = (product) =>
    /deportiv|sport|jogger|legging|sneaker|zapatilla/i.test(
      `${product.name.es} ${product.name.en} ${product.tags.join(' ')}`,
    );
  const allowSport =
    !['gala', 'elegant'].includes(preferences.dressCode) &&
    (/deportiv|sport|jogger/i.test(preferences.style || '') ||
      reference?.pieces.some(
        (piece) => piece.product.category === 'fashion' && sporty(piece.product),
      ));
  const options = products
    .filter(
      (product) =>
        product.active &&
        matchesPieceType(product, kind) &&
        !existing.has(product.id) &&
        (!preferences.excludeBeauty || product.category !== 'beauty') &&
        (!sporty(product) || allowSport) &&
        ((preferences.followUp.pieceColor && preferences.followUp.pieceColor !== 'any') ||
          preferences.color === 'any' ||
          product.tags.includes(preferences.color)),
    )
    .map((product) => ({ product, variant: variantFor(product, preferences) }))
    .filter(
      (piece) => piece.variant && baseCents + piece.variant.priceCents <= preferences.budgetCents,
    )
    .sort(
      (a, b) =>
        Number(b.product.collectionId === reference?.collectionId) -
          Number(a.product.collectionId === reference?.collectionId) ||
        b.product.tags.filter((tag) => colours.has(tag)).length -
          a.product.tags.filter((tag) => colours.has(tag)).length ||
        a.variant.priceCents - b.variant.priceCents,
    )
    .slice(0, 3)
    .map((piece) => ({ ...piece, totalWithLookCents: baseCents + piece.variant.priceCents }));
  if (!options.length)
    return response(
      es
        ? `No encuentro opciones de ${label} disponibles con tu talla y presupuesto${reference ? ` para ${reference.name}` : ''}. ¿Revisamos alguna preferencia?`
        : `I cannot find available ${label} within your size and budget${reference ? ` for ${reference.name}` : ''}. Shall we review your preferences?`,
    );
  return response(
    es
      ? reference
        ? `Para completar ${reference.name}, estas opciones de ${label} respetan tu talla y presupuesto. El total incluye tu combinación con cada opción, sustituyendo esa pieza si ya la llevaba. ¿Cuál prefieres?`
        : `Estas opciones de ${label} están disponibles. ¿Con qué look quieres combinarlas?`
      : reference
        ? `These ${label} options fit your size and budget for ${reference.name}. Each total includes your combination with that option, replacing the same piece if it was already included. Which do you prefer?`
        : `These ${label} options are available. Which outfit would you pair them with?`,
    options,
  );
}
