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
    normalized.match(
      /\b(?:tengo|dispongo de|cuento con|i have)\s+(-?\d[\d.,]*)(?![\w.,])(?!(?:\s*)(?:anos?|years?|de edad|de calzado|de zapatos|de talla)\b)/,
    )?.[1] ||
    normalized.match(/^(-?\d[\d.,]*?)\s*,?\s+(?:y\s+)?(?:talla|size)\b/)?.[1] ||
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
  const size = normalized.match(
    /\b(?:talla|size)\s*(?:(?:es|is)\s+)?(?:(?:la|una|a)\s+)?(xxl|xl|xs|s|m|l)\b/,
  );
  const shoes = normalized.match(
    /\b(?:calzo|calzado|zapatos|shoe size|n[º°o.]?\s*(?:de\s+(?:calzado|pie|zapatos))?|numero\s*(?:de\s+(?:calzado|pie|zapatos))?)\s*(?:(?:es|un|una|el|la|talla)\s+)*(3[5-9]|4[0-2])\b/,
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

// Identity questions and short feedback are local: no provider call or filter changes.
export function stylistFeedback(message, hasSuggestion, language = 'es') {
  const text = message
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[¡!¿?.,;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const es = language === 'es';
  if (
    /^(?:eres (?:un |una )?(?:robot|bot|ia|inteligencia artificial|humano|humana)|quien eres|que eres|are you (?:a |an )?(?:robot|bot|ai|human)|who are you|what are you)$/.test(
      text,
    )
  )
    return es
      ? 'Soy tu tAIlor ✨, tu estilista personal virtual de Maison. No coso botones, ¡pero sí te ayudo a encontrar un look a tu medida! ¿Qué tienes planeado?'
      : 'I’m your tAIlor ✨, your personal virtual stylist at Maison. I don’t sew buttons, but I can help you find an outfit that suits you! What are you planning?';
  if (
    /^(?:(?:hola|buenas|buenos dias|buenas tardes|buenas noches|hello|hi|hey)(?:\s+|$))+$/.test(
      text,
    )
  )
    return es
      ? '¡Hola! Soy tu tAIlor ✨. Cuéntame: ¿para qué plan buscamos look y qué estilo te apetece? Si tienes un presupuesto en mente, dímelo también.'
      : 'Hello! I’m your tAIlor ✨. What are you planning, and what style would you like? Tell me your budget too if you have one in mind.';
  if (
    /^(?:(?:adios|hasta luego|hasta pronto|nos vemos|chao|chau|bye|goodbye|see you|gracias|muchas gracias|thank you|thanks)(?:\s+|$))+$/.test(
      text,
    )
  )
    return es
      ? '¡Gracias a ti! Aquí estará tu tAIlor cuando quieras volver a inspirarte. ¡Hasta pronto! ✨'
      : 'Thank you! Your tAIlor will be here whenever you need fresh inspiration. See you soon! ✨';
  if (!hasSuggestion) return null;
  if (/^(no|no me gusta|no me convence|no gracias|i dont like it|not really)$/.test(text))
    return es
      ? 'Lo ajustamos. ¿Qué cambiarías: el estilo, los colores, las piezas o el presupuesto? Por ejemplo: «algo más informal, máximo 2.000 €».'
      : 'Let’s adjust it. What would you change: style, colours, pieces or budget? For example: “something more casual, up to €2,000”.';
  // Accept combinations of acknowledgement phrases, but never swallow added constraints.
  if (
    /^(?:(?:si|mucho|muchas gracias|gracias|me gusta|me ha gustado|me encanta|me ha encantado|perfecto|genial|la eleccion|yes|very much|i like it|love it|thanks|thank you)(?:\s+|$))+$/.test(
      text,
    )
  )
    return es
      ? '¡Qué bien! Puedes abrir las piezas del look para elegir tu talla y añadir tus favoritas a la bolsa. Si quieres ajustar algo más, cuéntamelo.'
      : 'Lovely! Open the outfit pieces to choose your size and add your favourites to your bag. Tell me if you would like any changes.';
  return null;
}
