import { useEffect, useRef, useState } from 'react';
import { View, Text, Button, Image, Linking, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import {
  demoBoutiques,
  boutiqueCopy,
  streetViewUrl,
  boutiqueMapUrl,
  distanceLabel,
} from '@maison/contracts/boutiques';
import { imageUrl } from './model';
export default function Boutiques({ language, selectedId, onChoose, disabled = false }) {
  const t = boutiqueCopy[language];
  const [origin, setOrigin] = useState(null);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mapFailed, setMapFailed] = useState(false);
  const map = useRef(null);
  const mapTimer = useRef(null);
  useEffect(() => {
    mapTimer.current = setTimeout(() => setMapFailed(true), 15000);
    return () => clearTimeout(mapTimer.current);
  }, []);
  const request = useRef(0);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  async function locate() {
    const id = ++request.current;
    setBusy(true);
    setError('');
    let timer;
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') throw Error('denied');
      const position = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(Error('timeout')), 15000);
        }),
      ]);
      if (id === request.current)
        setOrigin({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } catch {
      if (id === request.current) setError(t.denied);
    } finally {
      clearTimeout(timer);
      if (id === request.current) setBusy(false);
    }
  }
  function open(url) {
    Linking.openURL(url).catch(() => setError(t.tileError));
  }
  function select(b) {
    map.current?.animateToRegion(
      { latitude: b.latitude, longitude: b.longitude, latitudeDelta: 0.025, longitudeDelta: 0.025 },
      400,
    );
  }
  return (
    <View style={s.form}>
      <Text style={s.notice}>{t.fiction}</Text>
      <Text>{t.region}</Text>
      <Button
        color="#b3152b"
        title={busy ? t.locating : t.locate}
        disabled={busy || disabled}
        onPress={locate}
      />
      <Button
        color="#b3152b"
        title={t.point}
        disabled={disabled}
        onPress={() => setPicking(!picking)}
      />
      {origin && (
        <Button
          title={t.clear}
          onPress={() => {
            request.current++;
            setOrigin(null);
            setBusy(false);
            setPicking(false);
            setError('');
          }}
        />
      )}
      <Text style={s.small}>{t.privacy}</Text>
      {error && <Text accessibilityRole="alert">{error}</Text>}
      {picking && <Text accessibilityLiveRegion="polite">{t.picking}</Text>}
      <MapView
        ref={map}
        style={s.map}
        accessibilityLabel={t.mapLabel}
        initialRegion={{ latitude: 39.2, longitude: -1.5, latitudeDelta: 6.8, longitudeDelta: 9 }}
        onMapReady={() => {
          if (selectedId) select(demoBoutiques.find((b) => b.id === selectedId));
        }}
        onMapLoaded={() => {
          clearTimeout(mapTimer.current);
          setMapFailed(false);
        }}
        onPress={(event) => {
          if (picking) {
            request.current++;
            setOrigin(event.nativeEvent.coordinate);
            setPicking(false);
            setBusy(false);
            setError('');
          }
        }}
      >
        {demoBoutiques.map((b) => (
          <Marker
            key={b.id}
            coordinate={{ latitude: b.latitude, longitude: b.longitude }}
            title={b.name}
            description={b.location[language]}
            pinColor="#b3152b"
          />
        ))}
        {origin && <Marker coordinate={origin} title={t.origin} pinColor="#246ea8" />}
      </MapView>
      {mapFailed && <Text>{t.tileError}</Text>}
      {demoBoutiques.map((b) => (
        <View key={b.id} style={s.card}>
          <Image
            source={{ uri: imageUrl(b.image) }}
            style={s.photo}
            accessibilityLabel={b.location[language]}
          />
          <Text style={s.heading}>{b.name}</Text>
          <Text>{b.location[language]}</Text>
          <Text style={s.small}>{t.photo}</Text>
          <Text style={s.small}>
            {b.photo.author} · {b.photo.license} · {t.changes}
          </Text>
          <Button title={t.source} color="#b3152b" onPress={() => open(b.photo.sourceUrl)} />
          <Button
            title={b.photo.license}
            color="#b3152b"
            onPress={() => open(b.photo.licenseUrl)}
          />
          {origin && (
            <Text>
              {distanceLabel(origin, b, language)} {t.distance}
            </Text>
          )}
          <Button title={t.map} color="#b3152b" onPress={() => select(b)} />
          {onChoose && (
            <Button
              disabled={disabled}
              title={selectedId === b.id ? `✓ ${t.selected}` : t.choose}
              color="#b3152b"
              onPress={() => {
                onChoose(b.id);
                select(b);
              }}
            />
          )}
          <Button title={t.street} color="#b3152b" onPress={() => open(streetViewUrl(b))} />
          <Button title={t.externalMap} color="#b3152b" onPress={() => open(boutiqueMapUrl(b))} />
        </View>
      ))}
    </View>
  );
}
const s = StyleSheet.create({
  form: { gap: 14 },
  notice: { backgroundColor: '#eee9df', padding: 14, borderRadius: 14, lineHeight: 22 },
  small: { fontSize: 12, lineHeight: 19, color: '#686159' },
  heading: { fontSize: 21 },
  map: { height: 300, width: '100%', borderRadius: 16 },
  photo: { width: '100%', height: 200, borderRadius: 14 },
  card: { gap: 12, paddingVertical: 18, borderBottomWidth: 1, borderColor: '#d9d4ca' },
});
