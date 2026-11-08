// Expo SDK 58's default fetch accepts File/Blob parts, not the old RN {uri,name,type}.
// Inject only the form constructor for a meaningful transport regression in Node.
export function createStylistRecordingForm(file, language, Form = FormData) {
  if (
    !file?.exists ||
    !Number.isInteger(file.size) ||
    file.size <= 0 ||
    file.size > 2 * 1024 * 1024
  )
    throw new Error('Invalid recording');
  if (typeof file.bytes !== 'function') throw new Error('Recording must be an Expo File');
  if (!['es', 'en'].includes(language)) throw new Error('Invalid recording language');
  const body = new Form();
  body.append('language', language);
  // A real File carries the bytes consumed by Expo's convertFormDataAsync.
  body.append('audio', file, 'recording.m4a');
  return body;
}

export async function stopStylistRecording(recorder, savedUri) {
  const before = savedUri || recorder.uri || recorder.getStatus?.().url;
  await recorder.stop();
  const uri = recorder.uri || before;
  if (!uri) {
    const error = new Error('Recording file missing');
    error.code = 'voice_recording_missing';
    throw error;
  }
  return uri;
}
