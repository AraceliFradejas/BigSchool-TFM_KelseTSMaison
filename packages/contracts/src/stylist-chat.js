// The chat asks explicitly for a budget rather than silently assuming one.
// These local rules identify common numeric constraints; style interpretation stays with the model.
export function chatPreferences(message, previous = {}) {
  const text = message.trim();
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const preferences = {
    occasion: 'any',
    color: 'any',
    excludeBeauty: false,
    style: '',
    ...previous,
  };
  const amount =
    normalized.match(
      /(?:presupuesto|budget|maximo|max\.?|up to|hasta|under|menos de|no mas de)\s*(?:(?:maximo|de|es|son|of|is|:)\s*)*(?:€\s*)?(-?[\d][\d.,]*(?:\s?[€])?)/,
    )?.[1] ||
    normalized.match(/(-?[\d][\d.,]*)\s*(?:€|euros?\b|eur\b)/)?.[1] ||
    (/^\d[\d.,]*\s*€?$/.test(normalized) ? normalized : null);
  let invalidBudget = false;
  if (amount) {
    let value = amount.replace(/[^\d.,-]/g, '');
    const last = Math.max(value.lastIndexOf(','), value.lastIndexOf('.'));
    if (last >= 0 && value.length - last - 1 <= 2)
      value = value.slice(0, last).replace(/[.,]/g, '') + '.' + value.slice(last + 1);
    else value = value.replace(/[.,]/g, '');
    const cents = Math.round(Number(value) * 100);
    if (Number.isSafeInteger(cents) && cents >= 100 && cents <= 1000000)
      preferences.budgetCents = cents;
    else {
      invalidBudget = true;
      delete preferences.budgetCents;
    }
  }
  const size = normalized.match(/\b(?:talla|size)\s*(xxl|xl|xs|s|m|l)\b/);
  const shoes = normalized.match(
    /\b(?:calzo|calzado|zapatos|shoe size)\s*(?:talla\s*)?(3[5-9]|4[0-2])\b/,
  );
  if (size) preferences.size = size[1].toUpperCase();
  if (shoes) preferences.shoeSize = shoes[1];
  const occasions = [
    ['dinner', /\b(cena|cenar|dinner)\b/],
    ['concert', /\b(concierto|concert)\b/],
    ['weekend', /fin de semana|weekend/],
    ['everyday', /dia a dia|cada dia|everyday/],
    ['event', /\b(evento|boda|gala|event|wedding)\b/],
    ['television', /\b(entrevista|television|interview)\b/],
    ['street', /\b(calle|street)\b/],
  ];
  for (const [key, pattern] of occasions)
    if (pattern.test(normalized)) {
      preferences.occasion = key;
      break;
    }
  if (/\bsin (?:productos de )?(?:belleza|maquillaje)\b|without (?:beauty|makeup)/.test(normalized))
    preferences.excludeBeauty = true;
  if (/(?:incluye|incluir|include) (?:belleza|maquillaje|beauty|makeup)/.test(normalized))
    preferences.excludeBeauty = false;
  if (!/^\d[\d.,]*\s*(?:€|euros?)?$/.test(normalized))
    preferences.style = (
      previous.style ? `${previous.style.slice(-190)}\nAhora: ${text}` : text
    ).slice(-400);
  return { preferences, needsBudget: !preferences.budgetCents || invalidBudget, invalidBudget };
}
