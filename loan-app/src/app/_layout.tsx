import '../../global.css';

import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { env } from '../config/env';
import { SecurityProvider } from '../features/security/security.session';
import { useSecurity } from '../features/security/security.session';
import { RootNavigator } from '../navigation/RootNavigator';

function LockRedirectTracker() {
  const pathname = usePathname();
  const { locked, setUnlockRedirectPath } = useSecurity();
  const lastCapturedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!locked) {
      lastCapturedRef.current = null;
      return;
    }

    if (!pathname || pathname.startsWith('/(auth)/')) return;
    if (lastCapturedRef.current === pathname) return;
    lastCapturedRef.current = pathname;
    setUnlockRedirectPath(pathname);
  }, [locked, pathname, setUnlockRedirectPath]);

  return null;
}

export default function RootLayout() {
  const publishableKey = env.clerkPublishableKey;

  if (!publishableKey) {
    return (
      <SecurityProvider>
        <SafeAreaProvider>
          <LockRedirectTracker />
          <RootNavigator />
        </SafeAreaProvider>
      </SecurityProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SecurityProvider>
        <SafeAreaProvider>
          <LockRedirectTracker />
          <RootNavigator />
        </SafeAreaProvider>
      </SecurityProvider>
    </ClerkProvider>
  );
}
