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
  const introduction = 'Soy tAIlor, de KelseTS Maison. Una canción de Taylor Swift.';
  const spoken = stylistSpeechText({ text: introduction }, 'es');
  assert.match(spoken, /Soy téilor/);
  assert.match(spoken, /Taylor Swift/);
  assert.match(introduction, /Soy tAIlor/);
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

test('known voice quota blocks further automatic attempts only for its UTC day', async () => {
  const { voiceQuotaReached, markVoiceQuotaReached } =
    await import('@maison/contracts/stylist-voice');
  const day = new Date('2020-01-01T23:59:59Z');
  markVoiceQuotaReached(day);
  assert.equal(voiceQuotaReached(day), true);
  assert.equal(voiceQuotaReached(new Date('2020-01-02T00:00:00Z')), false);
});

test('generative speech keeps its contextual reply without appending the recurring choice question', () => {
  const text = stylistSpeechText({
    text: 'Conservamos Studio Interview. Revisamos las tallas.',
    result: { mode: 'ai', looks: [{ name: 'Studio Interview', totalCents: 484000, pieces: [] }] },
  });
  assert.match(text, /Revisamos las tallas/);
  assert.doesNotMatch(text, /Con cuál|lo vamos afinando/);
});

test('fresh server availability clears an old client block when the daily ceiling is raised', async () => {
  const { markVoiceQuotaReached, voiceQuotaReached, syncVoiceQuotaStatus } =
    await import('@maison/contracts/stylist-voice');
  const now = new Date('2025-01-01T12:00:00Z');
  markVoiceQuotaReached(now);
  syncVoiceQuotaStatus({ quotaDay: '2024-12-31', quotaAvailable: true }, now);
  assert.equal(voiceQuotaReached(now), true);
  syncVoiceQuotaStatus({ quotaDay: '2025-01-01', quotaAvailable: false }, now);
  assert.equal(voiceQuotaReached(now), true);
  syncVoiceQuotaStatus({ quotaDay: '2025-01-01', quotaAvailable: true }, now);
  assert.equal(voiceQuotaReached(now), false);
});
test('concurrent blocked controls share one read-only quota refresh, without speech or microphone calls', async () => {
  const { markVoiceQuotaReached, voiceQuotaReached, refreshVoiceQuotaStatus } =
    await import('@maison/contracts/stylist-voice');
  markVoiceQuotaReached();
  let requests = 0;
  const request = async () => {
    requests++;
    return { quotaDay: new Date().toISOString().slice(0, 10), quotaAvailable: true };
  };
  await Promise.all([refreshVoiceQuotaStatus(request), refreshVoiceQuotaStatus(request)]);
  assert.equal(requests, 1);
  assert.equal(voiceQuotaReached(), false);
});
