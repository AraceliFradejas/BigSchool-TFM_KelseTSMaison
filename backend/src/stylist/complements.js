import { variantSize } from '@maison/contracts';
import { eligibleLooks } from './editorial.js';
const trousers = (product) =>
  product.category === 'fashion' &&
  /\b(pantal[oó]n(?:es)?|trousers|pants)\b/i.test(`${product.name.es} ${product.name.en}`);
export async function recommendComplements({ getLooks, getProducts, preferences }) {
  const es = preferences.language !== 'en';
  const referenceId = preferences.followUp.referenceLookId;
  const reference = referenceId
    ? eligibleLooks(await getLooks(), preferences).find((look) => look.id === referenceId)
    : null;
  const response = (message, complements = []) => ({
    mode: 'editorial',
    reason: 'catalog_follow_up',
    message,
    looks: [],
    complements,
    ...(reference ? { referenceLook: reference } : {}),
    preferences,
  });
  if (referenceId && !reference)
    return response(
      es
        ? 'No encuentro ese conjunto disponible con tu talla y presupuesto actuales. ¿Quieres que busquemos otra opción?'
        : 'That outfit is not available with your current size and budget. Shall we look for another option?',
    );
  const products = getProducts
    ? await getProducts()
    : (await getLooks()).flatMap((look) => look.products);
  // A new trouser option replaces any trousers already in the reference, rather than adding two pairs.
  const retained = reference?.pieces.filter((piece) => !trousers(piece.product)) || [];
  const baseCents = retained.reduce((total, piece) => total + piece.variant.priceCents, 0);
  const existing = new Set(
    reference?.pieces.filter((piece) => trousers(piece.product)).map((piece) => piece.product.id),
  );
  const unique = [...new Map(products.map((product) => [product.id, product])).values()];
  const referenceColours = new Set(
    (reference?.pieces || [])
      .filter((piece) => piece.product.category === 'fashion')
      .flatMap((piece) => piece.product.tags)
      .filter((tag) => ['dark', 'red', 'natural', 'gold', 'green', 'silver'].includes(tag)),
  );
  const colourScore = (product) => product.tags.filter((tag) => referenceColours.has(tag)).length;
  const sporty = (product) =>
    /deportiv|sport|jogger|legging/i.test(
      `${product.name.es} ${product.name.en} ${product.tags.join(' ')}`,
    );
  const allowSport =
    /deportiv|sport|jogger|legging/i.test(preferences.style || '') ||
    (reference?.pieces.some(
      (piece) => piece.product.category === 'fashion' && sporty(piece.product),
    ) ??
      false);
  const options = unique
    .filter(
      (product) =>
        product.active &&
        (!sporty(product) || allowSport) &&
        trousers(product) &&
        !existing.has(product.id) &&
        (preferences.color === 'any' || product.tags.includes(preferences.color)),
    )
    .map((product) => ({
      product,
      variant: product.variants
        .filter(
          (variant) =>
            variant.stock > 0 &&
            (!preferences.size ||
              variantSize(variant) === preferences.size ||
              variantSize(variant) === 'one'),
        )
        .sort((a, b) => a.priceCents - b.priceCents)[0],
    }))
    .filter(
      (piece) => piece.variant && baseCents + piece.variant.priceCents <= preferences.budgetCents,
    )
    .sort(
      (a, b) =>
        Number(b.product.collectionId === reference?.collectionId) -
          Number(a.product.collectionId === reference?.collectionId) ||
        colourScore(b.product) - colourScore(a.product) ||
        a.variant.priceCents - b.variant.priceCents,
    )
    .slice(0, 3)
    .map((piece) => ({ ...piece, totalWithLookCents: baseCents + piece.variant.priceCents }));
  if (!options.length)
    return response(
      es
        ? `No encuentro pantalones disponibles${reference ? ` para completar ${reference.name}` : ''} con tu talla y presupuesto. ¿Prefieres revisar la talla o buscar otra combinación?`
        : `I cannot find available trousers${reference ? ` to complete ${reference.name}` : ''} within your size and budget. Shall we revisit the size or find another combination?`,
    );
  return response(
    es
      ? reference
        ? `Para completar ${reference.name}, puedes valorar estas opciones. ${existing.size ? 'El total cambia el pantalón anterior por el nuevo.' : 'El total incluye tu conjunto y el pantalón que elijas.'} ¿Cuál te gusta más?`
        : 'Sí, estos pantalones están disponibles con tus preferencias. ¿Quieres combinarlos con alguno de los looks que hemos visto?'
      : reference
        ? `Let’s complete ${reference.name} with trousers. Each total includes the outfit with that option, replacing any previous trousers. Which do you prefer?`
        : 'These trousers are available with your preferences. Would you like to pair them with one of the outfits we saw?',
    options,
  );
}
