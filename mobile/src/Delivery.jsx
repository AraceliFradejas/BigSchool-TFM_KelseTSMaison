import { useState } from 'react';
import Boutiques from './Boutiques';
import { Text, TextInput, Button, View, StyleSheet } from 'react-native';
import {
  demoBoutiques,
  deliveryAreas,
  fulfillmentCopy,
  fulfillmentLines,
} from '@maison/contracts/fulfillment';
export function DeliveryForm({ value, onChange, language, busy }) {
  const t = fulfillmentCopy[language];
  const [explore, setExplore] = useState(false);
  const change = (key, next) => onChange({ ...value, [key]: next });
  return (
    <View style={s.form}>
      <Text style={s.heading}>{t.title}</Text>
      <Text>{t.country}</Text>
      <Text style={s.notice}>{t.notice}</Text>
      <Text>{t.recipient}</Text>
      <TextInput
        style={s.input}
        accessibilityLabel={t.recipient}
        value={value.recipientName}
        onChangeText={(v) => change('recipientName', v)}
        maxLength={80}
        editable={!busy}
        placeholder="Alex Maison"
      />
      {['home', 'pickup'].map((method) => (
        <Button
          key={method}
          color={value.method === method ? '#b3152b' : '#686159'}
          disabled={busy}
          title={`${value.method === method ? '✓ ' : ''}${t[method]}`}
          onPress={() => change('method', method)}
        />
      ))}
      {value.method === 'home' ? (
        <>
          <Text>{t.area}</Text>
          {deliveryAreas.map((area) => (
            <Button
              key={area}
              disabled={busy}
              color={value.address.area === area ? '#b3152b' : '#686159'}
              title={`${value.address.area === area ? '✓ ' : ''}${t[area]}`}
              onPress={() => change('address', { ...value.address, area })}
            />
          ))}
          {['street', 'postalCode', 'city'].map((key) => (
            <View key={key} style={s.form}>
              <Text>{t[key]}</Text>
              <TextInput
                style={s.input}
                accessibilityLabel={t[key]}
                value={value.address[key]}
                onChangeText={(v) => change('address', { ...value.address, [key]: v })}
                keyboardType={key === 'postalCode' ? 'number-pad' : 'default'}
                maxLength={key === 'street' ? 160 : key === 'postalCode' ? 5 : 80}
                editable={!busy}
              />
            </View>
          ))}
        </>
      ) : (
        <>
          <Text>{t.network}</Text>
          {demoBoutiques.map((b) => (
            <Button
              key={b.id}
              disabled={busy}
              color={value.boutiqueId === b.id ? '#b3152b' : '#686159'}
              title={`${value.boutiqueId === b.id ? '✓ ' : ''}${b.name}`}
              onPress={() => change('boutiqueId', b.id)}
            />
          ))}
          <Text>{demoBoutiques.find((b) => b.id === value.boutiqueId)?.location[language]}</Text>
          <Button
            disabled={busy}
            color="#b3152b"
            title={explore ? t.hideExplore : t.explore}
            onPress={() => setExplore(!explore)}
          />
          {explore && (
            <Boutiques
              language={language}
              selectedId={value.boutiqueId}
              onChoose={(id) => change('boutiqueId', id)}
              disabled={busy}
            />
          )}
        </>
      )}
      <Text>{t[value.method === 'home' ? 'homeEstimate' : 'pickupEstimate']}</Text>
      <Text style={s.notice}>{t.estimateNotice}</Text>
      <Text>{t.free}</Text>
    </View>
  );
}
export function DeliverySummary({ value, language, cancelled }) {
  if (!value) return null;
  const t = fulfillmentCopy[language];
  return (
    <View style={s.form}>
      <Text style={s.heading}>{t.summary}</Text>
      {cancelled && <Text style={s.notice}>{t.cancelled}</Text>}
      {fulfillmentLines(value, language).map((line, i) => (
        <Text key={i}>{line}</Text>
      ))}
      <Text>{t.free}</Text>
      <Text style={s.notice}>
        {t.estimateNotice}
        {'\n'}
        {t.notice}
      </Text>
    </View>
  );
}
const s = StyleSheet.create({
  form: { gap: 12 },
  heading: { fontSize: 20, color: '#242320' },
  notice: { backgroundColor: '#eee9df', padding: 14, borderRadius: 14, lineHeight: 22 },
  input: {
    borderWidth: 1,
    borderColor: '#b8b2a7',
    borderRadius: 14,
    padding: 14,
    minHeight: 48,
    color: '#242320',
  },
});
