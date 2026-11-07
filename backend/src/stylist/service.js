import { isStylistAvailable } from './config.js';
import {
  stylistScopeViolation,
  stylistUnsafeText,
  stylistScopeMessage,
  stylistUnsafeExplanation,
} from '@maison/contracts/stylist-policy';
import { eligibleLooks } from './editorial.js';
import { claimStylistCall } from './quota.js';
import { selectionSchema, stylistPrompt } from './prompt.js';
import { requestStylistProvider } from './providers.js';

export async function recommendLooks({
  db,
  config,
  getLooks,
  preferences,
  signal,
  requestProvider = requestStylistProvider,
}) {
  if (
    stylistScopeViolation(preferences.message ?? preferences.style) ||
    stylistUnsafeText(preferences.style)
  )
    return {
      mode: 'editorial',
      reason: 'out_of_scope',
      message: stylistScopeMessage(preferences.language),
      looks: [],
      preferences,
    };
  const candidates = eligibleLooks(await getLooks(), preferences);
  const editorial = async (reason = null, latest) => ({
    mode: 'editorial',
    reason,
    looks: (latest ?? eligibleLooks(await getLooks(), preferences)).slice(0, 3),
    preferences,
  });
  if (preferences.mode !== 'ai') return editorial(null, candidates);
  if (!isStylistAvailable(config))
    return editorial(config?.enabled ? 'expired' : 'not_configured', candidates);
  if (!candidates.length) return editorial('no_candidates', candidates);
  const shortlist = candidates.slice(0, 12);
  const prompt = stylistPrompt(shortlist, preferences);
  if (Buffer.byteLength(prompt.input, 'utf8') > 24576) return editorial('input_limit');
  for (const settings of config.chain) {
    if (!isStylistAvailable(config)) return editorial('expired');
    if (signal?.aborted) return editorial('unavailable');
    if (!(await claimStylistCall(db, config.dailyLimit))) return editorial('daily_limit');
    let selection;
    try {
      selection = selectionSchema.parse(
        await requestProvider(settings, prompt, { ...config, signal }),
      );
      if (selection.looks.some((item) => stylistUnsafeExplanation(item.explanation)))
        throw new Error('unsafe_explanation');
      const ids = selection.looks.map((look) => look.lookId);
      if (
        new Set(ids).size !== ids.length ||
        ids.some((id) => !shortlist.some((look) => look.id === id))
      )
        throw new Error('invalid_selection');
    } catch (error) {
      if (error.kind === 'refusal') return editorial('refusal');
      if (error.kind !== 'unavailable') return editorial('invalid_response');
      continue;
    }
    // Re-read after provider latency; never return a now-sold-out or over-budget look.
    const latest = eligibleLooks(await getLooks(), preferences);
    const selected = selection.looks.map((item) => {
      const look = latest.find((look) => look.id === item.lookId);
      return look ? { ...look, explanation: item.explanation } : null;
    });
    if (selected.some((look) => !look)) return editorial('catalog_changed', latest);
    return { mode: 'ai', provider: settings.provider, looks: selected, preferences };
  }
  return editorial('unavailable', eligibleLooks(await getLooks(), preferences));
}
