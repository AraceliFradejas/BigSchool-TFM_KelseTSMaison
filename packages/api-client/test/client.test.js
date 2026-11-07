import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, createApiClient } from '../src/index.js';
const response = (data) => new Response(JSON.stringify({ success: true, data }), { status: 200 });

test('native authorization reads the current opaque token while web remains cookie-only', async () => {
  let token;
  const headers = [];
  const client = createApiClient({
    getAccessToken: () => token,
    fetchImpl: async (url, options) => {
      headers.push(options.headers);
      return response(null);
    },
  });
  await client.request('/auth/me');
  assert.equal(headers[0].Authorization, undefined);
  token = 'a'.repeat(64);
  await client.request('/auth/me');
  assert.equal(headers[1].Authorization, `Bearer ${token}`);
  token = 'b'.repeat(64);
  await client.request('/auth/me');
  assert.equal(headers[2].Authorization, `Bearer ${token}`);
  token = null;
  await client.request('/auth/me');
  assert.equal(headers[3].Authorization, undefined);
  token = 'bad\r\nheader';
  await assert.rejects(client.request('/auth/me'), (error) => error.code === 'invalid_session');
  assert.equal(headers.length, 4);
});
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

test('connection failures expose a translatable code without retrying the action', async () => {
  let attempts = 0;
  const client = createApiClient({
    fetchImpl: async () => {
      attempts++;
      throw new TypeError('Failed to fetch');
    },
  });
  await assert.rejects(
    client.request('/auth/register', { method: 'POST', body: {} }),
    (error) => error instanceof ApiError && error.code === 'network_error' && error.status === 0,
  );
  assert.equal(attempts, 1);
});

test('cancelled requests retain their abort error and custom abort reason', async () => {
  const abort = new DOMException('Cancelled', 'AbortError');
  const client = createApiClient({
    fetchImpl: async () => {
      throw abort;
    },
  });
  await assert.rejects(client.request('/products'), (error) => error === abort);
  const controller = new AbortController();
  const reason = new Error('Navigation changed');
  controller.abort(reason);
  const custom = createApiClient({
    fetchImpl: async () => {
      throw reason;
    },
  });
  await assert.rejects(
    custom.request('/products', { signal: controller.signal }),
    (error) => error === reason,
  );
});

test('malformed JSON envelopes cannot escape as TypeErrors or successful undefined data', async () => {
  for (const payload of [null, [], 'ok', {}, { success: 'true', data: [] }, { success: true }]) {
    const client = createApiClient({
      fetchImpl: async () => new Response(JSON.stringify(payload), { status: 200 }),
    });
    await assert.rejects(
      client.request('/products'),
      (error) =>
        error instanceof ApiError && error.code === 'invalid_response' && error.status === 200,
    );
  }
});

test('untrusted error values remain translatable strings and null session data remains valid', async () => {
  const client = createApiClient({
    fetchImpl: async () =>
      new Response(JSON.stringify({ success: false, error: { internal: 'private' } }), {
        status: 503,
      }),
  });
  await assert.rejects(
    client.request('/products'),
    (error) => error instanceof ApiError && error.code === 'request_failed' && error.status === 503,
  );
  assert.equal(
    await createApiClient({ fetchImpl: async () => response(null) }).request('/auth/me'),
    null,
  );
});

test('cancellation while reading JSON keeps its abort reason', async () => {
  const reason = new DOMException('Cancelled body', 'AbortError');
  const client = createApiClient({
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      async json() {
        throw reason;
      },
    }),
  });
  await assert.rejects(client.request('/products'), (error) => error === reason);
});
