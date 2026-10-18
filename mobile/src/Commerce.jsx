import { useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  Button,
  View,
  Switch,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { paymentCopy } from '@maison/contracts/demo-payment';
import { accountCopy, commerceError } from './commerce-copy';
import { useRemote } from './useRemote';
import { money } from './model';
const color = '#b3152b';
export function Checkout({ language, rows, total, busy, error, back, confirm }) {
  const t = paymentCopy[language];
  const [method, setMethod] = useState('card');
  const [outcome, setOutcome] = useState('approved');
  const [acknowledged, setAcknowledged] = useState(false);
  return (
    <ScrollView contentContainerStyle={s.page}>
      <Button title={t.cancel} color={color} disabled={busy} onPress={back} />
      <Text style={s.title}>{t.title}</Text>
      <Text style={s.notice}>{t.warning}</Text>
      <Text>{t.details}</Text>
      {rows.map((row) => (
        <Text key={row.variantId}>
          {row.product.name[language]} · {row.variant.label[language]} × {row.quantity} ·{' '}
          {money(row.totalCents, language)}
        </Text>
      ))}
      <Text style={s.title}>{money(total, language)}</Text>
      <Text style={s.heading}>{t.method}</Text>
      {['bank', 'card', 'paypal', Platform.OS === 'ios' ? 'apple_pay' : 'samsung_pay'].map(
        (value) => (
          <Button
            key={value}
            color={method === value ? color : '#686159'}
            disabled={busy}
            title={`${method === value ? '✓ ' : ''}${t[value]}`}
            onPress={() => setMethod(value)}
          />
        ),
      )}
      <Text style={s.heading}>{t.test}</Text>
      {['approved', 'declined'].map((value) => (
        <Button
          key={value}
          color={outcome === value ? color : '#686159'}
          disabled={busy}
          title={`${outcome === value ? '✓ ' : ''}${t[value]}`}
          onPress={() => setOutcome(value)}
        />
      ))}
      <View style={s.row}>
        <Switch
          disabled={busy}
          value={acknowledged}
          onValueChange={setAcknowledged}
          accessibilityLabel={t.consent}
        />
        <Text style={{ flex: 1 }}>{t.consent}</Text>
      </View>
      {error && (
        <Text accessibilityRole="alert" style={s.error}>
          {commerceError(error, language)}
        </Text>
      )}
      <Text style={s.notice}>{t.noCharge}</Text>
      <Button
        color={color}
        disabled={busy || !acknowledged}
        title={busy ? t.working : t.confirm}
        onPress={() => confirm({ mode: 'demo', method, acknowledged: true, outcome })}
      />
    </ScrollView>
  );
}
function History({ language, open }) {
  const t = accountCopy[language];
  const orders = useRemote('/orders');
  const messages = useRemote('/messages');
  return (
    <>
      <Text style={s.heading}>{t.orders}</Text>
      {orders.loading && <ActivityIndicator />}
      {orders.error && (
        <>
          <Text>{commerceError(orders.error, language)}</Text>
          <Button title={t.retry} onPress={orders.reload} />
        </>
      )}
      {(orders.data || []).map((order) => (
        <Button
          key={order.id}
          color={color}
          title={`${order.id.slice(0, 8)} · ${money(order.totalCents, language)} · ${t[order.status] || order.status}`}
          onPress={() => open(order.id)}
        />
      ))}
      {orders.data?.length === 0 && <Text>{t.empty}</Text>}
      <Text style={s.heading}>{t.messages}</Text>
      {messages.error && <Button title={t.retry} onPress={messages.reload} />}
      {(messages.data || []).map((message) => (
        <Text key={message.id} style={s.notice}>
          {message.title?.[language] + ' · ' + message.body?.[language]}
        </Text>
      ))}
      {messages.data?.length === 0 && <Text>{t.noMessages}</Text>}
    </>
  );
}
export function Account({ commerce, language, open }) {
  const t = accountCopy[language];
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  async function submit() {
    setError(null);
    const value = password;
    setPassword('');
    try {
      await commerce.login({ email, password: value, ...(register ? { name } : {}) }, register);
    } catch (e) {
      setError(e);
    }
  }
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.page}>
      <Text style={s.title}>{t.account}</Text>
      {commerce.user ? (
        <>
          <Text>
            {commerce.user.name} · {commerce.user.email}
          </Text>
          <Button
            color={color}
            title={t.logout}
            disabled={commerce.busy}
            onPress={async () => {
              try {
                await commerce.logout();
              } catch (e) {
                setError(e);
              }
            }}
          />
          <History key={commerce.user.id} language={language} open={open} />
        </>
      ) : (
        <>
          <Text style={s.notice}>{t.help}</Text>
          {register && (
            <TextInput
              style={s.input}
              placeholder={t.name}
              accessibilityLabel={t.name}
              value={name}
              onChangeText={setName}
              maxLength={80}
              editable={!commerce.busy}
            />
          )}
          <TextInput
            style={s.input}
            placeholder={t.email}
            accessibilityLabel={t.email}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            maxLength={254}
            editable={!commerce.busy}
          />
          <TextInput
            style={s.input}
            placeholder={t.password}
            accessibilityLabel={t.password}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={128}
            editable={!commerce.busy}
          />
          <Button
            color={color}
            title={register ? t.register : t.login}
            disabled={commerce.busy || !email || !password || (register && !name)}
            onPress={submit}
          />
          <Button
            color={color}
            disabled={commerce.busy}
            title={register ? t.login : t.register}
            onPress={() => {
              setRegister(!register);
              setError(null);
            }}
          />
        </>
      )}
      {error && (
        <Text accessibilityRole="alert" style={s.error}>
          {commerceError(error, language)}
        </Text>
      )}
    </ScrollView>
  );
}
export function Order({ id, completed, language, back }) {
  const resource = useRemote(`/orders/${encodeURIComponent(id)}`);
  const t = accountCopy[language];
  const p = paymentCopy[language];
  const order = resource.data;
  return (
    <ScrollView contentContainerStyle={s.page}>
      <Button title={t.back} color={color} onPress={back} />
      <Text style={s.title}>{t.detail}</Text>
      {resource.loading && <ActivityIndicator />}
      {resource.error && (
        <>
          <Text style={s.error}>{commerceError(resource.error, language)}</Text>
          <Button title={t.retry} onPress={resource.reload} />
        </>
      )}
      {order && (
        <>
          {completed && order.payment?.mode === 'demo' && <Text style={s.notice}>{p.success}</Text>}
          <Text selectable>{order.id}</Text>
          <Text>{t[order.status] || order.status}</Text>
          {order.lines.map((line, index) => (
            <Text key={index}>
              {line.name[language]} · {line.variantLabel[language]} × {line.quantity} ·{' '}
              {money(line.subtotalCents, language)}
            </Text>
          ))}
          <Text style={s.heading}>{money(order.totalCents, language)}</Text>
          {order.payment?.mode === 'demo' && (
            <>
              <Text style={s.heading}>{p.receipt}</Text>
              <Text>{p[order.payment.method]}</Text>
              <Text selectable>{order.payment.reference}</Text>
              <Text>{p.noCharge}</Text>
            </>
          )}
          <Text style={s.notice}>{p.warning}</Text>
        </>
      )}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { padding: 20, gap: 16 },
  title: { fontSize: 26, color: '#242320' },
  heading: { fontSize: 19, marginTop: 12 },
  notice: {
    backgroundColor: '#eee9df',
    padding: 16,
    borderRadius: 16,
    lineHeight: 22,
    color: '#514c45',
  },
  input: { borderWidth: 1, borderColor: '#b8b2a7', borderRadius: 14, padding: 14, minHeight: 48 },
  error: { color },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
});
