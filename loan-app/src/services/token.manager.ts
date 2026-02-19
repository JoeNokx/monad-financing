import { deleteSecureItem, getSecureItem, setSecureItem } from './secure.storage';

const AUTH_TOKEN_KEY = 'auth_token';

export async function setAuthToken(token: string) {
  await setSecureItem(AUTH_TOKEN_KEY, token);
}

export async function getAuthToken() {
  return getSecureItem(AUTH_TOKEN_KEY);
}

export async function clearAuthToken() {
  await deleteSecureItem(AUTH_TOKEN_KEY);
}
