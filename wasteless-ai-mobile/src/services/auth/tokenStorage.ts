import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const AUTH_TOKEN_KEY = 'wastelessai.authToken';

function getWebStorage() {
  if (Platform.OS !== 'web') return null;
  if (typeof globalThis.localStorage === 'undefined') return null;

  return globalThis.localStorage;
}

function getWebStoredAuthToken() {
  try {
    const token = getWebStorage()?.getItem(AUTH_TOKEN_KEY);
    return token?.trim() ? token : null;
  } catch {
    return null;
  }
}

function setWebStoredAuthToken(token: string) {
  const storage = getWebStorage();

  if (!storage) {
    throw new Error('Browser token storage is unavailable.');
  }

  storage.setItem(AUTH_TOKEN_KEY, token);
}

function clearWebStoredAuthToken() {
  try {
    getWebStorage()?.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // Best-effort cleanup for browsers with restricted storage.
  }
}

async function isSecureStoreAvailable() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function getStoredAuthToken() {
  if (Platform.OS === 'web') return getWebStoredAuthToken();
  if (!(await isSecureStoreAvailable())) return null;

  try {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    return token?.trim() ? token : null;
  } catch {
    return null;
  }
}

export async function setStoredAuthToken(token: string) {
  if (Platform.OS === 'web') {
    setWebStoredAuthToken(token);
    return;
  }

  if (!(await isSecureStoreAvailable())) {
    throw new Error('Secure token storage is unavailable on this device.');
  }

  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function clearStoredAuthToken() {
  if (Platform.OS === 'web') {
    clearWebStoredAuthToken();
    return;
  }

  if (!(await isSecureStoreAvailable())) return;

  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}
