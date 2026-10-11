import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { createApiClient } from '@maison/api-client';
import { words, errors } from './i18n';
export const api = createApiClient();
const Context = createContext(null);
function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* In-memory use remains available when storage is blocked. */
  }
}
const emptyCart = () => ({ key: crypto.randomUUID(), lines: [] });
function readCart(userId) {
  const value = readStorage(`maison-bag:${userId || 'guest'}`, null);
  if (
    !value ||
    !Array.isArray(value.lines) ||
    value.lines.length > 30 ||
    typeof value.key !== 'string' ||
    !/^[0-9a-f-]{36}$/.test(value.key)
  )
    return emptyCart();
  const lines = value.lines.filter(
    (line) =>
      typeof line.productId === 'string' &&
      typeof line.variantId === 'string' &&
      Number.isInteger(line.quantity) &&
      line.quantity > 0 &&
      line.quantity <= 10,
  );
  if (new Set(lines.map((line) => line.variantId)).size !== lines.length) return emptyCart();
  return { key: value.key, lines };
}
export function Provider({ children }) {
  const [language, setLanguage] = useState(() =>
    readStorage('maison-language', 'es') === 'en' ? 'en' : 'es',
  );
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authVersion, setAuthVersion] = useState(0);
  const [cart, setCart] = useState(emptyCart);
  const [favorites, setFavorites] = useState([]);
  const [notice, setNotice] = useState(null);
  const timer = useRef();
  const userRef = useRef(null);
  const favoriteRequests = useRef(new Set());
  const notify = useCallback((text, type = 'success') => {
    clearTimeout(timer.current);
    setNotice({ text, type });
    timer.current = setTimeout(() => setNotice(null), 5000);
  }, []);
  const errorText = useCallback(
    (error) => errors[language][error?.code] || words[language].error,
    [language],
  );
  useEffect(() => {
    document.documentElement.lang = language;
    writeStorage('maison-language', language);
    document.querySelector('meta[name="description"]').content =
      language === 'es'
        ? 'KelseTS Maison. Boutique ficticia de moda, accesorios y belleza. Tu estilo cuenta una historia.'
        : 'KelseTS Maison. A fictional fashion, accessories and beauty boutique. Your style tells a story.';
  }, [language]);
  const loadFavorites = useCallback(async (currentUser) => {
    if (!currentUser) {
      setFavorites([]);
      return;
    }
    try {
      const items = await api.request('/favorites');
      if (userRef.current?.id === currentUser.id) setFavorites(items.map((item) => item.id));
    } catch {
      /* A later selection action can retry. */
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    api
      .request('/auth/me', { signal: controller.signal })
      .then((current) => {
        userRef.current = current;
        setUser(current);
        setCart(readCart(current?.id));
        loadFavorites(current);
        setAuthError(null);
        setAuthReady(true);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setAuthError(error);
          setAuthReady(false);
        }
      });
    return () => {
      controller.abort();
      clearTimeout(timer.current);
    };
  }, [authVersion]);
  useEffect(() => {
    if (authReady) writeStorage(`maison-bag:${user?.id || 'guest'}`, cart);
  }, [cart, user, authReady]);
  function authenticated(current) {
    const guest = user ? null : cart;
    const existing = readCart(current.id);
    const combined = [...existing.lines];
    for (const line of guest?.lines || []) {
      const match = combined.find((item) => item.variantId === line.variantId);
      if (match) match.quantity = Math.min(10, match.quantity + line.quantity);
      else if (combined.length < 30) combined.push(line);
    }
    setCart(guest?.lines.length ? { key: crypto.randomUUID(), lines: combined } : existing);
    writeStorage('maison-bag:guest', emptyCart());
    userRef.current = current;
    setUser(current);
    loadFavorites(current);
  }
  async function logout() {
    try {
      await api.request('/auth/logout', { method: 'POST' });
      userRef.current = null;
      setUser(null);
      setFavorites([]);
      setCart(readCart(null));
    } catch (error) {
      notify(errorText(error), 'error');
    }
  }
  function add(product, variant, quantity = 1) {
    const current = cart.lines.find((line) => line.variantId === variant.id);
    if (!authReady) return;
    if ((current?.quantity || 0) + quantity > Math.min(10, variant.stock)) {
      notify(errors[language].insufficient_stock, 'error');
      return;
    }
    if (!current && cart.lines.length >= 30) {
      notify(errors[language].invalid_input, 'error');
      return;
    }
    setCart((previous) => ({
      key: crypto.randomUUID(),
      lines: current
        ? previous.lines.map((line) =>
            line.variantId === variant.id ? { ...line, quantity: line.quantity + quantity } : line,
          )
        : [...previous.lines, { productId: product.id, variantId: variant.id, quantity }],
    }));
    notify(words[language].added);
  }
  function updateQuantity(id, quantity) {
    setCart((previous) => ({
      key: crypto.randomUUID(),
      lines:
        quantity > 0
          ? previous.lines.map((line) =>
              line.variantId === id ? { ...line, quantity: Math.min(10, quantity) } : line,
            )
          : previous.lines.filter((line) => line.variantId !== id),
    }));
  }
  async function toggleFavorite(id) {
    if (!user) return false;
    if (favoriteRequests.current.has(id)) return true;
    favoriteRequests.current.add(id);
    const has = favorites.includes(id);
    try {
      await api.request(`/favorites/${encodeURIComponent(id)}`, { method: has ? 'DELETE' : 'PUT' });
      setFavorites((previous) =>
        has ? previous.filter((value) => value !== id) : [...previous, id],
      );
      notify(words[language].saved);
    } catch (error) {
      notify(errorText(error), 'error');
    } finally {
      favoriteRequests.current.delete(id);
    }
    return true;
  }
  return (
    <Context.Provider
      value={{
        language,
        setLanguage,
        t: words[language],
        user,
        authReady,
        authenticated,
        logout,
        cart,
        add,
        updateQuantity,
        clearCart: () => setCart(emptyCart()),
        favorites,
        toggleFavorite,
        notify,
        errorText,
      }}
    >
      {authError && (
        <div className="session-error" role="alert">
          <span>{errorText(authError)}</span>
          <button
            className="underlined"
            onClick={() => {
              setAuthError(null);
              setAuthVersion((value) => value + 1);
            }}
          >
            {words[language].retry}
          </button>
        </div>
      )}
      {children}
      {notice && (
        <div className={`toast ${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
          {notice.text}
        </div>
      )}
    </Context.Provider>
  );
}
export const useMaison = () => useContext(Context);
export function useResource(path) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    if (!path) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });
    api
      .request(path, { signal: controller.signal })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ data: null, loading: false, error });
      });
    return () => controller.abort();
  }, [path, version]);
  return { ...state, reload };
}
