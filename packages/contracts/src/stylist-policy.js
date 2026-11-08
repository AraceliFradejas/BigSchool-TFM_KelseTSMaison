import { normalizeSpokenBudget } from './stylist-budget.js';
// Deterministic minimum scope checks, shared for immediate UX and enforced again by the API.
// These rules are an extra layer, not a complete semantic moderation system.
const normalize = (text = '') =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
const excludedTopics =
  /\b(sexo|sexual(?:es)?|porn\w*|erotic\w*|sex|nudes?|religion\w*|religious|teologia|theology|politic\w*|elecciones|elections?|partidos? politicos?|votar|voting|vote|presidente|president|guerra|war|receta|recipe|programa(?:cion|r)|javascript|python|diagnostico|diagnosis|inversion|investment)\b/;
const injection =
  /(?:ignora|olvida|ignore|forget|override|bypass).{0,60}(?:instrucciones|reglas|instructions|rules|prompt)|(?:system|developer)\s*(?:prompt|message|:)|(?:revela|muestra|reveal|show).{0,40}(?:secret|clave|api.?key|token|prompt)|(?:cambia|modifica|altera|pon|set|change|modify|update|alter).{0,45}(?:precio|price|stock|permisos|role)|\b(?:sql|drop table|delete from|update products|jailbreak)\b/;
export function stylistUnsafeText(text) {
  const value = normalize(text);
  return excludedTopics.test(value) || injection.test(value);
}
export function stylistScopeViolation(text = '', { awaitingBudget = false } = {}) {
  const value = normalizeSpokenBudget(text, awaitingBudget).trim();
  if (!value) return false; // The detailed preference form does not require free text.
  if (stylistUnsafeText(value)) return true;
  if (/^(hola|hello|hi|buenas|buenos dias|buenas tardes)[!.\s]*$/.test(value)) return false;
  return (
    !/\b(look\w*|outfit\w*|moda|fashion|maison|coleccion\w*|catalog\w*|prenda\w*|ropa|vestid\w*|camisa\w*|blusa\w*|pantalon\w*|falda\w*|blazer|americana|jersey|cardigan|top|zapato\w*|calzado|calzo|shoe\w*|bota\w*|bolso\w*|bag|accesorio\w*|accessor\w*|joya\w*|jewel\w*|maquillaje|makeup|belleza|beauty|perfume|talla|size|presupuesto|budget|cena|dinner|gala|restaurante|restaurant|cita|date|paseo|walk|romantica|romantic|concierto|concert|entrevista|interview|boda|wedding|evento|event|fiesta|party|weekend|semana|estilo|style|informal|casual|formal|elegante|elegant|color\w*|paleta|palette|rojo|red|negro|black|blanco|white|azul|blue|verde|green|rosa|pink|beige|marfil|ivory|dorado|gold|plateado|silver|barato|caro|cheaper|expensive|economico|combinar|combina\w*|wear|clothes|clothing|dress|trousers|skirt|shirt)\b/.test(
      value,
    ) &&
    !/\b(?:tengo|dispongo de|cuento con|i have)\s+-?\d/.test(value) &&
    !/^-?\d[\d.,]*\s*(?:€|eur|euros?)?$/.test(value) &&
    !/\d\s*(?:€|eur\b|euros?\b)/.test(value)
  );
}
export function stylistScopeMessage(language = 'es') {
  return language === 'en'
    ? 'That is outside my styling expertise, but I can help you find a KelseTS Maison outfit that feels like you. What are you planning?'
    : 'Ahí no puedo orientarte. Con los looks de KelseTS Maison sí puedo echarte una mano. ¿Tienes algún plan en mente?';
}
export function stylistUnsafeExplanation(text) {
  return (
    stylistUnsafeText(text) ||
    /[€$£]|\b(?:euros?|eur|usd|dollars?|precio|price|descuento|discount|gratis|free of charge)\b/i.test(
      text,
    )
  );
}
