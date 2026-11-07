import test from 'node:test';
import assert from 'node:assert/strict';
import { readConfig } from '../src/config.js';

test('configuration rejects unusable ports before starting a server', () => {
  for (const PORT of ['NaN', 'Infinity', '-1', '0', '1.5', '65536', ' '])
    assert.throws(() => readConfig({ PORT }), /PORT/);
  assert.equal(readConfig({}).port, 3000);
  assert.equal(readConfig({ PORT: '65535' }).port, 65535);
});

test('serverless cannot fall back to development cookies or an insecure origin', () => {
  const env = {
    VERCEL: '1',
    MONGODB_URI: 'mongodb://example.invalid',
    MONGODB_DATABASE: 'maison',
    CLOUDINARY_CLOUD_NAME: 'maison',
    CLOUDINARY_API_KEY: 'test',
    CLOUDINARY_API_SECRET: 'test',
  };
  assert.throws(() => readConfig(env), /APP_ORIGIN/);
  assert.throws(() => readConfig({ ...env, APP_ORIGIN: 'http://maison.example.test' }), /HTTPS/);
  assert.equal(readConfig({ ...env, APP_ORIGIN: 'https://maison.example.test' }).production, true);
});

test('origins allow only HTTP(S), without credentials, paths or query strings', () => {
  for (const APP_ORIGIN of [
    'not-a-valid-origin',
    'ftp://maison.example.test',
    'https://user:password@maison.example.test',
    'https://maison.example.test/path',
    'https://maison.example.test?key=value',
  ])
    assert.throws(() => readConfig({ APP_ORIGIN }), /APP_ORIGIN/);
  assert.equal(readConfig({ APP_ORIGIN: 'http://localhost:5173' }).origin, 'http://localhost:5173');
});
