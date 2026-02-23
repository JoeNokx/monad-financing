import { AppState, AppStateStatus } from 'react-native';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { getSecureItem, setSecureItem } from '../../services/secure.storage';

type SecurityValue = {
  hydrated: boolean;
  onboardingComplete: boolean;
  hasPin: boolean;
  locked: boolean;
  pendingPin: string | null;
  syncClerkSessionId: (sessionId: string | null) => void;
  setOnboardingComplete: () => Promise<void>;
  lock: () => void;
  unlock: () => void;
  startPinSetup: (pin: string) => void;
  clearPendingPin: () => void;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
};

const ONBOARDING_KEY = 'onboarding_complete_v1';
const PIN_KEY = 'auth_pin_v1';

const SecurityContext = createContext<SecurityValue | null>(null);

export function SecurityProvider({ children }: PropsWithChildren) {
  const [hydrated, setHydrated] = useState(false);
  const [onboardingComplete, setOnboardingCompleteState] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [locked, setLocked] = useState(false);
  const [pendingPin, setPendingPin] = useState<string | null>(null);

  const backgroundAtRef = useRef<number | null>(null);
  const clerkSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const [onboardingRaw, pin] = await Promise.all([getSecureItem(ONBOARDING_KEY), getSecureItem(PIN_KEY)]);

      if (cancelled) return;

      const onboarding = onboardingRaw === 'true';
      const pinExists = Boolean(pin);

      setOnboardingCompleteState(onboarding);
      setHasPin(pinExists);
      setLocked(pinExists);
      setHydrated(true);
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onAppStateChange(nextState: AppStateStatus) {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundAtRef.current = Date.now();
        return;
      }

      if (nextState === 'active') {
        const bgAt = backgroundAtRef.current;
        backgroundAtRef.current = null;
        if (!bgAt) return;

        const elapsedMs = Date.now() - bgAt;
        const TEN_MINUTES_MS = 10 * 60 * 1000;
        if (elapsedMs >= TEN_MINUTES_MS) {
          setLocked(true);
        }
      }
    }

    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => sub.remove();
  }, []);

  const setOnboardingComplete = useCallback(async () => {
    await setSecureItem(ONBOARDING_KEY, 'true');
    setOnboardingCompleteState(true);
  }, []);

  const lock = useCallback(() => {
    if (hasPin) setLocked(true);
  }, [hasPin]);

  const syncClerkSessionId = useCallback(
    (sessionId: string | null) => {
      const prev = clerkSessionIdRef.current;
      clerkSessionIdRef.current = sessionId;

      if (!sessionId) return;
      if (prev && prev === sessionId) return;

      if (hasPin) {
        setLocked(true);
      }
    },
    [hasPin],
  );

  const unlock = useCallback(() => {
    setLocked(false);
  }, []);

  const startPinSetup = useCallback((pin: string) => {
    setPendingPin(pin);
  }, []);

  const clearPendingPin = useCallback(() => {
    setPendingPin(null);
  }, []);

  const setPin = useCallback(async (pin: string) => {
    await setSecureItem(PIN_KEY, pin);
    setHasPin(true);
    setLocked(false);
  }, []);

  const verifyPin = useCallback(async (pin: string) => {
    const stored = await getSecureItem(PIN_KEY);
    if (!stored) return false;

    const ok = stored === pin;
    if (ok) setLocked(false);
    return ok;
  }, []);

  const value = useMemo<SecurityValue>(
    () => ({
      hydrated,
      onboardingComplete,
      hasPin,
      locked,
      pendingPin,
      syncClerkSessionId,
      setOnboardingComplete,
      lock,
      unlock,
      startPinSetup,
      clearPendingPin,
      setPin,
      verifyPin,
    }),
    [
      hydrated,
      onboardingComplete,
      hasPin,
      locked,
      pendingPin,
      syncClerkSessionId,
      setOnboardingComplete,
      lock,
      unlock,
      startPinSetup,
      clearPendingPin,
      setPin,
      verifyPin,
    ],
  );

  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
}

export function useSecurity() {
  const ctx = useContext(SecurityContext);
  if (!ctx) {
    throw new Error('useSecurity must be used within SecurityProvider');
  }
  return ctx;
}
