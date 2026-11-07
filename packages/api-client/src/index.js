// HTTP transport adapted from Araceli Fradejas Muñoz's KelseTS Cars.
export class ApiError extends Error {
  constructor(code, status) {
    super(code);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}
export function createApiClient({
  baseUrl = '/api/v1',
  fetchImpl = globalThis.fetch,
  getAccessToken,
} = {}) {
  async function request(path, { body, method = 'GET', signal, multipart = false } = {}) {
    const token = getAccessToken?.();
    if (token && (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)))
      throw new ApiError('invalid_session', 0);
    const response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}${path}`, {
      method,
      signal,
      credentials: 'include',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    } catch (error) {
      if (error.name === 'AbortError' || signal?.aborted) throw error;
      throw new ApiError('invalid_response', response.status);
    }
    if (
      !payload ||
      typeof payload !== 'object' ||
      Array.isArray(payload) ||
      typeof payload.success !== 'boolean' ||
      (payload.success && !Object.hasOwn(payload, 'data'))
    )
      throw new ApiError('invalid_response', response.status);
    if (!response.ok || !payload.success)
      throw new ApiError(
        typeof payload.error === 'string' ? payload.error : 'request_failed',
        response.status,
      );
    return payload.data;
  }
  return { request };
}
