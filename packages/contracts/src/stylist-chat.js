import {
  requestedPieceType,
  requestedDressCode,
  productPieceType,
  replacesPieceType,
} from './stylist-pieces.js';
import { normalizeSpokenBudget } from './stylist-budget.js';
import { stylistUnsafeText, stylistScopeViolation } from './stylist-policy.js';
// The chat asks explicitly for a budget rather than silently assuming one.
// These local rules identify common numeric constraints; style interpretation stays with the model.
export function chatPreferences(message, previous = {}) {
  const text = message.trim();
  const normalized = normalizeSpokenBudget(text, !previous.budgetCents);
  const preferences = {
    occasion: 'any',
    color: 'any',
    excludeBeauty: false,
    style: '',
    dressCode: 'any',
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
    ['dinner', /\b(cena|cenar|dinner|restaurante|restaurant|michelin)\b/],
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
  const dressCode = requestedDressCode(normalized);
  if (dressCode) preferences.dressCode = dressCode;
  if (preferences.dressCode === 'gala') preferences.occasion = 'event';
  if (/\bsin (?:productos de )?(?:belleza|maquillaje)\b|without (?:beauty|makeup)/.test(normalized))
    preferences.excludeBeauty = true;
  if (/(?:incluye|incluir|include) (?:belleza|maquillaje|beauty|makeup)/.test(normalized))
    preferences.excludeBeauty = false;
  if (!/^\d[\d.,]*\s*(?:€|euros?)?$/.test(normalized))
    preferences.style = (
      previous.style ? `${previous.style.slice(-190)}\nAhora: ${text}` : text
    ).slice(-1200);
  const needsPlan =
    /\b(cita|date)\b/i.test(preferences.style) &&
    ['any', 'weekend'].includes(preferences.occasion) &&
    preferences.dressCode === 'any';
  return {
    preferences,
    needsBudget: !preferences.budgetCents || invalidBudget,
    invalidBudget,
    needsPlan,
  };
}

// Identity questions and short feedback are local: no provider call or filter changes.
export function stylistFeedback(message, hasSuggestion, language = 'es', suggestion = null) {
  const text = message
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[¡!¿?.,;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const es = language === 'es';
  if (stylistUnsafeText(message)) return null;
  const chosenPiece = stylistChosenComplement(message, suggestion);
  if (chosenPiece)
    return es
      ? `¡Perfecto! Nos quedamos con ${suggestion.referenceLook?.name || suggestion.looks?.[0]?.name || 'tu conjunto'} y ${chosenPiece.product.name.es}. Puedes abrir la pieza para revisar tu talla y añadirla a la bolsa. ¿Te ayudo con algún detalle más?`
      : `Perfect! We will keep ${suggestion.referenceLook?.name || suggestion.looks?.[0]?.name || 'your outfit'} with ${chosenPiece.product.name.en}. Open the piece to check your size and add it to your bag. Anything else you would like to refine?`;
  const selected = stylistChosenLook(message, suggestion);
  if (selected)
    return es
      ? `¡Perfecto, nos quedamos con ${selected.name}! Abre sus piezas para revisar las tallas y añadir las que quieras a la bolsa. ¿Te ayudo con algún detalle más?`
      : `Lovely choice! ${selected.name} can be your outfit for the occasion. Open its pieces to check sizes and add your favourites to the bag. Anything else you would like to refine?`;
  const clarification = choiceClarification(message, suggestion, language);
  if (clarification) return clarification;
  if (
    /^(?:eres (?:un |una )?(?:robot|bot|ia|inteligencia artificial|humano|humana)|quien eres|que eres|are you (?:a |an )?(?:robot|bot|ai|human)|who are you|what are you)$/.test(
      text,
    )
  )
    return es
      ? 'Soy tu tAIlor ✨, tu estilista personal virtual de KelseTS Maison. No coso botones, ¡pero sí te ayudo a encontrar un look a tu medida! ¿Qué tienes planeado?'
      : 'I’m your tAIlor ✨, your personal virtual stylist at KelseTS Maison. I don’t sew buttons, but I can help you find an outfit that suits you! What are you planning?';
  if (
    /^(?:(?:(?:hola|hello|hi)(?:\s+(?:tailor|taylor))?|buenas|buenos dias|buenas tardes|buenas noches|hey|good morning|good afternoon|good evening)(?:\s+|$))+$/.test(
      text,
    )
  ) {
    const greeting = es
      ? text.includes('buenos dias')
        ? '¡Buenos días!'
        : text.includes('buenas tardes')
          ? '¡Buenas tardes!'
          : text.includes('buenas noches')
            ? '¡Buenas noches!'
            : '¡Hola!'
      : text.includes('good morning')
        ? 'Good morning!'
        : text.includes('good afternoon')
          ? 'Good afternoon!'
          : text.includes('good evening')
            ? 'Good evening!'
            : text === 'hi'
              ? 'Hi!'
              : 'Hello!';
    return es
      ? `${greeting} Soy tAIlor, tu estilista personal virtual de KelseTS Maison. ¿En qué te puedo ayudar? ✨`
      : `${greeting} I’m tAIlor, your personal virtual stylist at KelseTS Maison. How can I help? ✨`;
  }
  if (
    /^(?:(?:adios|hasta luego|hasta pronto|nos vemos|chao|chau|bye|goodbye|see you|gracias|muchas gracias|thank you|thanks)(?:\s+|$))+$/.test(
      text,
    )
  )
    return stylistFarewell(language, suggestion);
  if (!hasSuggestion) return null;
  if (/^(no|no me gusta|no me convence|no gracias|i dont like it|not really)$/.test(text))
    return es
      ? 'Lo ajustamos. ¿Qué cambiarías: el estilo, los colores, las piezas o el presupuesto? Por ejemplo: «algo más informal, máximo 2.000 €».'
      : 'Let’s adjust it. What would you change: style, colours, pieces or budget? For example: “something more casual, up to €2,000”.';
  // Accept combinations of acknowledgement phrases, but never swallow added constraints.
  if (
    /^(?:(?:si|mucho|muchas gracias|gracias|me gusta|me ha gustado|me encanta|me ha encantado|perfecto|perfecta|genial|esta|todo|muy|bien|es|eso|por todo|la eleccion|all|everything|is|perfect|great|yes|very much|i like it|love it|thanks|thank you)(?:\s+|$))+$/.test(
      text,
    )
  )
    return /gracias|thanks|thank you/.test(text) && suggestion?.looks?.length
      ? stylistFarewell(language, suggestion)
      : es
        ? '¡Qué bien! Puedes abrir las piezas del look para elegir tu talla y añadir tus favoritas a la bolsa. Si quieres ajustar algo más, cuéntamelo.'
        : 'Lovely! Open the outfit pieces to choose your size and add your favourites to your bag. Tell me if you would like any changes.';
  return null;
}

const feedbackNormalize = (text) =>
  String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[¡!¿?.,;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
function choiceCandidate(message) {
  const text = feedbackNormalize(message);
  const prefix = /^(?:me quedo con|elijo|prefiero|me gusta|i choose|i prefer|i'll take)\s+/.exec(
    text,
  );
  const candidate = text
    .slice(prefix?.[0].length || 0)
    .replace(/^(?:(?:el|la|the|conjunto|look|outfit|de)\s+)+/, '');
  return { candidate, explicit: Boolean(prefix) };
}
export function stylistChosenLook(message, suggestion) {
  if (stylistUnsafeText(message)) return null;
  const { candidate } = choiceCandidate(message);
  const matches = (suggestion?.looks || []).filter(
    (look) => feedbackNormalize(look.name).replace(/\s/g, '') === candidate.replace(/\s/g, ''),
  );
  return matches.length === 1 ? matches[0] : null;
}
function editDistance(a, b) {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++)
      next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + (a[i - 1] !== b[j - 1]));
    row = next;
  }
  return row[b.length];
}
function choiceClarification(message, suggestion, language) {
  if (!suggestion?.looks?.length) return null;
  const { candidate, explicit } = choiceCandidate(message);
  if (
    !candidate ||
    candidate.length > 80 ||
    /\b(pero|sin|con|talla|presupuesto|menos|mas|but|without|size|budget|color)\b/.test(candidate)
  )
    return null;
  // A request for a dress, colour or occasion is a new styling preference, not a failed name.
  if (!stylistScopeViolation(candidate)) return null;
  const compact = candidate.replace(/\s/g, '');
  const near = suggestion.looks.filter((look) => {
    const name = feedbackNormalize(look.name).replace(/\s/g, '');
    return Math.min(name.length, compact.length) >= 7 && editDistance(name, compact) <= 2;
  });
  if (near.length === 1)
    return language === 'es'
      ? `¿Te refieres a ${near[0].name}? No he entendido bien el nombre. Puedes escribirlo en modo texto para que lo confirmemos.`
      : `Do you mean ${near[0].name}? I did not quite catch the name. You can type it in text mode so we can confirm it.`;
  if (explicit && candidate.split(' ').length <= 5)
    return language === 'es'
      ? 'No he entendido bien cuál eliges. ¿Puedes escribir el nombre del look? Pulsa «Cambiar a texto» y lo vemos juntos.'
      : 'I did not quite catch which outfit you chose. Could you type its name? Tap “Switch to text” and we will check it together.';
  return null;
}
// Confirm only a single option actually shown. A question or change of constraints is not a choice.
export function stylistChosenComplement(message, suggestion) {
  if (!suggestion?.complements?.length || stylistUnsafeText(message)) return null;
  const text = feedbackNormalize(message)
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (
    /\b(tienes|hay|busco|puedes|recomiendas|recomendar|aconsejas|recommend|suggest|pero|sin|otro|otra|mas|menos|presupuesto|talla|budget|size|without|instead|show)\b/.test(
      text,
    )
  )
    return null;
  const selected =
    /\b(me quedaria|me quedo|elijo|prefiero|me gusta|est[ea]s? (?:pantalon(?:es)?|zapatos?|bolsos?|vestidos?|blusas?|joyas?)|es[ea]s? (?:pantalon(?:es)?|zapatos?|bolsos?|vestidos?|blusas?|joyas?)|i choose|i prefer|i ll take)\b/.test(
      text,
    );
  const matches = suggestion.complements.filter((option) => {
    const aliases = Object.values(option.product.name)
      .flatMap((name) => [name.split('·').at(-1), name])
      .map((name) =>
        feedbackNormalize(name)
          .replace(/[^a-z0-9 ]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim(),
      );
    return aliases.some((alias) => {
      const spoken =
        alias === 'ready for it' ? text.replace(/\bready por it\b/g, 'ready for it') : text;
      return (
        alias.length >= 4 &&
        (spoken === alias || (selected && ` ${spoken} `.includes(` ${alias} `)))
      );
    });
  });
  return matches.length === 1 ? matches[0] : null;
}
export function stylistConversationContext(messages) {
  let result = null;
  for (const message of messages) {
    if (message.result) {
      const response = message.result;
      if (response.referenceLook)
        result = { ...response, looks: [response.referenceLook], selected: true };
      else if (response.looks?.length || response.complements?.length || !result) result = response;
      else result = { ...result, preferences: response.preferences || result.preferences };
    }
    if (message.role === 'user') {
      const piece = stylistChosenComplement(message.text, result);
      if (piece) {
        const kind = productPieceType(piece.product);
        const previous = (result.selectedAdditions || []).filter(
          (old) =>
            old.product.id !== piece.product.id &&
            (!replacesPieceType(kind) || productPieceType(old.product) !== kind),
        );
        result = {
          ...result,
          selectedComplement: piece,
          selectedAdditions: [...previous, piece],
          selected: true,
        };
      }
      const chosen = stylistChosenLook(message.text, result);
      if (chosen) result = { ...result, looks: [chosen], selected: true };
    }
  }
  return result;
}

function stylistFarewell(language, suggestion) {
  const es = language === 'es';
  if (!suggestion?.looks?.length)
    return es
      ? '¡Hasta pronto! Aquí estará tu tAIlor cuando quieras volver a inspirarte. ✨'
      : 'See you soon! Your tAIlor will be here whenever you need fresh inspiration. ✨';
  const style = (suggestion.preferences?.style || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const occasion = suggestion.preferences?.occasion;
  let wish = es ? '¡Que disfrutes mucho de tu plan!' : 'Have a wonderful time!';
  if (occasion === 'event' && /\b(boda|wedding)\b/.test(style))
    wish = es ? '¡Que disfrutes muchísimo de la boda!' : 'Have a wonderful time at the wedding!';
  else if (occasion === 'dinner' && /negocios|business/.test(style))
    wish = es
      ? '¡Que vaya muy bien esa cena de negocios!'
      : 'I hope your business dinner goes really well!';
  else if (occasion === 'television')
    wish = es ? '¡Mucha suerte en tu entrevista!' : 'Best of luck with your interview!';
  else {
    const wishes = {
      dinner: ['¡Que disfrutes de esa cena especial!', 'Enjoy your special dinner!'],
      concert: ['¡Que disfrutes muchísimo del concierto!', 'Have an amazing time at the concert!'],
      weekend: ['¡Que disfrutes del fin de semana!', 'Have a lovely weekend!'],
      event: ['¡Que disfrutes mucho de la celebración!', 'Have a lovely celebration!'],
      everyday: ['¡Que tengas un día estupendo!', 'Have a wonderful day!'],
    };
    if (wishes[occasion]) wish = wishes[occasion][es ? 0 : 1];
  }
  const names = suggestion.looks.slice(0, 3).map((look) => String(look.name).slice(0, 120));
  if (suggestion.selectedAdditions?.length)
    names.push(...suggestion.selectedAdditions.map((piece) => piece.product.name[language]));
  else if (suggestion.selectedComplement)
    names.push(suggestion.selectedComplement.product.name[language]);
  const last = names.pop();
  const conjunction =
    suggestion.selectedComplement || suggestion.selectedAdditions?.length
      ? es
        ? 'y'
        : 'and'
      : es
        ? 'o'
        : 'or';
  const choices = names.length ? `${names.join(', ')} ${conjunction} ${last}` : last;
  return es
    ? `¡Gracias a ti! ${wish} ${suggestion.selected ? `Puedes volver a las piezas de ${choices} cuando quieras.` : `Puedes revisar las piezas de ${choices} cuando te decidas.`} Aquí estará tu tAIlor si necesitas otro look. ✨`
    : `Thank you! ${wish} ${suggestion.selected ? `You can revisit the pieces in ${choices} whenever you like.` : `You can review the pieces in ${choices} when you decide.`} Your tAIlor is here whenever you need another outfit. ✨`;
}

export function stylistBudgetQuestion(parsed, language = 'es') {
  if (parsed.invalidBudget)
    return language === 'es'
      ? 'Vamos a ajustar ese presupuesto: puedo buscar conjuntos entre 1 y 10.000 €. ¿Qué máximo te viene bien?'
      : 'Let’s adjust that budget: I can look for outfits between €1 and €10,000. What maximum works for you?';
  const p = parsed.preferences;
  const plans = {
    dinner: ['Para esa cena', 'For your dinner'],
    concert: ['Para ese concierto', 'For your concert'],
    event: ['Para esa celebración', 'For your celebration'],
    television: ['Para esa entrevista', 'For your interview'],
    weekend: ['Para ese fin de semana', 'For your weekend'],
  };
  const plan = /\b(cita|date)\b/i.test(p.style)
    ? ['Para esa cita', 'For your date']
    : plans[p.occasion];
  return language === 'es'
    ? `${plan ? plan[0] + ', ¿qué' : '¿Qué'} presupuesto máximo te viene bien para el conjunto? Después afinamos los detalles a tu gusto.`
    : `${plan ? plan[1] + ', what' : 'What'} maximum budget feels right for the whole outfit? We can fine-tune the details together.`;
}
export function stylistEditorialIntro(preferences, language = 'es', hasLooks = true) {
  if (!hasLooks)
    return language === 'es'
      ? 'Con lo que me has contado no encuentro un conjunto completo disponible. ¿Revisamos la talla, el estilo o el presupuesto?'
      : 'I could not find a complete available outfit for that request. Shall we revisit the size, style or budget?';
  const plans = {
    dinner: ['esa cena', 'your dinner'],
    concert: ['ese concierto', 'your concert'],
    event: ['esa celebración', 'your celebration'],
    television: ['esa entrevista', 'your interview'],
    weekend: ['el fin de semana', 'your weekend'],
  };
  const plan = plans[preferences.occasion];
  return language === 'es'
    ? `He reunido varias ideas${plan ? ' para ' + plan[0] : ' para tu look'}. Vamos a buscar una opción con la que te sientas a gusto.`
    : `I’ve brought together a few ideas${plan ? ' for ' + plan[1] : ' for your outfit'}. Let’s find an option you feel comfortable wearing.`;
}

// Resolve a requested addition from the displayed catalogue context, never from client prices.
export function stylistFollowUp(message, suggestion) {
  if (
    !suggestion?.looks?.length ||
    stylistUnsafeText(message) ||
    stylistChosenComplement(message, suggestion)
  )
    return null;
  const text = feedbackNormalize(message);
  const pieceType = requestedPieceType(text);
  if (!pieceType || /\b(?:sin|no quiero|no me gustan|without|don't want)\b/.test(text)) return null;
  const mentioned = suggestion.looks.filter((look) => text.includes(feedbackNormalize(look.name)));
  if (mentioned.length > 1) return null;
  const reference = mentioned[0] || (suggestion.looks.length === 1 ? suggestion.looks[0] : null);
  return {
    pieceType,
    ...(reference ? { referenceLookId: reference.id } : {}),
    ...(suggestion.selectedAdditions?.length
      ? { selectedProductIds: suggestion.selectedAdditions.map((piece) => piece.product.id) }
      : {}),
  };
}
export function stylistDisplayOptions(result, language = 'es') {
  if (!result?.complements) return result?.looks || [];
  return result.complements.map(({ product, variant, totalWithLookCents }) => ({
    id: product.id,
    name: product.name[language],
    totalCents: totalWithLookCents,
    pieces: [{ product, variant }],
  }));
}

// The conversational endpoint receives bounded text and public catalogue IDs, never client prices.
export function stylistConversationRequest(
  message,
  { preferences = {}, messages = [], language = 'es' },
) {
  const context = stylistConversationContext(messages);
  const keys = [
    'budgetCents',
    'occasion',
    'color',
    'excludeBeauty',
    'size',
    'shoeSize',
    'style',
    'dressCode',
  ];
  return {
    message,
    language,
    preferences: Object.fromEntries(
      keys.filter((key) => preferences[key] !== undefined).map((key) => [key, preferences[key]]),
    ),
    history: messages.slice(-8).map((turn) => ({ role: turn.role, text: turn.text.slice(0, 500) })),
    context: {
      currentLookIds: (context?.looks || [])
        .map((look) => look.id)
        .filter(Boolean)
        .slice(0, 3),
      lookIds: [
        ...new Set(
          messages
            .flatMap((turn) => turn.result?.looks?.map((look) => look.id) || [])
            .filter(Boolean),
        ),
      ].slice(-12),
      referenceLookId:
        context?.referenceLook?.id ||
        (context?.selected && context.looks?.length === 1 ? context.looks[0].id : null) ||
        null,
      optionProductIds: (
        messages
          .slice()
          .reverse()
          .find((turn) => turn.result?.complements?.length)?.result.complements || []
      )
        .map((piece) => piece.product.id)
        .slice(0, 12),
      selectedProductIds: (context?.selectedAdditions || [])
        .map((piece) => piece.product.id)
        .slice(-8),
    },
  };
}
