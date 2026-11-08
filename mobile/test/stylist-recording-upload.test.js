import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createStylistRecordingForm } from '../src/stylistRecordingUpload.js';

// Run the installed SDK's actual multipart serializer rather than a reimplementation.
const path = new URL(
  '../../node_modules/expo/src/winter/fetch/convertFormData.ts',
  import.meta.url,
);
let source = await fs.readFile(path, 'utf8');
source = source.replace(
  "import { blobToArrayBufferAsync } from '../../utils/blobUtils';",
  'const blobToArrayBufferAsync = blob => blob.arrayBuffer();',
);
source = source.replace(
  "import type { ExpoFormDataValue } from '../FormData';",
  'type ExpoFormDataValue = string | Blob;',
);
const { stripTypeScriptTypes } = await import('node:module');
const serializer = await import(
  'data:text/javascript;base64,' +
    Buffer.from(stripTypeScriptTypes(source, { mode: 'strip' })).toString('base64')
);
class Form {
  constructor() {
    this.parts = [];
  }
  append(name, value, filename) {
    this.parts.push([name, value, filename]);
  }
  entries() {
    return this.parts.map(([name, value]) => [name, value]);
  }
}
const bytes = new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112, 77, 52, 65, 32, 1, 2, 3, 4]);
const recording = () => ({
  exists: true,
  size: bytes.length,
  type: 'audio/mp4',
  name: 'recording.m4a',
  bytes: async () => bytes,
});
test('SDK58 serializer rejects the former native URI-only part before making a network request', async () => {
  const body = new Form();
  body.append('audio', {
    uri: 'file:///private/recording.m4a',
    name: 'recording.m4a',
    type: 'audio/mp4',
  });
  await assert.rejects(
    serializer.convertFormDataAsync(body, 'test-boundary'),
    /Unsupported FormDataPart/,
  );
});
test('SDK58 serializer sends the real recording bytes, filename and language with Expo File', async () => {
  const body = createStylistRecordingForm(recording(), 'es', Form);
  const result = await serializer.convertFormDataAsync(body, 'test-boundary');
  const binary = Buffer.from(result.body),
    text = binary.toString('latin1');
  assert.ok(binary.includes(Buffer.from(bytes)));
  assert.match(text, /name="language"\r\n\r\nes/);
  assert.match(text, /name="audio"; filename="recording.m4a"/);
  assert.match(text, /content-type: audio\/mp4/);
  assert.doesNotMatch(text, /file:\/\/\/private/);
});
test('missing, empty and oversized recordings fail locally before upload', () => {
  for (const changes of [
    { exists: false },
    { size: 0 },
    { size: 2 * 1024 * 1024 + 1 },
    { bytes: undefined },
  ])
    assert.throws(() => createStylistRecordingForm({ ...recording(), ...changes }, 'es', Form));
});
