import { useState } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { imageUrl, money, outfitSelection } from './model';
import { useRemote } from './useRemote';

function Chip({ children, active, disabled, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(active), disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      android_ripple={{ color: '#b3152b22' }}
      style={({ pressed }) => [
        s.chip,
        active && s.active,
        disabled && s.dim,
        pressed && Platform.OS === 'ios' && s.dim,
      ]}
    >
      <Text style={[s.chipText, active && s.activeText]}>{children}</Text>
    </Pressable>
  );
}
function LookImage({ look, large }) {
  const [failed, setFailed] = useState(false);
  const uri = imageUrl(look.image);
  return uri && !failed ? (
    <Image
      source={{ uri }}
      accessibilityLabel={look.name}
      resizeMode="contain"
      onError={() => setFailed(true)}
      style={large ? s.largeImage : s.image}
    />
  ) : (
    <View style={large ? s.largeImage : s.image}>
      <Text>{look.name}</Text>
    </View>
  );
}
function Selection({ look, language, openProduct, addLook }) {
  const [selected, setSelected] = useState({});
  const es = language === 'es';
  const pieces = look.products.map((product) => ({
    product,
    variant: product.variants.find((v) => v.id === selected[product.id]),
  }));
  const ready = look.complete && pieces.length > 0 && pieces.every((p) => p.variant?.stock > 0);
  const total = pieces.reduce((sum, p) => sum + (p.variant?.priceCents || 0), 0);
  return (
    <>
      <LookImage look={look} large />
      <Text style={s.eyebrow}>THE RUNWAY WARDROBE · {String(look.position).padStart(2, '0')}</Text>
      <Text accessibilityRole="header" style={s.title}>
        {look.name}
      </Text>
      <Text style={s.album}>{look.songAlbum}</Text>
      <Text style={s.body}>{look.description[language]}</Text>
      {!look.complete && (
        <Text style={s.error}>
          {es
            ? 'Alguna pieza ya no está disponible. Puedes explorar las restantes.'
            : 'Some pieces are no longer available. You can explore the remaining pieces.'}
        </Text>
      )}
      <Text style={s.body}>
        {es
          ? 'Elige la variante de cada pieza para añadir el conjunto completo.'
          : 'Choose a variant for each piece to add the complete outfit.'}
      </Text>
      {pieces.map(({ product, variant }) => (
        <View key={product.id} style={s.piece}>
          <Pressable
            accessibilityRole="button"
            onPress={() => openProduct(product.id)}
            style={s.pieceHeading}
          >
            <Image
              source={{ uri: imageUrl(product.image) }}
              accessibilityLabel={product.name[language]}
              style={s.thumbnail}
            />
            <View style={s.pieceText}>
              <Text style={s.name}>{product.name[language]}</Text>
              <Text style={s.album}>{es ? 'Ver pieza' : 'View piece'} →</Text>
              {variant && <Text>{money(variant.priceCents, language)}</Text>}
            </View>
          </Pressable>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chips}
          >
            {product.variants.map((v) => (
              <Chip
                key={v.id}
                active={selected[product.id] === v.id}
                disabled={v.stock <= 0}
                onPress={() => setSelected((previous) => ({ ...previous, [product.id]: v.id }))}
              >
                {v.label[language]}
                {v.stock <= 0 ? ` · ${es ? 'Agotado' : 'Sold out'}` : ''}
              </Chip>
            ))}
          </ScrollView>
        </View>
      ))}
      <Text accessibilityLiveRegion="polite" style={s.total}>
        {ready
          ? `${es ? 'Total del conjunto' : 'Outfit total'}: ${money(total, language)}`
          : es
            ? 'Selecciona todas las variantes disponibles.'
            : 'Choose every available variant.'}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !ready }}
        disabled={!ready}
        onPress={() => addLook(outfitSelection(look, selected))}
        android_ripple={{ color: '#ffffff33' }}
        style={({ pressed }) => [s.add, (!ready || pressed) && s.dim]}
      >
        <Text style={s.addText}>
          {es ? 'Añadir el outfit completo' : 'Add the complete outfit'}
        </Text>
      </Pressable>
      <Text style={s.notice}>
        {es
          ? 'Selección editorial de demostración. No reserva stock ni realiza cobros.'
          : 'Demonstration editorial selection. No stock reservation or payment.'}
      </Text>
    </>
  );
}
export default function Outfits({ language, lookId, openLook, back, openProduct, addLook }) {
  const resource = useRemote('/looks');
  const [era, setEra] = useState('all');
  const { width } = useWindowDimensions();
  const es = language === 'es';
  const looks = resource.data?.filter((look) => look.sourceId) || [];
  const eras = [...new Set(looks.map((look) => look.songAlbum).filter(Boolean))];
  const columns = width >= 700 ? 3 : 2;
  const look = looks.find((item) => item.id === lookId);
  const error = resource.error;
  if (resource.loading)
    return (
      <View style={s.message}>
        <ActivityIndicator color="#b3152b" />
        <Text>{es ? 'Cargando outfits…' : 'Loading outfits…'}</Text>
      </View>
    );
  if (error)
    return (
      <View style={s.message}>
        <Text accessibilityRole="alert">
          {es ? 'No hemos podido cargar los outfits.' : 'We could not load the outfits.'}
        </Text>
        <Button title={es ? 'Reintentar' : 'Retry'} color="#b3152b" onPress={resource.reload} />
      </View>
    );
  if (lookId)
    return (
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.back}>
          <Button title={es ? 'Todos los outfits' : 'All outfits'} color="#b3152b" onPress={back} />
        </View>
        {look ? (
          <Selection
            key={look.id}
            look={look}
            language={language}
            openProduct={openProduct}
            addLook={addLook}
          />
        ) : (
          <Text>
            {es ? 'Este outfit ya no está disponible.' : 'This outfit is no longer available.'}
          </Text>
        )}
      </ScrollView>
    );
  return (
    <FlatList
      key={columns}
      numColumns={columns}
      data={looks.filter((look) => era === 'all' || look.songAlbum === era)}
      keyExtractor={(look) => look.id}
      contentContainerStyle={s.content}
      columnWrapperStyle={s.gridRow}
      onRefresh={resource.reload}
      refreshing={false}
      ListHeaderComponent={
        <>
          <Text style={s.eyebrow}>THE RUNWAY WARDROBE</Text>
          <Text accessibilityRole="header" style={s.title}>
            {es ? 'Encuentra tu era.' : 'Find your era.'}
          </Text>
          <Text style={s.body}>
            {es
              ? 'Outfits completos con nombres de canciones. Elige una pieza o construye tu conjunto.'
              : 'Complete outfits named after songs. Choose a piece or build your outfit.'}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chips}
          >
            {['all', ...eras].map((value) => (
              <Chip key={value} active={era === value} onPress={() => setEra(value)}>
                {value === 'all' ? (es ? 'Todas las eras' : 'All eras') : value}
              </Chip>
            ))}
          </ScrollView>
          <Text style={s.count}>
            {looks.filter((look) => era === 'all' || look.songAlbum === era).length} outfits
          </Text>
        </>
      }
      ListEmptyComponent={
        <Text>{es ? 'No hay outfits en esta selección.' : 'No outfits in this selection.'}</Text>
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.name}, ${item.songAlbum}`}
          onPress={() => openLook(item.id)}
          style={[s.card, { maxWidth: `${100 / columns}%` }]}
        >
          <LookImage look={item} />
          <Text style={s.name}>{item.name}</Text>
          <Text style={s.album}>{item.songAlbum}</Text>
          <Text style={s.count}>
            {item.products.length} {es ? 'piezas' : 'pieces'} · {es ? 'Elegir look' : 'Choose look'}{' '}
            →
          </Text>
        </Pressable>
      )}
    />
  );
}
const s = StyleSheet.create({
  content: { padding: 18, gap: 14, paddingBottom: 28 },
  message: { flex: 1, padding: 24, gap: 16 },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 30,
    color: '#242320',
    marginVertical: 10,
  },
  eyebrow: { fontSize: 10, letterSpacing: 2, color: '#b3152b', marginTop: 16 },
  body: { fontSize: 15, color: '#6c665e', lineHeight: 24, marginBottom: 10 },
  gridRow: { gap: 14 },
  card: { flex: 1, paddingBottom: 20 },
  image: { width: '100%', aspectRatio: 0.55, backgroundColor: '#eee9df', borderRadius: 18 },
  largeImage: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
    aspectRatio: 0.55,
    backgroundColor: '#eee9df',
    borderRadius: 22,
  },
  name: { fontSize: 17, fontWeight: '600', color: '#242320', marginVertical: 8 },
  album: { fontSize: 13, color: '#b3152b', marginBottom: 6 },
  count: { color: '#6c665e', fontSize: 12, marginVertical: 8 },
  chips: { gap: 8, paddingVertical: 12 },
  chip: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#eee9df',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chipText: { color: '#514c45', fontSize: 14 },
  active: { backgroundColor: '#f7dfe3' },
  activeText: { color: '#a50e27', fontWeight: '700' },
  dim: { opacity: 0.45 },
  back: { alignSelf: 'flex-start' },
  piece: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#d9d4ca',
  },
  pieceHeading: { flexDirection: 'row', gap: 16 },
  pieceText: { flex: 1 },
  thumbnail: { width: 68, height: 90, borderRadius: 12, backgroundColor: '#eee9df' },
  total: { color: '#242320', fontSize: 17, fontWeight: '600', marginTop: 14 },
  add: {
    minHeight: 52,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#b3152b',
    alignItems: 'center',
    overflow: 'hidden',
  },
  addText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  notice: { color: '#6c665e', fontSize: 12, lineHeight: 20, marginTop: 8 },
  error: { color: '#b3152b', lineHeight: 22 },
});
