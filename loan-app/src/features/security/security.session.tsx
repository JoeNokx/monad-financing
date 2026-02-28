import { AppState, AppStateStatus } from 'react-native';
import { createContext, Dispatch, PropsWithChildren, SetStateAction, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { getSecureItem, setSecureItem } from '../../services/secure.storage';
import type { KycStatusResponse } from '../../types/kyc';
import type { Loan, LoanProduct } from '../../types/loan';
import type { ProfileMeResponse } from '../../types/profile';
import type { User } from '../../types/user';

export type AppData = {
  profileMe: ProfileMeResponse;
  me: User;
  kyc: KycStatusResponse;
  loans: Loan[];
  products: LoanProduct[];
};

type SecurityValue = {
  hydrated: boolean;
  onboardingComplete: boolean;
  hasPin: boolean;
  isUnlocked: boolean;
  locked: boolean;
  pendingPin: string | null;
  unlockRedirectPath: string | null;
  appData: AppData | null;
  appDataRefreshNonce: number;
  syncClerkSessionId: (sessionId: string | null) => void;
  setAppData: Dispatch<SetStateAction<AppData | null>>;
  refreshAppData: () => void;
  setOnboardingComplete: () => Promise<void>;
  lock: () => void;
  unlock: () => void;
  suspendAutoLock: (ms: number) => void;
  setUnlockRedirectPath: (path: string | null) => void;
  consumeUnlockRedirectPath: () => string | null;
  startPinSetup: (pin: string) => void;
  clearPendingPin: () => void;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
};

const ONBOARDING_KEY = 'onboarding_complete_v1';
const PIN_KEY = 'auth_pin_v1';

const AUTO_LOCK_MIN_BACKGROUND_MS = 2500;

const SecurityContext = createContext<SecurityValue | null>(null);

export function SecurityProvider({ children }: PropsWithChildren) {
  const [hydrated, setHydrated] = useState(false);
  const [onboardingComplete, setOnboardingCompleteState] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pendingPin, setPendingPin] = useState<string | null>(null);
  const [unlockRedirectPath, setUnlockRedirectPathState] = useState<string | null>(null);
  const [appData, setAppData] = useState<AppData | null>(null);
  const [appDataRefreshNonce, setAppDataRefreshNonce] = useState(0);

  const backgroundAtRef = useRef<number | null>(null);
  const autoLockSuspendedUntilRef = useRef<number | null>(null);
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
      setIsUnlocked(!pinExists);
      setHydrated(true);
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  const locked = hasPin && !isUnlocked;

  useEffect(() => {
    function onAppStateChange(nextState: AppStateStatus) {
      if (nextState === 'background' || nextState === 'inactive') {
        if (!isUnlocked) return;
        backgroundAtRef.current = Date.now();
        return;
      }

      if (nextState === 'active') {
        const bgAt = backgroundAtRef.current;
        backgroundAtRef.current = null;
        if (!bgAt) return;

        if (Date.now() - bgAt < AUTO_LOCK_MIN_BACKGROUND_MS) {
          return;
        }

        const suspendedUntil = autoLockSuspendedUntilRef.current;
        if (suspendedUntil && Date.now() < suspendedUntil) {
          return;
        }

        if (hasPin && isUnlocked) {
          setIsUnlocked(false);
        }
      }
    }

    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => sub.remove();
  }, [hasPin, isUnlocked]);

  const setOnboardingComplete = useCallback(async () => {
    await setSecureItem(ONBOARDING_KEY, 'true');
    setOnboardingCompleteState(true);
  }, []);

  const lock = useCallback(() => {
    if (hasPin) setIsUnlocked(false);
  }, [hasPin]);

  const syncClerkSessionId = useCallback(
    (sessionId: string | null) => {
      const prev = clerkSessionIdRef.current;
      clerkSessionIdRef.current = sessionId;

      if (!sessionId) return;
      if (prev && prev === sessionId) return;
    },
    [hasPin],
  );

  const refreshAppData = useCallback(() => {
    setAppDataRefreshNonce((n) => n + 1);
  }, []);

  const unlock = useCallback(() => {
    setIsUnlocked(true);
    backgroundAtRef.current = null;
    autoLockSuspendedUntilRef.current = Date.now() + AUTO_LOCK_MIN_BACKGROUND_MS;
  }, []);

  const suspendAutoLock = useCallback((ms: number) => {
    autoLockSuspendedUntilRef.current = Date.now() + Math.max(0, ms);
  }, []);

  const setUnlockRedirectPath = useCallback((path: string | null) => {
    setUnlockRedirectPathState(path);
  }, []);

  const consumeUnlockRedirectPath = useCallback(() => {
    let path: string | null = null;
    setUnlockRedirectPathState((p) => {
      path = p;
      return null;
    });
    return path;
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
    setIsUnlocked(true);
    backgroundAtRef.current = null;
    autoLockSuspendedUntilRef.current = Date.now() + AUTO_LOCK_MIN_BACKGROUND_MS;
  }, []);

  const verifyPin = useCallback(async (pin: string) => {
    const stored = await getSecureItem(PIN_KEY);
    if (!stored) return false;

    const ok = stored === pin;
    if (ok) {
      setIsUnlocked(true);
      backgroundAtRef.current = null;
      autoLockSuspendedUntilRef.current = Date.now() + AUTO_LOCK_MIN_BACKGROUND_MS;
    }
    return ok;
  }, []);

  const value = useMemo<SecurityValue>(
    () => ({
      hydrated,
      onboardingComplete,
      hasPin,
      isUnlocked,
      locked,
      pendingPin,
      unlockRedirectPath,
      appData,
      appDataRefreshNonce,
      syncClerkSessionId,
      setAppData,
      refreshAppData,
      setOnboardingComplete,
      lock,
      unlock,
      suspendAutoLock,
      setUnlockRedirectPath,
      consumeUnlockRedirectPath,
      startPinSetup,
      clearPendingPin,
      setPin,
      verifyPin,
    }),
    [
      hydrated,
      onboardingComplete,
      hasPin,
      isUnlocked,
      locked,
      pendingPin,
      unlockRedirectPath,
      appData,
      appDataRefreshNonce,
      syncClerkSessionId,
      refreshAppData,
      setOnboardingComplete,
      lock,
      unlock,
      suspendAutoLock,
      setUnlockRedirectPath,
      consumeUnlockRedirectPath,
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
