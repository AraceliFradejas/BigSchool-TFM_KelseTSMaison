import { SpeakButton, VoiceInput } from './StylistVoice';
import { stylistScopeViolation, stylistScopeMessage } from '@maison/contracts/stylist-policy';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  chatPreferences,
  stylistFeedback,
  stylistBudgetQuestion,
  stylistEditorialIntro,
} from '@maison/contracts/stylist-chat';
import { useMaison, useResource, api } from '../../shared/state';
import { Money, ProductGrid } from '../../shared/components';

export default function StylistChat({ conversation }) {
  const { language, user, errorText } = useMaison();
  const es = language === 'es';
  const availability = useResource('/stylist/status');
  const voice = useResource('/stylist/voice/status');
  const [voiceBusy, setVoiceBusy] = useState(false);
  const {
    messages,
    setMessages,
    draft,
    setDraft,
    preferences,
    setPreferences,
    interactionMode,
    setInteractionMode,
  } = conversation;
  const [busy, setBusy] = useState(false);
  const pending = useRef(null);
  const end = useRef(null);
  useEffect(() => () => pending.current?.abort(), []);
  useEffect(() => {
    pending.current?.abort();
    setBusy(false);
  }, [language, user?.id]);
  useEffect(
    () => end.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' }),
    [messages, busy],
  );
  const say = (message) => setMessages((old) => [...old.slice(-15), message]);
  async function send(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy || voiceBusy || interactionMode === null) return;
    setDraft('');
    say({ role: 'user', text });
    const feedback = stylistFeedback(
      text,
      messages.some((message) => message.result?.looks.length),
      language,
      messages
        .slice()
        .reverse()
        .find((message) => message.result?.looks.length)?.result,
    );
    if (feedback) {
      say({ role: 'assistant', text: feedback });
      return;
    }
    if (stylistScopeViolation(text)) {
      say({ role: 'assistant', text: stylistScopeMessage(language) });
      return;
    }
    const parsed = chatPreferences(text, preferences);
    setPreferences(parsed.preferences);
    if (parsed.needsBudget) {
      say({
        role: 'assistant',
        text: stylistBudgetQuestion(parsed, language),
      });
      return;
    }
    const ai = Boolean(availability.data?.available);
    if (ai && !user && availability.data?.requiresAccount !== false) {
      say({
        role: 'assistant',
        text: es
          ? 'Accede a tu cuenta para recibir la asesoría con IA. Después, abre de nuevo el asesor y escribe tu petición.'
          : 'Sign in to your account for AI styling. Then reopen the adviser and enter your request.',
        login: true,
      });
      return;
    }
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    try {
      const result = await api.request('/stylist', {
        method: 'POST',
        signal: controller.signal,
        body: { ...parsed.preferences, message: text, language, mode: ai ? 'ai' : 'editorial' },
      });
      if (!controller.signal.aborted)
        say({
          role: 'assistant',
          text:
            result.message ||
            stylistEditorialIntro(result.preferences, language, result.looks.length > 0),
          result,
        });
    } catch (error) {
      if (!controller.signal.aborted) say({ role: 'assistant', text: errorText(error) });
    } finally {
      if (!controller.signal.aborted) setBusy(false);
      if (pending.current === controller) pending.current = null;
    }
  }
  return (
    <div className={`stylist-chat ${interactionMode === null ? 'is-choosing-mode' : ''}`}>
      <p className="stylist-chat-intro">
        {es
          ? 'Soy tAIlor, tu estilista personal virtual de KelseTS Maison. Vamos a buscar tu próximo look juntos.'
          : 'I’m tAIlor, your personal virtual stylist at KelseTS Maison. Let’s find your next outfit together.'}
      </p>
      <p className="mode-badge">
        {availability.data?.available
          ? es
            ? 'Asesoría con IA'
            : 'AI styling'
          : es
            ? 'Selección editorial · IA todavía desactivada'
            : 'Editorial selection · AI currently disabled'}
      </p>
      {!messages.length && interactionMode === 'text' && (
        <div className="stylist-chat-examples">
          {[
            es
              ? 'Una cena romántica, máximo 3.000 €, talla M.'
              : 'A romantic dinner, up to €3,000, size M.',
          ].map((text) => (
            <button type="button" key={text} onClick={() => setDraft(text)}>
              {text}
            </button>
          ))}
        </div>
      )}
      <div className="stylist-chat-messages" aria-live="polite" aria-busy={busy}>
        {messages.map((message, index) => (
          <article
            ref={index === messages.length - 1 ? end : null}
            key={index}
            className={`stylist-chat-message ${message.role === 'user' ? 'is-user' : ''}`}
          >
            <span className="stylist-chat-speaker">
              {message.role === 'user' ? (es ? 'Tú' : 'You') : 'Maison Stylist'}
            </span>
            <p>{message.text}</p>
            {message.role === 'assistant' && (
              <SpeakButton
                key={JSON.stringify([
                  language,
                  message.text,
                  message.result?.looks.map((look) => look.id),
                ])}
                message={message}
                language={language}
                available={voice.data?.available && interactionMode === 'voice'}
              />
            )}
            {message.login && (
              <Link className="button" to="/account">
                {es ? 'Acceder a mi cuenta' : 'Sign in'}
              </Link>
            )}
            {message.result && (
              <>
                <p className="fine-print">
                  {message.result.mode === 'ai'
                    ? `${es ? 'Sugerencia con IA' : 'AI suggestion'} · ${{ gemini: 'Gemini', anthropic: 'Claude', openai: 'OpenAI' }[message.result.provider]}`
                    : es
                      ? 'Selección editorial, sin IA.'
                      : 'Editorial selection, without AI.'}{' '}
                  {es ? 'Presupuesto aplicado: ' : 'Applied budget: '}
                  <Money cents={message.result.preferences.budgetCents} />
                  {message.result.preferences.size
                    ? ` · ${es ? 'Talla' : 'Size'} ${message.result.preferences.size}`
                    : ''}
                  {message.result.preferences.shoeSize
                    ? ` · ${es ? 'Calzado' : 'Shoes'} ${message.result.preferences.shoeSize}`
                    : ''}
                </p>
                {message.result.looks.map((look) => (
                  <section className="stylist-chat-look" key={look.id}>
                    <h3>{look.name}</h3>
                    <p>
                      {es ? 'Total del look' : 'Outfit total'}:{' '}
                      <strong>
                        <Money cents={look.totalCents} />
                      </strong>
                    </p>
                    {look.explanation && <p>{look.explanation}</p>}
                    <ProductGrid
                      products={look.pieces.map((piece) => ({
                        ...piece.product,
                        variants: [piece.variant],
                      }))}
                    />
                  </section>
                ))}
                {message.result.looks.length > 0 && (
                  <p className="stylist-chat-followup">
                    {es
                      ? '¿Con cuál te ves más? Cuéntame qué te gusta y qué cambiarías; lo vamos afinando a tu gusto.'
                      : 'Which one feels most like you? Tell me what you like or would change; we can refine it together.'}
                  </p>
                )}
              </>
            )}
          </article>
        ))}
        {busy && (
          <p role="status">
            {es ? 'Estoy buscando combinaciones en Maison…' : 'Finding combinations in Maison…'}
          </p>
        )}
      </div>
      <VoiceInput
        mode={interactionMode}
        onModeChange={setInteractionMode}
        language={language}
        available={voice.data?.available}
        disabled={busy}
        onBusyChange={setVoiceBusy}
        onTranscript={(text) => {
          const combined = [draft.trim(), text].filter(Boolean).join(' ');
          if (combined.length > 400) throw new Error('voice_transcript_invalid');
          setDraft(combined);
        }}
      />
      <form className="stylist-chat-composer" onSubmit={send} hidden={interactionMode === null}>
        <label className="sr-only" htmlFor="stylist-chat-message">
          {es ? 'Tu mensaje para Maison Stylist' : 'Your message to Maison Stylist'}
        </label>
        <textarea
          id="stylist-chat-message"
          maxLength={400}
          rows={1}
          value={draft}
          disabled={busy || voiceBusy}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              if (!busy && !voiceBusy && draft.trim()) event.currentTarget.form.requestSubmit();
            }
          }}
          placeholder={es ? 'Escribe a Maison Stylist…' : 'Message Maison Stylist…'}
        />
        <button className="button" disabled={busy || voiceBusy || !draft.trim()}>
          {es ? 'Enviar' : 'Send'}
        </button>
      </form>
      <p className="fine-print">
        {es
          ? 'No incluyas datos personales. Si la IA está activa, las preferencias se enviarán a los proveedores configurados. Las sugerencias no cambian tu bolsa.'
          : 'Do not include personal details. When AI is active, preferences are sent to the configured providers. Suggestions do not change your bag.'}
      </p>
      <Link className="text-link" to="/looks">
        {es ? 'Prefiero usar los filtros detallados' : 'I prefer the detailed filters'}
      </Link>
    </div>
  );
}
