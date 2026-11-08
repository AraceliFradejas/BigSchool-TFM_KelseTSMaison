export function stylistSpeechText(message, language = 'es') {
  const names = message.result?.looks?.map((look) => look.name).filter(Boolean) || [];
  const intro = String(message.text || '').trim();
  const list = names.length
    ? `${language === 'es' ? 'Mis propuestas son' : 'My suggestions are'} ${names.join(', ')}.`
    : '';
  return [intro, list].filter(Boolean).join(' ').slice(0, 600);
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
