import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { env, requireEnv } from './env';

function normalizeBaseUrl(url: string) {
  let v = url.trim();
  if (v.endsWith('/')) v = v.slice(0, -1);
  if (v.endsWith('/api')) v = v.slice(0, -4);
  return v;
}

function getExpoDevHost() {
  const hostUri =
    (Constants as any)?.expoConfig?.hostUri ??
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ??
    (Constants as any)?.manifest?.hostUri ??
    (Constants as any)?.manifest?.debuggerHost;

  if (typeof hostUri !== 'string' || hostUri.trim().length === 0) return null;
  return hostUri.split(':')[0];
}

function withReachableDevHost(url: string) {
  try {
    const u = new URL(url);
    const isLoopback = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
    if (!isLoopback) return url;

    if (Platform.OS === 'android') {
      u.hostname = '10.0.2.2';
      return u.toString();
    }

    const expoHost = getExpoDevHost();
    if (expoHost) {
      u.hostname = expoHost;
      return u.toString();
    }

    return url;
  } catch {
    return url;
  }
}

const rawApiUrl = env.apiUrl ?? requireEnv('apiUrl');
export const BASE_URL = normalizeBaseUrl(withReachableDevHost(rawApiUrl));
