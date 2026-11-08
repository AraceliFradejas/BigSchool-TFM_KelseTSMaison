import test from 'node:test';
import assert from 'node:assert/strict';
import { stylistSpeechText, voiceError } from '@maison/contracts/stylist-voice';
test('voice summary reads only the assistant reply and look names within its bound', () => {
  const text = stylistSpeechText(
    {
      text: 'He pensado en tu cena.',
      result: {
        looks: [{ name: 'Golden Hour', totalCents: 230000, pieces: [{ secret: 'not spoken' }] }],
      },
    },
    'es',
  );
  assert.match(text, /Golden Hour/);
  assert.ok(!text.includes('230000'));
  assert.ok(!text.includes('not spoken'));
  assert.ok(stylistSpeechText({ text: 'x'.repeat(1000) }).length <= 600);
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
