import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'wastelessai.authToken';

async function isSecureStoreAvailable() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function getStoredAuthToken() {
  if (!(await isSecureStoreAvailable())) return null;

  try {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    return token?.trim() ? token : null;
  } catch {
    return null;
  }
}

export async function setStoredAuthToken(token: string) {
  if (!(await isSecureStoreAvailable())) {
    throw new Error('Secure token storage is unavailable on this device.');
  }

  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function clearStoredAuthToken() {
  if (!(await isSecureStoreAvailable())) return;

  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}
