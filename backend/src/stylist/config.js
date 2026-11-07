const providers = ['gemini', 'openai', 'anthropic'];
export function readStylistConfig(env) {
  const enabled = env.STYLIST_ENABLED === '1';
  if (!['0', '1', undefined, ''].includes(env.STYLIST_ENABLED))
    throw new Error('Invalid STYLIST_ENABLED.');
  const order = (env.STYLIST_PROVIDERS || 'gemini,anthropic,openai')
    .split(',')
    .map((value) => value.trim());
  if (
    !order.length ||
    order.length > 3 ||
    new Set(order).size !== order.length ||
    order.some((value) => !providers.includes(value))
  )
    throw new Error('Invalid stylist provider order.');
  const integer = (key, defaultValue, min, max) => {
    const value = Number(env[key] || defaultValue);
    if (!Number.isInteger(value) || value < min || value > max) throw new Error(`Invalid ${key}.`);
    return value;
  };
  const settings = {
    gemini: { key: env.GEMINI_API_KEY, model: env.GEMINI_MODEL },
    openai: { key: env.OPENAI_API_KEY, model: env.OPENAI_MODEL },
    anthropic: { key: env.ANTHROPIC_API_KEY, model: env.ANTHROPIC_MODEL },
  };
  const chain = order.map((provider) => ({ provider, ...settings[provider] }));
  if (
    enabled &&
    chain.some((item) => !item.key?.trim() || !/^[a-zA-Z0-9._-]{1,100}$/.test(item.model || ''))
  )
    throw new Error('Configure each enabled stylist provider with its own API key and model.');
  return {
    enabled,
    chain: enabled ? chain : [],
    dailyLimit: integer('STYLIST_DAILY_CALL_LIMIT', 20, 1, 200),
    timeoutMs: integer('STYLIST_TIMEOUT_MS', 8000, 1000, 10000),
    maxOutputTokens: integer('STYLIST_MAX_OUTPUT_TOKENS', 1200, 256, 2000),
  };
}
