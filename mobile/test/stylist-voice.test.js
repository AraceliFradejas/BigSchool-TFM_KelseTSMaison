import test from 'node:test';
import assert from 'node:assert/strict';
import { stylistSpeechText, voiceError } from '@maison/contracts/stylist-voice';
test('voice reads complete outfit explanations, current variant prices and follow-up in both languages', () => {
  const message = {
    text: 'He pensado en tu cena.',
    result: {
      looks: [
        {
          name: 'Golden Hour',
          explanation: 'Una elección luminosa para tu cena.',
          totalCents: 230000,
          pieces: [
            {
              product: { name: { es: 'Vestido dorado', en: 'Golden dress' } },
              variant: { label: { es: 'Talla M', en: 'Size M' }, priceCents: 230000 },
              secret: 'not spoken',
            },
          ],
        },
      ],
    },
  };
  const text = stylistSpeechText(message, 'es');
  for (const expected of [
    'Golden Hour',
    'elección luminosa',
    'Vestido dorado, Talla M',
    '2.300,00',
    '¿Con cuál',
  ])
    assert.ok(text.includes(expected), expected);
  assert.ok(!text.includes('not spoken'));
  assert.match(stylistSpeechText(message, 'en'), /Golden dress, Size M/);
  assert.equal(stylistSpeechText({ text: 'x'.repeat(1000) }).length, 1000);
  assert.match(voiceError('voice_daily_limit', 'es'), /seguir escribiendo/);
});

test('brand transcription correction preserves user names and recognises a spoken greeting', async () => {
  const { normalizeStylistTranscript } = await import('@maison/contracts/stylist-voice');
  const { stylistFeedback } = await import('@maison/contracts/stylist-chat');
  assert.equal(
    normalizeStylistTranscript('Un look de Kelsetes, Mason'),
    'Un look de KelseTS Maison',
  );
  assert.equal(
    normalizeStylistTranscript('Un concierto de Taylor Swift'),
    'Un concierto de Taylor Swift',
  );
  assert.match(stylistFeedback('Hola, Taylor', false), /Soy tAIlor/);
});
