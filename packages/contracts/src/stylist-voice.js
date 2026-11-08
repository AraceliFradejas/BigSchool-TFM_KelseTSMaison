// Prices come from validated catalogue cents; speech uses words, never currency symbols.
function numberWords(n, language) {
  const es = language === 'es';
  const small = es
    ? [
        'cero',
        'un',
        'dos',
        'tres',
        'cuatro',
        'cinco',
        'seis',
        'siete',
        'ocho',
        'nueve',
        'diez',
        'once',
        'doce',
        'trece',
        'catorce',
        'quince',
        'dieciséis',
        'diecisiete',
        'dieciocho',
        'diecinueve',
        'veinte',
        'veintiún',
        'veintidós',
        'veintitrés',
        'veinticuatro',
        'veinticinco',
        'veintiséis',
        'veintisiete',
        'veintiocho',
        'veintinueve',
      ]
    : [
        'zero',
        'one',
        'two',
        'three',
        'four',
        'five',
        'six',
        'seven',
        'eight',
        'nine',
        'ten',
        'eleven',
        'twelve',
        'thirteen',
        'fourteen',
        'fifteen',
        'sixteen',
        'seventeen',
        'eighteen',
        'nineteen',
      ];
  if (n < small.length) return small[n];
  if (n < 100) {
    const tens = es
      ? ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
      : ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    return (
      tens[Math.floor(n / 10)] + (n % 10 ? (es ? ' y ' : '-') + numberWords(n % 10, language) : '')
    );
  }
  if (n < 1000) {
    if (es && n === 100) return 'cien';
    const hundred = es
      ? [
          '',
          'ciento',
          'doscientos',
          'trescientos',
          'cuatrocientos',
          'quinientos',
          'seiscientos',
          'setecientos',
          'ochocientos',
          'novecientos',
        ][Math.floor(n / 100)]
      : numberWords(Math.floor(n / 100), language) + ' hundred';
    return hundred + (n % 100 ? (es ? ' ' : ' and ') + numberWords(n % 100, language) : '');
  }
  return (
    (es && n < 2000
      ? 'mil'
      : numberWords(Math.floor(n / 1000), language) + (es ? ' mil' : ' thousand')) +
    (n % 1000 ? ' ' + numberWords(n % 1000, language) : '')
  );
}
export function spokenMoney(cents, language = 'es') {
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > 1000000) return '';
  const euros = Math.floor(cents / 100),
    fraction = cents % 100;
  return `${numberWords(euros, language)} ${euros === 1 ? 'euro' : 'euros'}${fraction ? (language === 'es' ? ` con ${numberWords(fraction, language)} ${fraction === 1 ? 'céntimo' : 'céntimos'}` : ` and ${numberWords(fraction, language)} ${fraction === 1 ? 'cent' : 'cents'}`) : ''}`;
}
export function stylistSpeechText(message, language = 'es') {
  const es = language === 'es';
  const sections = [String(message.text || '').trim()];
  for (const look of message.result?.looks || []) {
    sections.push(
      look.name,
      look.explanation,
      `${es ? 'Total del look' : 'Outfit total'}: ${spokenMoney(look.totalCents, language)}.`,
    );
    for (const piece of look.pieces || []) {
      const name = piece.product?.name;
      const label = typeof name === 'object' ? name[language] : name;
      const variant = piece.variant?.label?.[language];
      if (label && Number.isInteger(piece.variant?.priceCents))
        sections.push(
          `${label}${variant ? ', ' + variant : ''}: ${spokenMoney(piece.variant.priceCents, language)}.`,
        );
    }
  }
  if (message.result?.looks?.length)
    sections.push(
      es
        ? '¿Con cuál te ves más? Cuéntame qué te gusta y qué cambiarías; lo vamos afinando a tu gusto.'
        : 'Which one feels most like you? Tell me what you like or would change; we can refine it together.',
    );
  return sections
    .filter(Boolean)
    .join(' ')
    .replace(/\bKelseTS\s+Maison\b/gi, 'Kelsi TiEs Meison');
}
export function voiceError(code, language = 'es') {
  const es = language === 'es';
  if (code === 'voice_daily_limit')
    return es
      ? 'Se ha alcanzado el límite de voz de hoy. Puedes seguir escribiendo.'
      : 'Today’s voice limit has been reached. You can keep typing.';
  if (code === 'voice_transcript_invalid')
    return es
      ? 'No te he entendido bien. ¿Puedes repetirlo o escribirlo? Puedes cambiar a modo texto cuando quieras.'
      : 'I did not quite catch that. Could you repeat it or type it? You can switch to text mode whenever you like.';
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
