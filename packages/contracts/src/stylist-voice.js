import { formatMoney } from './money.js';
export function stylistSpeechText(message, language = 'es') {
  const es = language === 'es';
  const sections = [String(message.text || '').trim()];
  for (const look of message.result?.looks || []) {
    sections.push(
      look.name,
      look.explanation,
      `${es ? 'Total del look' : 'Outfit total'}: ${formatMoney(look.totalCents)}.`,
    );
    for (const piece of look.pieces || []) {
      const name = piece.product?.name;
      const label = typeof name === 'object' ? name[language] : name;
      const variant = piece.variant?.label?.[language];
      if (label && Number.isInteger(piece.variant?.priceCents))
        sections.push(
          `${label}${variant ? ', ' + variant : ''}: ${formatMoney(piece.variant.priceCents)}.`,
        );
    }
  }
  if (message.result?.looks?.length)
    sections.push(
      es
        ? '¿Con cuál te ves más? Cuéntame qué te gusta y qué cambiarías; lo vamos afinando a tu gusto.'
        : 'Which one feels most like you? Tell me what you like or would change; we can refine it together.',
    );
  return sections.filter(Boolean).join(' ');
}
export function voiceError(code, language = 'es') {
  const es = language === 'es';
  if (code === 'voice_daily_limit')
    return es
      ? 'Se ha alcanzado el límite de voz de hoy. Puedes seguir escribiendo.'
      : 'Today’s voice limit has been reached. You can keep typing.';
  if (code === 'voice_transcript_invalid')
    return es
      ? 'No he obtenido una frase breve y clara. Prueba un audio más corto o escribe tu petición.'
      : 'I could not get a short, clear sentence. Try a shorter recording or type your request.';
  return es
    ? 'No he podido completar la acción de voz. Puedes intentarlo de nuevo o seguir por escrito.'
    : 'I could not complete that voice action. Try again or keep typing.';
}

// Correct only known spellings of the fictional brand; never rewrite the artist's name.
export function normalizeStylistTranscript(text) {
  return text.replace(
    /\b(?:kelsetes|kelsets|kelse\s+t\s+s)\s*,?\s*(?:mason|maison)\b/gi,
    'KelseTS Maison',
  );
}
