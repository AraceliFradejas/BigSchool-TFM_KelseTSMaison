import { VoiceInput, useStylistSpeech } from './StylistVoice';
import {
  stylistScopeViolation,
  stylistScopeMessage,
  stylistUnsafeText,
} from '@maison/contracts/stylist-policy';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import Button from './Button';
import VoiceIcon from './VoiceIcon';
import { api } from './api';
import { useRemote } from './useRemote';
import { imageUrl, money } from './model';
import { commerceError } from './commerce-copy';
const names = { gemini: 'Gemini', anthropic: 'Claude', openai: 'OpenAI' };
export default function Stylist({ visible, onClose, language, user, openAccount, openProduct }) {
  const es = language === 'es';
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [preferences, setPreferences] = useState({});
  const [interactionMode, setInteractionMode] = useState(null);
  useEffect(() => {
    setMessages([]);
    setDraft('');
    setPreferences({});
    setInteractionMode(null);
  }, [language, user?.id]);
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={s.page}>
        <View style={s.heading}>
          <Text accessibilityRole="header" style={s.title}>
            Maison Stylist
          </Text>
          <Button secondary onPress={onClose}>
            {es ? 'Cerrar' : 'Close'}
          </Button>
        </View>
        {visible && (
          <Chat
            language={language}
            conversation={{
              messages,
              setMessages,
              draft,
              setDraft,
              preferences,
              setPreferences,
              interactionMode,
              setInteractionMode,
            }}
            user={user}
            openAccount={openAccount}
            openProduct={openProduct}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
function Chat({ language, user, openAccount, openProduct, conversation }) {
  const es = language === 'es';
  const status = useRemote('/stylist/status');
  const voice = useRemote('/stylist/voice/status');
  const speech = useStylistSpeech(language);
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
  const scroll = useRef(null);
  useEffect(() => () => pending.current?.abort(), []);
  useEffect(() => {
    pending.current?.abort();
    setBusy(false);
  }, [language, user?.id]);
  useEffect(() => {
    const message = messages.at(-1);
    if (!message?.autoSpeak || interactionMode !== 'voice' || !voice.data?.available) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setMessages((old) =>
        old.map((item) => (item.id === message.id ? { ...item, autoSpeak: false } : item)),
      );
      if (!speech.quotaReached) void speech.speak(message, messages.length - 1, true);
    });
    return () => {
      active = false;
    };
  }, [messages.at(-1)?.id, interactionMode, voice.data?.available]);
  const say = (message) =>
    setMessages((old) => [
      ...old.slice(-15),
      {
        ...message,
        id: `${Date.now()}-${Math.random()}`,
        autoSpeak: message.role === 'assistant' && interactionMode === 'voice',
      },
    ]);
  function send() {
    void sendText(draft.trim());
  }
  async function sendText(text, fromVoice = false) {
    if (!text || busy || (voiceBusy && !fromVoice) || interactionMode === null) return;
    Keyboard.dismiss();
    speech.stop();
    setDraft('');
    say({ role: 'user', text });
    if (status.data?.available && status.data?.conversational) {
      if (!user && status.data.requiresAccount !== false) {
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
        if (!controller.signal.aborted)
          say({ role: 'assistant', text: commerceError(error, language) });
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
    const ai = Boolean(status.data?.available);
    if (ai && !user && status.data?.requiresAccount !== false) {
      say({
        role: 'assistant',
        text: es
          ? 'Accede a tu cuenta para recibir asesoría con IA.'
          : 'Sign in to your account for AI styling.',
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
      if (!controller.signal.aborted)
        say({ role: 'assistant', text: commerceError(error, language) });
    } finally {
      if (!controller.signal.aborted) setBusy(false);
      if (pending.current === controller) pending.current = null;
    }
  }
  const voiceControls = (
    <VoiceInput
      mode={interactionMode}
      onModeChange={(mode) => {
        speech.stop();
        setInteractionMode(mode);
      }}
      language={language}
      available={voice.data?.available}
      disabled={busy}
      onRecord={() => {
        Keyboard.dismiss();
        speech.stop();
      }}
      onBusyChange={setVoiceBusy}
      onTranscript={(text) => {
        void sendText(text, true);
      }}
    />
  );
  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.content}
      >
        <Text style={s.intro}>
          {es
            ? 'Soy tAIlor, tu estilista personal virtual de KelseTS Maison. Vamos a buscar tu próximo look juntos.'
            : 'I’m tAIlor, your personal virtual stylist at KelseTS Maison. Let’s find your next outfit together.'}
        </Text>
        <Text style={s.mode}>
          {aiUnavailable
            ? es
              ? 'Conversación con IA no disponible'
              : 'AI conversation unavailable'
            : status.data?.available
              ? es
                ? 'Asesoría con IA'
                : 'AI styling'
              : es
                ? 'Selección editorial · IA todavía desactivada'
                : 'Editorial selection · AI currently disabled'}
        </Text>
        {interactionMode === null && voiceControls}
        {!messages.length && interactionMode === 'text' && (
          <Button
            secondary
            onPress={() =>
              setDraft(
                es
                  ? 'Una cena romántica, máximo 3.000 €, talla M.'
                  : 'A romantic dinner, up to €3,000, size M.',
              )
            }
          >
            {es ? 'Probar: una cena romántica' : 'Try: a romantic dinner'}
          </Button>
        )}
        {messages.map((message, index) => (
          <View
            key={message.id || index}
            onLayout={(event) => {
              if (index === messages.length - 1)
                scroll.current?.scrollTo({ y: event.nativeEvent.layout.y, animated: false });
            }}
            style={[s.message, message.role === 'user' && s.user]}
            accessibilityLiveRegion="polite"
          >
            <Text style={s.speaker}>
              {message.role === 'user' ? (es ? 'Tú' : 'You') : 'Maison Stylist'}
            </Text>
            <Text style={s.body}>{message.text}</Text>
            {message.role === 'assistant' &&
              voice.data?.available &&
              interactionMode === 'voice' && (
                <Button
                  secondary
                  disabled={speech.busy !== null}
                  onPress={() => speech.speak(message, index)}
                >
                  {speech.busy === index
                    ? es
                      ? 'Preparando voz…'
                      : 'Preparing voice…'
                    : speech.playing === index
                      ? es
                        ? 'Detener voz'
                        : 'Stop voice'
                      : es
                        ? 'Escuchar'
                        : 'Listen'}
                </Button>
              )}
            {message.login && (
              <Button onPress={openAccount}>{es ? 'Acceder a mi cuenta' : 'Sign in'}</Button>
            )}
            {message.result &&
              (message.result.looks.length > 0 || message.result.complements?.length > 0) && (
                <>
                  <Text style={s.note}>
                    {message.result.mode === 'ai'
                      ? `${es ? 'Sugerencia con IA' : 'AI suggestion'} · ${names[message.result.provider]}`
                      : es
                        ? 'Selección editorial, sin IA.'
                        : 'Editorial selection, without AI.'}{' '}
                    {es ? 'Presupuesto aplicado: ' : 'Applied budget: '}
                    {money(message.result.preferences.budgetCents, language)}
                    {message.result.preferences.size
                      ? ` · ${es ? 'Talla' : 'Size'} ${message.result.preferences.size}`
                      : ''}
                    {message.result.preferences.shoeSize
                      ? ` · ${es ? 'Calzado' : 'Shoes'} ${message.result.preferences.shoeSize}`
                      : ''}
                  </Text>
                  {stylistDisplayOptions(message.result, language).map((look) => (
                    <View key={look.id} style={s.look}>
                      <Text accessibilityRole="header" style={s.lookTitle}>
                        {look.name}
                      </Text>
                      <Text style={s.total}>
                        {message.result.complements
                          ? message.result.referenceLook
                            ? `${es ? 'Total con' : 'Total with'} ${message.result.referenceLook.name}`
                            : es
                              ? 'Precio de la pieza'
                              : 'Piece price'
                          : es
                            ? 'Total del look'
                            : 'Outfit total'}{' '}
                        · {money(look.totalCents, language)}
                      </Text>
                      {look.explanation && <Text style={s.body}>{look.explanation}</Text>}
                      {look.pieces.map(({ product, variant }) => (
                        <Pressable
                          key={variant.id}
                          accessibilityRole="button"
                          onPress={() => openProduct(product.id)}
                          style={s.piece}
                        >
                          <Image
                            source={{ uri: imageUrl(product.image) }}
                            resizeMode="contain"
                            style={s.image}
                          />
                          <View style={s.pieceText}>
                            <Text style={s.product}>{product.name[language]}</Text>
                            <Text style={s.note}>{variant.label[language]}</Text>
                            <Text>{money(variant.priceCents, language)}</Text>
                            <Text style={s.link}>{es ? 'Ver la pieza →' : 'View piece →'}</Text>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  ))}
                  {message.result.mode !== 'ai' && message.result.looks.length > 0 && (
                    <Text style={s.followup}>
                      {es
                        ? '¿Con cuál te ves más? Cuéntame qué te gusta y qué cambiarías; lo vamos afinando a tu gusto.'
                        : 'Which one feels most like you? Tell me what you like or would change; we can refine it together.'}
                    </Text>
                  )}
                </>
              )}
          </View>
        ))}
        {busy && (
          <ActivityIndicator
            color="#801d36"
            accessibilityLabel={es ? 'Buscando combinaciones' : 'Finding combinations'}
          />
        )}
      </ScrollView>
      <View style={s.composer}>
        {interactionMode !== null && voiceControls}
        {speech.hint ? (
          <Text accessibilityLiveRegion="polite" style={s.note}>
            {speech.hint}
          </Text>
        ) : null}
        {speech.error ? <Text style={s.note}>{speech.error}</Text> : null}
        {interactionMode === 'text' && (
          <TextInput
            value={draft}
            onChangeText={setDraft}
            editable={!busy && !voiceBusy}
            multiline
            maxLength={1200}
            style={s.input}
            placeholder={es ? '¿Qué tienes planeado?' : 'What are you planning?'}
            accessibilityLabel={
              es ? 'Tu mensaje para Maison Stylist' : 'Your message to Maison Stylist'
            }
          />
        )}
        {interactionMode === 'text' && (
          <Button
            icon={<VoiceIcon send />}
            disabled={busy || voiceBusy || !draft.trim()}
            onPress={send}
          >
            {es ? 'Enviar' : 'Send'}
          </Button>
        )}
        <Text style={s.note}>
          {es
            ? 'No incluyas datos personales. Con IA activa, la conversación y tus preferencias se envían a los proveedores configurados. Las sugerencias no cambian tu bolsa.'
            : 'Do not include personal details. When AI is active, the conversation and your preferences are sent to configured providers. Suggestions do not change your bag.'}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f8f4ed' },
  flex: { flex: 1 },
  heading: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#ded4c9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 27,
    color: '#4b1423',
    flexShrink: 1,
  },
  content: { padding: 14, gap: 14, paddingBottom: 25, backgroundColor: '#eee8df' },
  intro: { fontSize: 15, lineHeight: 23, color: '#5e5450' },
  mode: { fontSize: 12, color: '#801d36' },
  message: {
    padding: 15,
    gap: 10,
    backgroundColor: '#fffcf7',
    borderRadius: 18,
    borderTopLeftRadius: 4,
    marginRight: 14,
  },
  user: {
    alignSelf: 'flex-end',
    maxWidth: '88%',
    marginLeft: 32,
    marginRight: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 4,
    backgroundColor: '#f0dfe3',
  },
  followup: {
    fontSize: 15,
    lineHeight: 23,
    color: '#6b1930',
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: '#ded4c9',
  },
  speaker: { fontSize: 12, color: '#801d36', fontWeight: '500' },
  body: { fontSize: 15, lineHeight: 23, color: '#292320' },
  note: { fontSize: 12, lineHeight: 18, color: '#6c625d' },
  composer: {
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderColor: '#ded4c9',
    backgroundColor: '#f8f4ed',
  },
  input: {
    minHeight: 46,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: '#d5cabe',
    padding: 12,
    borderRadius: 22,
    fontSize: 16,
    color: '#292320',
    backgroundColor: '#fffcf7',
    textAlignVertical: 'top',
  },
  look: { borderTopWidth: 1, borderColor: '#d5cabe', paddingTop: 16, gap: 10 },
  lookTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 25,
    color: '#292320',
  },
  total: { fontSize: 14, fontWeight: '500' },
  piece: {
    flexDirection: 'row',
    gap: 13,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#d5cabe',
  },
  image: { width: 78, height: 100 },
  pieceText: { flex: 1, gap: 7 },
  product: { fontSize: 15, color: '#292320' },
  link: { color: '#801d36', fontSize: 13 },
});
