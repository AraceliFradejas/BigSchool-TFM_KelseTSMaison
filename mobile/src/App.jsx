import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ActionSheetIOS,
  Button as NativeButton,
  Alert,
  BackHandler,
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useCommerce } from './useCommerce';
import { Account, Checkout, Order } from './Commerce';
import { accountCopy, commerceError } from './commerce-copy';
import { paymentCopy } from '@maison/contracts/demo-payment';
import Brand from './Brand';
import { useRemote } from './useRemote';
import Outfits from './Outfits';
import Intro from './Intro';
import { mergeCartSelection } from '@maison/contracts/cart-selection';
import Svg, { Path } from 'react-native-svg';
import { api, addToBag, imageUrl, money, resolveBag } from './model';

const words = {
  es: {
    demo: 'Boutique de demostración · Sin cobros reales',
    catalogue: 'Boutique',
    outfits: 'Outfits',
    bag: 'Bolsa',
    account: 'Mi cuenta',
    title: 'Tu estilo, tu historia.',
    search: 'Buscar una pieza',
    all: 'Todo',
    fashion: 'Moda',
    accessories: 'Accesorios',
    beauty: 'Belleza',
    empty: 'No hay piezas con estos filtros.',
    retry: 'Reintentar',
    loading: 'Cargando…',
    network: 'No podemos conectar con Maison. Revisa la conexión y vuelve a intentarlo.',
    back: 'Volver',
    choose: 'Elige tu variante',
    sold: 'Agotado',
    available: 'unidades disponibles',
    add: 'Añadir a la bolsa',
    added: 'Añadido a tu bolsa',
    stock: 'La cantidad supera las existencias disponibles.',
    unavailable: 'Esta pieza ya no está disponible.',
    total: 'Total de demostración',
    remove: 'Quitar',
    update: 'Actualizar precios y existencias',
    emptyBag: 'Tu bolsa espera una historia.',
    bagNotice:
      'Los precios y existencias se consultan de nuevo al abrir la bolsa. Al confirmar se registra un pedido de demostración, sin realizar ningún cobro.',
    invalid: 'Revisa esta pieza: ya no está disponible en esa cantidad.',
    storage: 'No hemos podido guardar la bolsa en este dispositivo.',
    previous: 'Anterior',
    next: 'Siguiente',
    pieces: 'piezas',
    page: 'Página',
    select: 'Selecciona una variante para continuar.',
    detail: 'Pieza ficticia. No se realizan ventas ni envíos.',
    close: 'Aceptar',
  },
  en: {
    demo: 'Demonstration boutique · No real payments',
    catalogue: 'Boutique',
    outfits: 'Outfits',
    bag: 'Bag',
    account: 'My account',
    title: 'Your style, your story.',
    search: 'Find a piece',
    all: 'All',
    fashion: 'Fashion',
    accessories: 'Accessories',
    beauty: 'Beauty',
    empty: 'No pieces match these filters.',
    retry: 'Try again',
    loading: 'Loading…',
    network: 'We cannot connect to Maison. Check your connection and try again.',
    back: 'Back',
    choose: 'Choose your variant',
    sold: 'Sold out',
    available: 'units available',
    add: 'Add to bag',
    added: 'Added to your bag',
    stock: 'The quantity exceeds the available stock.',
    unavailable: 'This piece is no longer available.',
    total: 'Demonstration total',
    remove: 'Remove',
    update: 'Refresh prices and availability',
    emptyBag: 'Your bag is waiting for a story.',
    bagNotice:
      'Prices and availability are refreshed when you open your bag. Confirmation records a demonstration order without any charge.',
    invalid: 'Review this piece: this quantity is no longer available.',
    storage: 'We could not save your bag on this device.',
    previous: 'Previous',
    next: 'Next',
    pieces: 'pieces',
    page: 'Page',
    select: 'Choose a variant to continue.',
    detail: 'A fictional piece. No real sales or shipping.',
    close: 'OK',
  },
};
function Button({ children, onPress, disabled, secondary, selected, ...props }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        disabled: Boolean(disabled),
        ...(selected === undefined ? {} : { selected }),
      }}
      disabled={disabled}
      android_ripple={{ color: secondary ? '#b3152b22' : '#ffffff33' }}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        selected && s.selected,
        disabled && s.dim,
        pressed && Platform.OS === 'ios' && s.pressed,
      ]}
      {...props}
    >
      <Text style={[s.buttonText, secondary && s.secondaryText, selected && s.selectedText]}>
        {children}
      </Text>
    </Pressable>
  );
}
function Photo({ product, language, large = false, style }) {
  const [failed, setFailed] = useState(false);
  const uri = imageUrl(product?.image);
  return uri && !failed ? (
    <Image
      key={uri}
      accessibilityLabel={product.name[language]}
      source={{ uri }}
      onError={() => setFailed(true)}
      resizeMode="cover"
      style={[large ? s.largePhoto : s.photo, style]}
    />
  ) : (
    <View style={[large ? s.largePhoto : s.photo, style]}>
      <Text>{product?.name[language]}</Text>
    </View>
  );
}
function Resource({ resource, t, children }) {
  if (resource.loading)
    return (
      <View style={s.message}>
        <ActivityIndicator color="#b3152b" />
        <Text accessibilityLiveRegion="polite">{t.loading}</Text>
      </View>
    );
  if (resource.error)
    return (
      <View style={s.message}>
        <Text accessibilityRole="alert">
          {resource.error.status === 404 ? t.unavailable : t.network}
        </Text>
        <NativeButton title={t.retry} color="#b3152b" onPress={resource.reload} />
      </View>
    );
  return children;
}
function Catalogue({ language, t, open }) {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const resource = useRemote(
    `/products?q=${encodeURIComponent(search)}&page=${page}${category ? `&category=${category}` : ''}`,
  );
  const list = useRef(null);
  function changePage(value) {
    setPage(value);
    list.current?.scrollToOffset({ offset: 0, animated: false });
  }
  return (
    <View style={s.flex}>
      <View style={s.intro}>
        <Text style={s.title}>{t.title}</Text>
        <View style={s.searchRow}>
          <TextInput
            accessibilityLabel={t.search}
            placeholder={t.search}
            value={query}
            onChangeText={setQuery}
            maxLength={120}
            onSubmitEditing={() => {
              setSearch(query.trim());
              changePage(1);
            }}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
            style={s.input}
          />
          <Button
            onPress={() => {
              setSearch(query.trim());
              changePage(1);
            }}
          >
            {t.search}
          </Button>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chips}
        >
          {['', 'fashion', 'accessories', 'beauty'].map((value) => (
            <Button
              key={value}
              secondary
              selected={category === value}
              onPress={() => {
                setCategory(value);
                changePage(1);
              }}
            >
              {value ? t[value] : t.all}
            </Button>
          ))}
        </ScrollView>
      </View>
      <Resource resource={resource} t={t}>
        <FlatList
          ref={list}
          data={resource.data?.items || []}
          numColumns={2}
          keyExtractor={(p) => p.id}
          contentContainerStyle={s.grid}
          columnWrapperStyle={s.gridRow}
          refreshing={false}
          onRefresh={resource.reload}
          ListEmptyComponent={<Text style={s.message}>{t.empty}</Text>}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.name[language]}
              onPress={() => open(item.id)}
              style={s.card}
            >
              <Photo product={item} language={language} />
              <Text style={s.category}>{t[item.category]}</Text>
              <Text style={s.name}>{item.name[language]}</Text>
              <Text style={s.price}>
                {money(Math.min(...item.variants.map((v) => v.priceCents)), language)}
              </Text>
            </Pressable>
          )}
          ListFooterComponent={
            <View style={s.pagination}>
              <Text>
                {resource.data?.total} {t.pieces} · {t.page} {resource.data?.page}
              </Text>
              <View style={s.row}>
                <Button secondary disabled={page <= 1} onPress={() => changePage(page - 1)}>
                  {t.previous}
                </Button>
                <Button
                  secondary
                  disabled={
                    !resource.data ||
                    resource.data.page * resource.data.pageSize >= resource.data.total
                  }
                  onPress={() => changePage(page + 1)}
                >
                  {t.next}
                </Button>
              </View>
            </View>
          }
        />
      </Resource>
    </View>
  );
}
function Detail({ id, language, t, add, back }) {
  const resource = useRemote(`/products/${encodeURIComponent(id)}`);
  const [selected, setSelected] = useState(null);
  const product = resource.data;
  const variant = product?.variants.find((v) => v.id === selected);
  return (
    <ScrollView
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={resource.reload} />}
    >
      <View style={s.backControl}>
        <NativeButton title={t.back} color="#b3152b" onPress={back} />
      </View>
      <Resource resource={resource} t={t}>
        {product && (
          <>
            <Photo key={product.image} product={product} language={language} large />
            <Text style={s.title}>{product.name[language]}</Text>
            <Text style={s.price}>
              {money(
                variant?.priceCents ?? Math.min(...product.variants.map((v) => v.priceCents)),
                language,
              )}
            </Text>
            <Text style={s.body}>{product.description[language]}</Text>
            <Text style={s.section}>{t.choose}</Text>
            {product.variants.map((v) => (
              <Button
                key={v.id}
                secondary
                selected={selected === v.id}
                disabled={v.stock <= 0}
                onPress={() => setSelected(v.id)}
              >
                {v.label[language]}
                {v.stock <= 0 ? ` · ${t.sold}` : ''}
              </Button>
            ))}
            <Text accessibilityLiveRegion="polite" style={s.body}>
              {variant ? `${variant.stock} ${t.available}` : t.select}
            </Text>
            <Button
              disabled={!variant || variant.stock <= 0}
              onPress={() => add(product, variant.id)}
            >
              {t.add}
            </Button>
            <Text style={s.notice}>{t.detail}</Text>
          </>
        )}
      </Resource>
    </ScrollView>
  );
}
function Bag({ lines, change, language, t, open, user, onCheckout, onLogin }) {
  const [state, setState] = useState({ loading: true });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true });
    Promise.all(
      [...new Set(lines.map((line) => line.productId))].map((id) =>
        api
          .request(`/products/${encodeURIComponent(id)}`, { signal: controller.signal })
          .catch((e) => {
            if (e.status === 404) return null;
            throw e;
          }),
      ),
    )
      .then((products) => {
        if (!controller.signal.aborted)
          setState({ data: resolveBag(lines, products), loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ error, loading: false });
      });
    return () => controller.abort();
  }, [lines, version]);
  const reload = () => setVersion((v) => v + 1);
  const allValid = state.data?.every((row) => row.valid);
  return (
    <ScrollView contentContainerStyle={s.content}>
      <Text style={s.title}>{t.bag}</Text>
      <Text style={s.notice}>{t.bagNotice}</Text>
      <Resource resource={{ ...state, reload }} t={t}>
        {!lines.length && <Text style={s.body}>{t.emptyBag}</Text>}
        {state.data?.map((line) => (
          <View key={line.variantId} style={s.bagLine}>
            {line.product ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${line.product.name[language]}, ${line.variant?.label[language] || line.variantId}, ${line.quantity}, ${line.variant ? money(line.totalCents, language) : ''}`}
                onPress={() => open(line.productId)}
                style={s.bagProduct}
              >
                <Photo
                  key={line.product.image}
                  product={line.product}
                  language={language}
                  style={s.bagPhoto}
                />
                <View style={s.bagInfo}>
                  <Text style={s.name}>{line.product.name[language]}</Text>
                  <Text>
                    {line.variant?.label[language] || line.variantId} · × {line.quantity}
                  </Text>
                  {line.variant && <Text style={s.price}>{money(line.totalCents, language)}</Text>}
                </View>
              </Pressable>
            ) : (
              <Text>
                {line.variant?.label[language] || line.variantId} · × {line.quantity}
              </Text>
            )}
            {!line.valid && <Text style={s.error}>{t.invalid}</Text>}
            <View style={s.row}>
              <Button
                secondary
                disabled={line.quantity <= 1}
                accessibilityLabel={language === 'es' ? 'Reducir cantidad' : 'Decrease quantity'}
                onPress={() =>
                  change(
                    lines.map((l) =>
                      l.variantId === line.variantId ? { ...l, quantity: l.quantity - 1 } : l,
                    ),
                  )
                }
              >
                −
              </Button>
              <Button
                secondary
                disabled={!line.variant || line.quantity >= Math.min(10, line.variant.stock)}
                accessibilityLabel={language === 'es' ? 'Aumentar cantidad' : 'Increase quantity'}
                onPress={() =>
                  change(
                    lines.map((l) =>
                      l.variantId === line.variantId ? { ...l, quantity: l.quantity + 1 } : l,
                    ),
                  )
                }
              >
                +
              </Button>
              <Button
                secondary
                onPress={() => change(lines.filter((l) => l.variantId !== line.variantId))}
              >
                {t.remove}
              </Button>
            </View>
          </View>
        ))}
        {Boolean(lines.length) && (
          <>
            <Text style={s.section}>
              {t.total}:{' '}
              {allValid
                ? money(state.data?.reduce((sum, line) => sum + line.totalCents, 0) || 0, language)
                : '—'}
            </Text>
            <Button
              disabled={!allValid}
              onPress={() =>
                user
                  ? onCheckout(
                      state.data,
                      state.data.reduce((sum, line) => sum + line.totalCents, 0),
                    )
                  : onLogin()
              }
            >
              {user ? paymentCopy[language].review : accountCopy[language].continue}
            </Button>
            <Button secondary onPress={reload}>
              {t.update}
            </Button>
          </>
        )}
      </Resource>
    </ScrollView>
  );
}
export default function App() {
  const [language, setLanguage] = useState('es');
  const [intro, setIntro] = useState(true);
  const t = words[language];
  const [route, setRoute] = useState({ screen: 'catalogue' });
  const commerce = useCommerce();
  const { user, ready, storageError, busy } = commerce;
  const lines = commerce.cart.lines;
  const change = commerce.change;
  const [paymentError, setPaymentError] = useState(null);
  async function confirmPayment(payment) {
    setPaymentError(null);
    try {
      const order = await commerce.checkout(payment, route.total);
      setRoute({ screen: 'order', id: order.id, completed: true });
    } catch (error) {
      setPaymentError(error);
    }
  }
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (busy) return true;
      if (route.screen === 'catalogue') return false;
      setRoute(route.returnTo || { screen: route.from || 'catalogue' });
      return true;
    });
    return () => sub.remove();
  }, [route, busy]);
  function chooseLanguage() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: language === 'es' ? 'Idioma' : 'Language',
          options: ['Castellano', 'English', language === 'es' ? 'Cancelar' : 'Cancel'],
          cancelButtonIndex: 2,
          tintColor: '#b3152b',
        },
        (index) => {
          if (index < 2) setLanguage(index === 0 ? 'es' : 'en');
        },
      );
    } else {
      Alert.alert(language === 'es' ? 'Idioma' : 'Language', undefined, [
        { text: 'Castellano', onPress: () => setLanguage('es') },
        { text: 'English', onPress: () => setLanguage('en') },
        { text: language === 'es' ? 'Cancelar' : 'Cancel', style: 'cancel' },
      ]);
    }
  }
  function add(product, variantId) {
    try {
      change(addToBag(lines, product, variantId));
      Alert.alert(t.added, '', [{ text: t.close }]);
    } catch (e) {
      Alert.alert(t.stock);
    }
  }
  function addLook(pieces) {
    try {
      change(mergeCartSelection(lines, pieces));
      Alert.alert(t.added, '', [{ text: t.close }]);
    } catch {
      Alert.alert(t.stock);
    }
  }
  const open = (id) =>
    setRoute({
      screen: 'detail',
      id,
      from: route.screen === 'look' ? 'outfits' : route.screen,
      returnTo: route,
    });
  return (
    <SafeAreaProvider>
      <SafeAreaView style={s.app}>
        <StatusBar style="dark" />
        <View
          style={s.flex}
          accessibilityElementsHidden={intro}
          importantForAccessibility={intro ? 'no-hide-descendants' : 'auto'}
        >
          <Text style={s.banner}>{t.demo}</Text>
          <View style={s.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.catalogue}
              onPress={() => setRoute({ screen: 'catalogue' })}
            >
              <Brand />
            </Pressable>
            <Button
              secondary
              accessibilityLabel={language === 'es' ? 'Switch to English' : 'Cambiar a castellano'}
              onPress={chooseLanguage}
            >
              {language.toUpperCase()} / {language === 'es' ? 'EN' : 'ES'}
            </Button>
          </View>
          {storageError && (
            <Text accessibilityRole="alert" style={s.error}>
              {t.storage}
            </Text>
          )}
          {!ready ? (
            <View style={s.message}>
              {commerce.authError ? (
                <>
                  <Text style={s.error}>{commerceError(commerce.authError, language)}</Text>
                  <NativeButton title={t.retry} onPress={commerce.refreshSession} />
                </>
              ) : (
                <ActivityIndicator color="#b3152b" />
              )}
            </View>
          ) : route.screen === 'detail' ? (
            <Detail
              key={route.id}
              id={route.id}
              language={language}
              t={t}
              add={add}
              back={() => setRoute(route.returnTo || { screen: route.from })}
            />
          ) : route.screen === 'outfits' || route.screen === 'look' ? (
            <Outfits
              language={language}
              lookId={route.id}
              openLook={(id) => setRoute({ screen: 'look', id, from: 'outfits' })}
              back={() => setRoute({ screen: 'outfits' })}
              openProduct={open}
              addLook={addLook}
            />
          ) : route.screen === 'account' ||
            (!user && ['checkout', 'order'].includes(route.screen)) ? (
            <Account
              commerce={commerce}
              language={language}
              open={(id) => setRoute({ screen: 'order', id, from: 'account' })}
            />
          ) : route.screen === 'checkout' ? (
            <Checkout
              language={language}
              rows={route.rows}
              total={route.total}
              busy={busy}
              error={paymentError}
              back={() => setRoute({ screen: 'bag' })}
              confirm={confirmPayment}
            />
          ) : route.screen === 'order' ? (
            <Order
              key={route.id}
              id={route.id}
              completed={route.completed}
              language={language}
              back={() => setRoute({ screen: 'account' })}
            />
          ) : route.screen === 'bag' ? (
            <Bag
              lines={lines}
              change={change}
              language={language}
              t={t}
              open={open}
              user={user}
              onLogin={() => setRoute({ screen: 'account' })}
              onCheckout={(rows, total) => {
                setPaymentError(null);
                setRoute({ screen: 'checkout', rows, total });
              }}
            />
          ) : (
            <Catalogue language={language} t={t} open={open} />
          )}
          <View style={s.tabs} accessibilityRole="tablist">
            {['catalogue', 'outfits', 'bag', 'account'].map((screen) => {
              const selected =
                route.screen === screen ||
                ((route.screen === 'detail' || route.screen === 'look') && route.from === screen);
              const count = lines.reduce((sum, line) => sum + line.quantity, 0);
              return (
                <Pressable
                  key={screen}
                  accessibilityRole="tab"
                  accessibilityLabel={`${t[screen]}${screen === 'bag' ? ` (${count})` : ''}`}
                  disabled={busy}
                  accessibilityState={{ selected, disabled: busy }}
                  onPress={() => setRoute({ screen })}
                  android_ripple={{ color: '#b3152b22' }}
                  style={({ pressed }) => [
                    s.tab,
                    selected && s.activeTab,
                    pressed && Platform.OS === 'ios' && s.pressed,
                  ]}
                >
                  <View style={s.tabIcon}>
                    <Svg
                      width={24}
                      height={24}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={selected ? '#b3152b' : '#777169'}
                      strokeWidth={1.7}
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                    >
                      <Path
                        d={
                          screen === 'catalogue'
                            ? 'M3 9h18L19 3H5L3 9ZM4 9v12h16V9M9 21v-7h6v7M3 9c0 3 4 3 4 0 0 3 5 3 5 0 0 3 5 3 5 0 0 3 4 3 4 0'
                            : screen === 'outfits'
                              ? 'M9 5a3 3 0 0 1 6 0c0 2-3 2-3 4v2L3 17v3h18v-3l-9-6'
                              : screen === 'account'
                                ? 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2'
                                : 'M5 7h14l2 14H3L5 7ZM8 8V6a4 4 0 0 1 8 0v2'
                        }
                      />
                    </Svg>
                    {screen === 'bag' && count > 0 && (
                      <View style={s.badge}>
                        <Text style={s.badgeText}>{count}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[s.tabLabel, selected && s.selectedText]}>{t[screen]}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        {intro && <Intro language={language} onDone={() => setIntro(false)} />}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
const s = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#f6f4ee' },
  flex: { flex: 1 },
  banner: {
    backgroundColor: '#b3152b',
    color: '#fff',
    textAlign: 'center',
    padding: 9,
    fontSize: 11,
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#d9d4ca',
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#242320',
    fontSize: 30,
    marginVertical: 12,
  },
  intro: { paddingHorizontal: 16, paddingTop: 4 },
  searchRow: { gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#b8b2a7',
    padding: 12,
    color: '#242320',
    backgroundColor: '#eeeae3',
    borderRadius: 14,
    minHeight: 48,
  },
  chips: { gap: 8, paddingVertical: 12 },
  button: {
    backgroundColor: '#b3152b',
    borderRadius: Platform.OS === 'ios' ? 14 : 24,
    overflow: 'hidden',
    paddingVertical: 13,
    paddingHorizontal: 16,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  secondary: { borderWidth: 0, backgroundColor: '#eeeae3' },
  secondaryText: { color: '#242320' },
  selected: { backgroundColor: '#f7dfe3' },
  selectedText: { color: '#a50e27', fontWeight: '700' },
  pressed: { opacity: 0.65, transform: [{ scale: 0.98 }] },
  backControl: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  dim: { opacity: 0.45 },
  grid: { padding: 16, paddingTop: 4 },
  gridRow: { gap: 12 },
  card: { flex: 1, maxWidth: '50%', marginBottom: 22 },
  photo: { width: '100%', aspectRatio: 0.8, backgroundColor: '#ebe6dc', borderRadius: 16 },
  largePhoto: { width: '100%', aspectRatio: 0.8, backgroundColor: '#ebe6dc', borderRadius: 22 },
  category: { color: '#6c665e', fontSize: 10, textTransform: 'uppercase', marginTop: 10 },
  name: { color: '#242320', fontSize: 15, marginVertical: 6 },
  price: { color: '#242320', fontSize: 15, fontWeight: '600', marginBottom: 8 },
  body: { color: '#514c45', fontSize: 16, lineHeight: 25 },
  section: { fontSize: 19, color: '#242320', marginVertical: 10 },
  notice: {
    fontSize: 13,
    lineHeight: 21,
    color: '#6c665e',
    backgroundColor: '#eee9df',
    borderRadius: 16,
    padding: 14,
  },
  content: { padding: 18, gap: 12 },
  message: { padding: 24, gap: 14 },
  error: { color: '#b3152b', padding: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pagination: { paddingVertical: 16, gap: 14, alignItems: 'center' },
  bagProduct: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  bagPhoto: {
    width: 88,
    height: 110,
    aspectRatio: undefined,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bagInfo: { flex: 1, gap: 8 },
  bagLine: { paddingVertical: 16, gap: 8, borderBottomWidth: 1, borderColor: '#d9d4ca' },
  tab: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 24,
    overflow: 'hidden',
  },
  activeTab: { backgroundColor: Platform.OS === 'android' ? '#f7dfe3' : '#f4eeea' },
  tabIcon: { width: 28, height: 26, alignItems: 'center' },
  tabLabel: { fontSize: 12, fontWeight: '500', color: '#777169' },
  badge: {
    position: 'absolute',
    right: -12,
    top: -5,
    backgroundColor: '#b3152b',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#d9d4ca',
    backgroundColor: '#fffcf7',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 12,
  },
});
