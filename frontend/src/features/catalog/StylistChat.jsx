import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { chatPreferences } from '@maison/contracts/stylist-chat';
import { useMaison, useResource, api } from '../../shared/state';
import { Money, ProductGrid } from '../../shared/components';

export default function StylistChat() {
  const { language, user, errorText } = useMaison();
  const es = language === 'es';
  const availability = useResource('/stylist/status');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [preferences, setPreferences] = useState({});
  const [busy, setBusy] = useState(false);
  const pending = useRef(null);
  const end = useRef(null);
  useEffect(() => () => pending.current?.abort(), []);
  useEffect(() => {
    pending.current?.abort();
    setMessages([]);
    setPreferences({});
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
    if (!text || busy) return;
    setDraft('');
    say({ role: 'user', text });
    const parsed = chatPreferences(text, preferences);
    setPreferences(parsed.preferences);
    if (parsed.needsBudget) {
      say({
        role: 'assistant',
        text: parsed.invalidBudget
          ? es
            ? 'Dime un presupuesto entre 1 y 10.000 € para esta selección.'
            : 'Please give me a budget between €1 and €10,000 for this selection.'
          : es
            ? '¿Cuál es tu presupuesto máximo para el look? Puedes decirme también tu talla y número de calzado.'
            : 'What is your maximum outfit budget? You can also tell me your clothing and shoe sizes.',
      });
      return;
    }
    const ai = Boolean(availability.data?.available);
    if (ai && !user) {
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
        body: { ...parsed.preferences, language, mode: ai ? 'ai' : 'editorial' },
      });
      if (!controller.signal.aborted)
        say({
          role: 'assistant',
          text: result.looks.length
            ? es
              ? 'Estas combinaciones encajan con los filtros que he recogido. Puedes abrir cada pieza para elegir su variante.'
              : 'These combinations match the filters I picked up. Open any piece to choose its variant.'
            : es
              ? 'No encuentro un conjunto completo con esos filtros. ¿Probamos otro presupuesto, talla o plan?'
              : 'I could not find a complete outfit with those filters. Shall we try another budget, size or occasion?',
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
    <div className="stylist-chat">
      <p className="stylist-chat-intro">
        {es
          ? 'Cuéntame qué necesitas: tu plan, el estilo que te apetece y tu presupuesto. Te sugeriré combinaciones de Maison con fotos y enlaces a sus piezas.'
          : 'Tell me your plans, style and budget. I will suggest Maison outfits with photos and links to their pieces.'}
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
      {!messages.length && (
        <div className="stylist-chat-examples">
          {[
            es
              ? 'Una cena romántica, máximo 3.000 €, talla M.'
              : 'A romantic dinner, up to €3,000, size M.',
            es
              ? 'Un concierto, presupuesto 6.000 €, sin maquillaje.'
              : 'A concert, budget €6,000, without makeup.',
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
      <form className="stylist-chat-composer" onSubmit={send}>
        <label className="sr-only" htmlFor="stylist-chat-message">
          {es ? 'Tu mensaje para Maison Stylist' : 'Your message to Maison Stylist'}
        </label>
        <textarea
          id="stylist-chat-message"
          maxLength={400}
          rows={3}
          value={draft}
          disabled={busy}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={es ? '¿Qué tienes planeado?' : 'What are you planning?'}
        />
        <button className="button" disabled={busy || !draft.trim()}>
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
