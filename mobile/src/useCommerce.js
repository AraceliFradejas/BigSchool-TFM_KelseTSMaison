import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { api } from './model';
import { cartStorageKey, combineGuestBag, restoreCart } from './cart-state';
const empty = () => ({ key: randomUUID(), lines: [] });
export function useCommerce() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(empty);
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [storageError, setStorageError] = useState(false);
  const [busy, setBusy] = useState(false);
  const current = useRef({ user: null, cart });
  const pending = useRef(false);
  const writes = useRef(Promise.resolve());
  function save(scope, value) {
    writes.current = writes.current
      .catch(() => {})
      .then(() => AsyncStorage.setItem(cartStorageKey(scope), JSON.stringify(value)))
      .then(() => {
        setStorageError(false);
        return true;
      })
      .catch(() => {
        setStorageError(true);
        return false;
      });
    return writes.current;
  }
  async function read(scope) {
    await writes.current;
    try {
      let value = await AsyncStorage.getItem(cartStorageKey(scope));
      // Only the guest scope can import the initial public bag.
      if (!scope && value === null) value = await AsyncStorage.getItem('@kelsets-maison/bag/v1');
      return restoreCart(value, randomUUID);
    } catch {
      setStorageError(true);
      return empty();
    }
  }
  function publish(nextUser, nextCart) {
    current.current = { user: nextUser, cart: nextCart };
    setUser(nextUser);
    setCart(nextCart);
  }
  async function refreshSession() {
    if (pending.current) return;
    pending.current = true;
    setReady(false);
    setAuthError(null);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      let nextUser;
      try {
        nextUser = await api.request('/auth/me', { signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }
      const nextCart = await read(nextUser?.id);
      publish(nextUser, nextCart);
      setReady(true);
    } catch (error) {
      setAuthError(error);
    } finally {
      pending.current = false;
    }
  }
  useEffect(() => {
    refreshSession();
  }, []);
  function change(lines) {
    if (!ready || pending.current) throw new Error('session_busy');
    const next = { key: randomUUID(), lines };
    publish(current.current.user, next);
    save(current.current.user?.id, next);
  }
  async function login(body, register) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      const nextUser = await api.request(register ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body,
      });
      const verified = await api.request('/auth/me');
      if (verified?.id !== nextUser.id)
        throw Object.assign(new Error('session_unavailable'), { code: 'session_unavailable' });
      const own = await read(nextUser.id);
      const next = current.current.user
        ? own
        : combineGuestBag(own, current.current.cart, randomUUID);
      await save(nextUser.id, next);
      // Replace the legacy guest bag so it cannot be imported into another account.
      await save(null, empty());
      publish(verified, next);
      setReady(true);
      setAuthError(null);
      return verified;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function logout() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      await api.request('/auth/logout', { method: 'POST' });
      const verified = await api.request('/auth/me');
      if (verified)
        throw Object.assign(new Error('session_unavailable'), { code: 'session_unavailable' });
      publish(null, await read(null));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function checkout(payment, expectedTotalCents) {
    if (pending.current || !current.current.user)
      throw Object.assign(new Error('authentication_required'), {
        code: 'authentication_required',
      });
    pending.current = true;
    setBusy(true);
    const snapshot = current.current;
    try {
      if (!(await save(snapshot.user.id, snapshot.cart)))
        throw Object.assign(new Error('storage_unavailable'), { code: 'storage_unavailable' });
      const order = await api.request('/checkout/demo', {
        method: 'POST',
        body: {
          idempotencyKey: snapshot.cart.key,
          lines: snapshot.cart.lines.map(({ variantId, quantity }) => ({ variantId, quantity })),
          payment,
          expectedTotalCents,
        },
      });
      if (order.payment?.mode !== 'demo' || order.payment.chargedCents !== 0)
        throw Object.assign(new Error('invalid_response'), { code: 'invalid_response' });
      const next = empty();
      publish(snapshot.user, next);
      await save(snapshot.user.id, next);
      return order;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return {
    user,
    cart,
    ready,
    authError,
    storageError,
    busy,
    login,
    logout,
    change,
    checkout,
    refreshSession,
  };
}
