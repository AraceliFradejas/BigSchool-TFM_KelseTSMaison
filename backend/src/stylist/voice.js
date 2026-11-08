import { normalizeStylistTranscript } from '@maison/contracts/stylist-voice';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { HttpError, parse, send } from '../http.js';
import { claimStylistCall, readStylistVoiceQuota } from './quota.js';
import { stylistUnsafeText } from '@maison/contracts/stylist-policy';

export const voiceAvailable = (config, now = Date.now()) =>
  Boolean(config?.voice?.enabled && (config.expiresAt == null || now < config.expiresAt));
const speechSchema = z
  .object({ text: z.string().trim().min(1).max(6000), language: z.enum(['es', 'en']) })
  .strict();
const languageSchema = z.object({ language: z.enum(['es', 'en']) }).strict();
export function audioFormat(buffer) {
  if (buffer.length < 16) return null;
  if (buffer.toString('ascii', 0, 3) === 'ID3' || (buffer[0] === 255 && (buffer[1] & 224) === 224))
    return { type: 'audio/mpeg', name: 'recording.mp3' };
  if (buffer.toString('ascii', 4, 8) === 'ftyp')
    return { type: 'audio/mp4', name: 'recording.m4a' };
  if (buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])))
    return { type: 'audio/webm', name: 'recording.webm' };
  if (buffer.toString('ascii', 0, 4) === 'OggS')
    return { type: 'audio/ogg', name: 'recording.ogg' };
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WAVE')
    return { type: 'audio/wav', name: 'recording.wav' };
  return null;
}
async function boundedBody(response, maxBytes) {
  if (!response.ok) {
    await response.body?.cancel();
    throw new HttpError(503, 'voice_unavailable');
  }
  const reader = response.body?.getReader();
  if (!reader) throw new HttpError(503, 'voice_unavailable');
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new HttpError(503, 'voice_unavailable');
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  } finally {
    await reader.cancel().catch(() => {});
  }
}
export async function requestVoice(kind, payload, config, signal, fetcher = fetch) {
  const options = {
    method: 'POST',
    redirect: 'error',
    headers: { 'xi-api-key': config.key },
    signal: AbortSignal.any([
      AbortSignal.timeout(kind === 'speech' ? 45000 : 30000),
      ...(signal ? [signal] : []),
    ]),
  };
  let url;
  if (kind === 'speech') {
    url = `https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}?output_format=mp3_22050_32`;
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify({ text: payload.text, model_id: 'eleven_multilingual_v2' });
  } else {
    url = 'https://api.elevenlabs.io/v1/speech-to-text';
    const data = new FormData();
    data.append(
      'file',
      new Blob([payload.buffer], { type: payload.format.type }),
      payload.format.name,
    );
    data.append('model_id', 'scribe_v2');
    data.append('language_code', payload.language);
    data.append('tag_audio_events', 'false');
    data.append('diarize', 'false');
    options.body = data;
  }
  try {
    const response = await fetcher(url, options);
    const buffer = await boundedBody(response, kind === 'speech' ? 3 * 1024 * 1024 : 65536);
    if (kind === 'speech') {
      if (
        !/^audio\//i.test(response.headers.get('content-type') || '') ||
        !(
          buffer.toString('ascii', 0, 3) === 'ID3' ||
          (buffer[0] === 255 && (buffer[1] & 224) === 224)
        )
      )
        throw new HttpError(503, 'voice_unavailable');
      return { audioBase64: buffer.toString('base64'), mimeType: 'audio/mpeg' };
    }
    const result = JSON.parse(buffer.toString());
    if (typeof result.text !== 'string' || !result.text.trim() || result.text.trim().length > 1200)
      throw new HttpError(422, 'voice_transcript_invalid');
    const text = normalizeStylistTranscript(result.text.trim());
    if (text.length > 1200) throw new HttpError(422, 'voice_transcript_invalid');
    return { text };
  } catch (error) {
    if (signal?.aborted) throw error;
    if (error instanceof HttpError) throw error;
    throw new HttpError(503, 'voice_unavailable');
  }
}
export function voiceRouter(db, config, limiter, provider = requestVoice) {
  const router = Router();
  router.get('/stylist/voice/status', async (req, res) =>
    send(res, {
      available: voiceAvailable(config),
      ...(await readStylistVoiceQuota(db, config.voice?.dailyLimit || 6)),
      dailyActionLimit: config.voice?.dailyLimit || 6,
      maxRecordingSeconds: 60,
      maxAudioBytes: 2 * 1024 * 1024,
      maxSpeechChars: 6000,
    }),
  );
  const ready = (req, res, next) => {
    if (!voiceAvailable(config)) return next(new HttpError(503, 'voice_disabled'));
    if (config.requireAccount !== false && !req.user)
      return next(new HttpError(401, 'unauthorized'));
    next();
  };
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 1, parts: 2 },
  }).single('audio');
  async function run(req, res, kind, payload) {
    if (!voiceAvailable(config)) throw new HttpError(503, 'voice_disabled');
    if (!(await claimStylistCall(db, config.voice.dailyLimit, new Date(), 'stylist_voice_usage')))
      throw new HttpError(429, 'voice_daily_limit');
    const controller = new AbortController();
    const close = () => {
      if (!res.writableFinished) controller.abort();
    };
    res.on('close', close);
    try {
      const result = await provider(kind, payload, config.voice, controller.signal);
      if (!controller.signal.aborted) send(res, result);
    } finally {
      res.removeListener('close', close);
    }
  }
  router.post('/stylist/voice/speech', limiter, ready, async (req, res) => {
    const payload = parse(speechSchema, req.body);
    if (stylistUnsafeText(payload.text)) throw new HttpError(400, 'voice_text_invalid');
    await run(req, res, 'speech', payload);
  });
  router.post('/stylist/voice/transcribe', limiter, ready, upload, async (req, res) => {
    const { language } = parse(languageSchema, req.body);
    const format = req.file && audioFormat(req.file.buffer);
    if (!format) throw new HttpError(400, 'voice_audio_invalid');
    await run(req, res, 'transcribe', { language, format, buffer: req.file.buffer });
  });
  return router;
}
