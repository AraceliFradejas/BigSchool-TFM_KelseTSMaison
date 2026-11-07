import { stylistScopeViolation, stylistScopeMessage } from '@maison/contracts/stylist-policy';
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
import { chatPreferences, stylistFeedback } from '@maison/contracts/stylist-chat';
import Button from './Button';
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
  useEffect(() => {
    setMessages([]);
    setDraft('');
    setPreferences({});
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
            conversation={{ messages, setMessages, draft, setDraft, preferences, setPreferences }}
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
  const { messages, setMessages, draft, setDraft, preferences, setPreferences } = conversation;
  const [busy, setBusy] = useState(false);
  const pending = useRef(null);
  const scroll = useRef(null);
  useEffect(() => () => pending.current?.abort(), []);
  useEffect(() => {
    pending.current?.abort();
    setBusy(false);
  }, [language, user?.id]);
  const say = (message) => setMessages((old) => [...old.slice(-15), message]);
  async function send() {
    const text = draft.trim();
    if (!text || busy) return;
    Keyboard.dismiss();
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
        text: parsed.invalidBudget
          ? es
            ? 'Dime un presupuesto entre 1 y 10.000 € para esta selección.'
            : 'Please give me a budget between €1 and €10,000.'
          : es
            ? '¿Cuál es tu presupuesto máximo para el look? Puedes decirme también tu talla y número de calzado.'
            : 'What is your maximum outfit budget? You can also tell me your clothing and shoe sizes.',
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
        body: { ...parsed.preferences, message: text, language, mode: ai ? 'ai' : 'editorial' },
      });
      if (!controller.signal.aborted)
        say({
          role: 'assistant',
          text:
            result.message ||
            (result.looks.length
              ? es
                ? 'Te propongo estas combinaciones. Abre cada pieza para elegir su variante.'
                : 'Here are some combinations. Open any piece to choose its variant.'
              : es
                ? 'No encuentro un conjunto completo con esos filtros. ¿Probamos otro presupuesto, talla o plan?'
                : 'No complete outfit matches those filters. Shall we try another budget, size or occasion?'),
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
  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.content}
      >
        <Text style={s.intro}>
          {es
            ? 'Cuéntame qué necesitas: tu plan, estilo y presupuesto. Te sugeriré looks de Maison con fotos y enlaces a sus piezas.'
            : 'Tell me your plans, style and budget. I will suggest Maison outfits with photos and links to their pieces.'}
        </Text>
        <Text style={s.mode}>
          {status.data?.available
            ? es
              ? 'Asesoría con IA'
              : 'AI styling'
            : es
              ? 'Selección editorial · IA todavía desactivada'
              : 'Editorial selection · AI currently disabled'}
        </Text>
        {!messages.length && (
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
            key={index}
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
            {message.login && (
              <Button onPress={openAccount}>{es ? 'Acceder a mi cuenta' : 'Sign in'}</Button>
            )}
            {message.result && (
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
                {message.result.looks.map((look) => (
                  <View key={look.id} style={s.look}>
                    <Text accessibilityRole="header" style={s.lookTitle}>
                      {look.name}
                    </Text>
                    <Text style={s.total}>
                      {es ? 'Total del look' : 'Outfit total'} · {money(look.totalCents, language)}
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
                {message.result.looks.length > 0 && (
                  <Text style={s.followup}>
                    {es
                      ? '¿Te ha gustado la elección? Cuéntame qué mantendrías o qué cambiarías y seguimos buscando tu look.'
                      : 'Do you like the selection? Tell me what you would keep or change and we can refine your outfit.'}
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
        <TextInput
          value={draft}
          onChangeText={setDraft}
          editable={!busy}
          multiline
          maxLength={400}
          style={s.input}
          placeholder={es ? '¿Qué tienes planeado?' : 'What are you planning?'}
          accessibilityLabel={
            es ? 'Tu mensaje para Maison Stylist' : 'Your message to Maison Stylist'
          }
        />
        <Button disabled={busy || !draft.trim()} onPress={send}>
          {es ? 'Enviar' : 'Send'}
        </Button>
        <Text style={s.note}>
          {es
            ? 'No incluyas datos personales. Con IA activa, las preferencias se envían a los proveedores configurados. Las sugerencias no cambian tu bolsa.'
            : 'Do not include personal details. When AI is active, preferences are sent to configured providers. Suggestions do not change your bag.'}
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
