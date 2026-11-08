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
    'dos mil trescientos euros',
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

test('spoken prices name euros and cents without ambiguous thousands separators', async () => {
  const { spokenMoney } = await import('@maison/contracts/stylist-voice');
  assert.equal(spokenMoney(239500), 'dos mil trescientos noventa y cinco euros');
  assert.equal(spokenMoney(5500), 'cincuenta y cinco euros');
  assert.equal(
    spokenMoney(239550),
    'dos mil trescientos noventa y cinco euros con cincuenta céntimos',
  );
  assert.equal(spokenMoney(101), 'un euro con un céntimo');
  assert.equal(
    spokenMoney(239550, 'en'),
    'two thousand three hundred and ninety-five euros and fifty cents',
  );
  assert.equal(spokenMoney(-1), '');
  assert.equal(spokenMoney(100000), 'mil euros');
  assert.equal(spokenMoney(10000), 'cien euros');
  assert.equal(spokenMoney(2100), 'veintiún euros');
  assert.equal(spokenMoney(1000000), 'diez mil euros');
});
