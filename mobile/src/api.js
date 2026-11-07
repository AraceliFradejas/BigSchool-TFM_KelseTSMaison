import { createApiClient } from '@maison/api-client';
import * as SecureStore from 'expo-secure-store';
import { service } from './model';
import { createNativeSession } from './native-session';

const key = 'maison.native-session.v1';
const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
export const nativeSession = createNativeSession({
  read: () => SecureStore.getItemAsync(key, options),
  write: (token) => SecureStore.setItemAsync(key, token, options),
  remove: () => SecureStore.deleteItemAsync(key, options),
});
export const api = createApiClient({
  baseUrl: service.baseUrl,
  getAccessToken: nativeSession.getAccessToken,
});

export async function verifyNativeToken(token) {
  const temporary = createApiClient({ baseUrl: service.baseUrl, getAccessToken: () => token });
  return temporary.request('/auth/me');
}

// If secure storage fails after issuance, revoke that token without persisting it.
export async function revokeUnstoredSession(token) {
  const temporary = createApiClient({ baseUrl: service.baseUrl, getAccessToken: () => token });
  await temporary.request('/auth/logout', { method: 'POST' });
}
