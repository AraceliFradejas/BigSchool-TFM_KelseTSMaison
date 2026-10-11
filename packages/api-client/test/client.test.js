import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, createApiClient } from '../src/index.js';
const response = (data) => new Response(JSON.stringify({ success: true, data }), { status: 200 });
test('transport preserves cancellation, session cookies and the CSRF header', async () => {
  const controller = new AbortController();
  let call;
  const client = createApiClient({
    baseUrl: '/api/v1/',
    fetchImpl: async (...args) => {
      call = args;
      return response({ id: 'order' });
    },
  });
  await client.request('/orders', {
    method: 'POST',
    body: { lines: [] },
    signal: controller.signal,
  });
  assert.equal(call[0], '/api/v1/orders');
  assert.equal(call[1].signal, controller.signal);
  assert.equal(call[1].credentials, 'include');
  assert.equal(call[1].headers['X-Maison-Request'], '1');
  assert.deepEqual(JSON.parse(call[1].body), { lines: [] });
});
test('permission failures retain a translatable code and status', async () => {
  const client = createApiClient({
    fetchImpl: async () =>
      new Response(JSON.stringify({ success: false, error: 'permission_denied' }), { status: 403 }),
  });
  await assert.rejects(
    client.request('/team/orders'),
    (error) =>
      error instanceof ApiError && error.code === 'permission_denied' && error.status === 403,
  );
});
test('an HTML response is never presented as a success', async () => {
  const client = createApiClient({
    fetchImpl: async () => new Response('<html/>', { status: 502 }),
  });
  await assert.rejects(
    client.request('/health'),
    (error) => error.code === 'invalid_response' && error.status === 502,
  );
});
test('multipart upload lets fetch set its boundary', async () => {
  const body = new FormData();
  body.append('image', new Blob(['image']), 'image.png');
  let options;
  const client = createApiClient({
    fetchImpl: async (url, input) => {
      options = input;
      return response(null);
    },
  });
  await client.request('/team/images', { method: 'POST', body, multipart: true });
  assert.equal(options.body, body);
  assert.equal(options.headers['Content-Type'], undefined);
});
