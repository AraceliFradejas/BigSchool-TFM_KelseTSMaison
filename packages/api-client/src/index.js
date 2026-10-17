// HTTP transport adapted from Araceli Fradejas Muñoz's KelseTS Cars.
export class ApiError extends Error {
  constructor(code, status) {
    super(code);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}
export function createApiClient({ baseUrl = '/api/v1', fetchImpl = globalThis.fetch } = {}) {
  async function request(path, { body, method = 'GET', signal, multipart = false } = {}) {
    const response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}${path}`, {
      method,
      signal,
      credentials: 'include',
      headers: {
        ...(!multipart && body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(method !== 'GET' ? { 'X-Maison-Request': '1' } : {}),
      },
      body: body === undefined ? undefined : multipart ? body : JSON.stringify(body),
    }).catch((error) => {
      if (error.name === 'AbortError' || signal?.aborted) throw error;
      throw new ApiError('network_error', 0);
    });
    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new ApiError('invalid_response', response.status);
    }
    if (!response.ok || !payload.success)
      throw new ApiError(payload.error || 'request_failed', response.status);
    return payload.data;
  }
  return { request };
}
