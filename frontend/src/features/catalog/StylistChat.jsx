import VoiceIcon from './VoiceIcon';
import { SpeakButton, VoiceInput } from './StylistVoice';
import {
  stylistScopeViolation,
  stylistScopeMessage,
  stylistUnsafeText,
} from '@maison/contracts/stylist-policy';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  chatPreferences,
  stylistFeedback,
  stylistConversationContext,
  stylistConversationRequest,
  stylistFollowUp,
  stylistDisplayOptions,
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
  const lastResult = messages.at(-1)?.result;
  const aiUnavailable =
    lastResult?.mode === 'editorial' &&
    [
      'daily_limit',
      'expired',
      'not_configured',
      'unavailable',
      'invalid_response',
      'input_limit',
      'catalog_unavailable',
    ].includes(lastResult.reason);
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
  const say = (message) =>
    setMessages((old) => [
      ...old.slice(-15),
      {
        ...message,
        id: `${Date.now()}-${Math.random()}`,
        autoSpeak: message.role === 'assistant' && interactionMode === 'voice',
      },
    ]);
  function send(event) {
    event.preventDefault();
    void sendText(draft.trim());
  }
  async function sendText(text, fromVoice = false) {
    if (!text || busy || (voiceBusy && !fromVoice) || interactionMode === null) return;
    window.dispatchEvent(new Event('maison-voice-stop'));
    setDraft('');
    say({ role: 'user', text });
    if (availability.data?.available && availability.data?.conversational) {
      if (!user && availability.data.requiresAccount !== false) {
        say({
          role: 'assistant',
          text: es ? 'Accede a tu cuenta para hablar con tAIlor.' : 'Sign in to talk with tAIlor.',
          login: true,
        });
        return;
      }
      const controller = new AbortController();
      pending.current = controller;
      setBusy(true);
      try {
        const result = await api.request('/stylist/chat', {
          method: 'POST',
          signal: controller.signal,
          body: stylistConversationRequest(text, { preferences, messages, language }),
        });
        if (!controller.signal.aborted) {
          setPreferences(result.preferences);
          say({ role: 'assistant', text: result.message, result });
        }
      } catch (error) {
        if (!controller.signal.aborted) say({ role: 'assistant', text: errorText(error) });
      } finally {
        if (!controller.signal.aborted) setBusy(false);
        if (pending.current === controller) pending.current = null;
      }
      return;
    }
    const feedback = stylistFeedback(
      text,
      messages.some((message) => message.result?.looks.length),
      language,
      stylistConversationContext(messages),
    );
    if (feedback) {
      say({ role: 'assistant', text: feedback });
      return;
    }
    if (stylistScopeViolation(text, { awaitingBudget: !preferences.budgetCents })) {
      say({
        role: 'assistant',
        text:
          fromVoice && !stylistUnsafeText(text)
            ? es
              ? 'No te he entendido bien. ¿Puedes repetirlo o escribirlo? Pulsa «Cambiar a texto» si prefieres decirme el nombre del look por escrito.'
              : 'I did not quite catch that. Could you repeat it or type it? Tap “Switch to text” to write the outfit name.'
            : stylistScopeMessage(language),
      });
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
    if (parsed.needsPlan) {
      say({
        role: 'assistant',
        text: es
          ? '¿Qué tenéis planeado para esa cita: una cena especial, un paseo o algo más informal? Así buscamos un look que esté a la altura de la ocasión.'
          : 'What do you have planned for your date: a special dinner, a walk or something casual? That will help us find the right outfit.',
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
        body: {
          ...parsed.preferences,
          message: text,
          language,
          mode: ai ? 'ai' : 'editorial',
          followUp: stylistFollowUp(text, stylistConversationContext(messages)) || undefined,
        },
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
        {aiUnavailable
          ? es
            ? 'Conversación con IA no disponible'
            : 'AI conversation unavailable'
          : availability.data?.available
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
      {!messages.length && interactionMode === 'voice' && (
        <div className="stylist-voice-welcome">
          <VoiceIcon />
          <h3>{es ? 'Cuéntame qué tienes en mente' : 'Tell me what you have in mind'}</h3>
          <p>
            {es
              ? 'Tu plan, tu estilo, esa ocasión especial… Empezamos cuando tú quieras.'
              : 'Your plans, your style, that special occasion… Start whenever you are ready.'}
          </p>
        </div>
      )}
      <div className="stylist-chat-messages" aria-live="polite" aria-busy={busy}>
        {messages.map((message, index) => (
          <article
            ref={index === messages.length - 1 ? end : null}
            key={message.id || index}
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
                autoPlay={message.autoSpeak}
                onAutoStart={() =>
                  setMessages((old) =>
                    old.map((item) =>
                      item.id === message.id ? { ...item, autoSpeak: false } : item,
                    ),
                  )
                }
                language={language}
                available={voice.data?.available && interactionMode === 'voice'}
              />
            )}
            {message.login && (
              <Link className="button" to="/account">
                {es ? 'Acceder a mi cuenta' : 'Sign in'}
              </Link>
            )}
            {message.result &&
              (message.result.looks.length > 0 || message.result.complements?.length > 0) && (
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
                  {stylistDisplayOptions(message.result, language).map((look) => (
                    <section className="stylist-chat-look" key={look.id}>
                      <h3>{look.name}</h3>
                      <p>
                        {message.result.complements
                          ? message.result.referenceLook
                            ? `${es ? 'Total con' : 'Total with'} ${message.result.referenceLook.name}`
                            : es
                              ? 'Precio de la pieza'
                              : 'Piece price'
                          : es
                            ? 'Total del look'
                            : 'Outfit total'}
                        :{' '}
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
          <p role="status">{es ? 'Estoy preparando tu respuesta…' : 'Preparing your response…'}</p>
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
          void sendText(text, true);
        }}
      />
      <form className="stylist-chat-composer" onSubmit={send} hidden={interactionMode !== 'text'}>
        <label className="sr-only" htmlFor="stylist-chat-message">
          {es ? 'Tu mensaje para Maison Stylist' : 'Your message to Maison Stylist'}
        </label>
        <textarea
          id="stylist-chat-message"
          maxLength={1200}
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
          <VoiceIcon send />
          {es ? 'Enviar' : 'Send'}
        </button>
      </form>
      <p className="fine-print">
        {es
          ? 'No incluyas datos personales. Si la IA está activa, la conversación y tus preferencias se enviarán a los proveedores configurados. Las sugerencias no cambian tu bolsa.'
          : 'Do not include personal details. When AI is active, the conversation and your preferences are sent to the configured providers. Suggestions do not change your bag.'}
      </p>
      <Link className="text-link" to="/looks">
        {es ? 'Prefiero usar los filtros detallados' : 'I prefer the detailed filters'}
      </Link>
    </div>
  );
}
