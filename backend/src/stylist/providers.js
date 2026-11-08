export class StylistProviderError extends Error {
  constructor(kind = 'unavailable') {
    super('stylist_provider_failed');
    this.kind = kind;
  }
}

async function boundedJson(response) {
  if (!response.ok) {
    await response.body?.cancel();
    throw new StylistProviderError(response.status === 403 ? 'refusal' : 'unavailable');
  }
  const reader = response.body?.getReader();
  if (!reader) throw new StylistProviderError('invalid_response');
  const parts = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 65536) throw new StylistProviderError('invalid_response');
      parts.push(value);
    }
  } catch (error) {
    throw error instanceof StylistProviderError ? error : new StylistProviderError('unavailable');
  } finally {
    await reader.cancel().catch(() => {});
  }
  return JSON.parse(Buffer.concat(parts).toString('utf8'));
}

// No SDK retries, external tools or user/account data. Conversation prompts include bounded styling history.
export async function requestStylistProvider(settings, prompt, options, fetcher = fetch) {
  const { provider, key, model } = settings;
  const { instructions, input, schema } = prompt;
  let url, headers, body;
  if (provider === 'openai') {
    url = 'https://api.openai.com/v1/responses';
    headers = { Authorization: `Bearer ${key}` };
    body = {
      model,
      instructions,
      input,
      store: false,
      max_output_tokens: options.maxOutputTokens,
      ...(/^gpt-[56]/.test(model) ? { reasoning: { effort: 'none' } } : {}),
      text: { format: { type: 'json_schema', name: 'maison_looks', strict: true, schema } },
    };
  } else if (provider === 'anthropic') {
    url = 'https://api.anthropic.com/v1/messages';
    headers = { 'x-api-key': key, 'anthropic-version': '2023-06-01' };
    body = {
      model,
      system: instructions,
      max_tokens: options.maxOutputTokens,
      messages: [{ role: 'user', content: input }],
      output_config: { format: { type: 'json_schema', schema } },
    };
  } else if (provider === 'gemini') {
    url = 'https://generativelanguage.googleapis.com/v1beta/interactions';
    headers = { 'x-goog-api-key': key, 'Api-Revision': '2026-05-20' };
    body = {
      model,
      system_instruction: instructions,
      input,
      store: false,
      generation_config: { max_output_tokens: options.maxOutputTokens },
      response_format: { type: 'text', mime_type: 'application/json', schema },
    };
  } else throw new StylistProviderError();
  let received = false;
  try {
    const signal = AbortSignal.any([
      AbortSignal.timeout(options.timeoutMs),
      ...(options.signal ? [options.signal] : []),
    ]);
    const response = await fetcher(url, {
      method: 'POST',
      redirect: 'error',
      signal,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    received = true;
    const data = await boundedJson(response);
    let content;
    if (provider === 'openai') {
      content =
        data.output
          ?.filter((item) => item.type === 'message')
          .flatMap((item) => item.content || []) || [];
      if (
        content.some((item) => item.type === 'refusal') ||
        data.incomplete_details?.reason === 'content_filter'
      )
        throw new StylistProviderError('refusal');
      if (data.status !== 'completed') throw new StylistProviderError('invalid_response');
      content = content.filter((item) => item.type === 'output_text');
    } else if (provider === 'anthropic') {
      if (data.stop_reason === 'refusal') throw new StylistProviderError('refusal');
      if (data.stop_reason !== 'end_turn') throw new StylistProviderError('invalid_response');
      content = data.content?.filter((item) => item.type === 'text') || [];
    } else {
      if (data.error?.code === 'content_filter' || data.error?.code === 'safety')
        throw new StylistProviderError('refusal');
      if (data.status !== 'completed') throw new StylistProviderError('invalid_response');
      content =
        data.steps
          ?.filter((step) => step.type === 'model_output')
          .flatMap((step) => step.content || []) || [];
      if (content.some((item) => item.type === 'refusal'))
        throw new StylistProviderError('refusal');
      content = content.filter((item) => item.type === 'text');
    }
    if (content.length !== 1 || typeof content[0].text !== 'string')
      throw new StylistProviderError('invalid_response');
    try {
      return JSON.parse(content[0].text);
    } catch {
      throw new StylistProviderError('invalid_response');
    }
  } catch (error) {
    // Do not expose upstream errors, headers, credentials or raw response bodies.
    throw error instanceof StylistProviderError
      ? error
      : new StylistProviderError(received ? 'invalid_response' : 'unavailable');
  }
}
