import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { deleteSecureItem, getSecureItem, setSecureItem } from '../../services/secure.storage';

type StoredSession = {
  isAuthenticated: boolean;
  loggedOut: boolean;
};

type AuthSessionValue = {
  hydrated: boolean;
  isAuthenticated: boolean;
  hasPin: boolean;
  loggedOut: boolean;
  pendingPin: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  startPinSetup: (pin: string) => void;
  clearPendingPin: () => void;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
};

const SESSION_KEY = 'auth_session_v1';
const PIN_KEY = 'auth_pin_v1';

const AuthSessionContext = createContext<AuthSessionValue | null>(null);

async function readStoredSession(): Promise<StoredSession | null> {
  const raw = await getSecureItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredSession;
    if (typeof parsed?.isAuthenticated !== 'boolean') return null;
    if (typeof parsed?.loggedOut !== 'boolean') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [hydrated, setHydrated] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loggedOut, setLoggedOut] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [pendingPin, setPendingPin] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const [session, pin] = await Promise.all([readStoredSession(), getSecureItem(PIN_KEY)]);

      if (cancelled) return;

      setIsAuthenticated(session?.isAuthenticated ?? false);
      setLoggedOut(session?.loggedOut ?? false);
      setHasPin(Boolean(pin));
      setHydrated(true);
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  const persistSession = useCallback(async (next: StoredSession) => {
    await setSecureItem(SESSION_KEY, JSON.stringify(next));
    setIsAuthenticated(next.isAuthenticated);
    setLoggedOut(next.loggedOut);
  }, []);

  const signIn = useCallback(async () => {
    await persistSession({ isAuthenticated: true, loggedOut: false });
  }, [persistSession]);

  const signOut = useCallback(async () => {
    await persistSession({ isAuthenticated: false, loggedOut: true });
  }, [persistSession]);

  const setPin = useCallback(async (pin: string) => {
    await setSecureItem(PIN_KEY, pin);
    setHasPin(true);
  }, []);

  const startPinSetup = useCallback((pin: string) => {
    setPendingPin(pin);
  }, []);

  const clearPendingPin = useCallback(() => {
    setPendingPin(null);
  }, []);

  const verifyPin = useCallback(async (pin: string) => {
    const stored = await getSecureItem(PIN_KEY);
    if (!stored) return false;

    const ok = stored === pin;
    if (ok) {
      await persistSession({ isAuthenticated: true, loggedOut: false });
    }

    return ok;
  }, [persistSession]);

  const value = useMemo<AuthSessionValue>(
    () => ({
      hydrated,
      isAuthenticated,
      hasPin,
      loggedOut,
      pendingPin,
      signIn,
      signOut,
      startPinSetup,
      clearPendingPin,
      setPin,
      verifyPin,
    }),
    [hydrated, isAuthenticated, hasPin, loggedOut, pendingPin, signIn, signOut, startPinSetup, clearPendingPin, setPin, verifyPin],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) {
    throw new Error('useAuthSession must be used within AuthSessionProvider');
  }
  return ctx;
}

export async function clearAuthSession() {
  await Promise.all([deleteSecureItem(SESSION_KEY), deleteSecureItem(PIN_KEY)]);
}
