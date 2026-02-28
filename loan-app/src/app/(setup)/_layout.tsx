import { useAuth } from '@clerk/clerk-expo';
import { Stack, usePathname, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';

import { env } from '../../config/env';
import { useSecurity } from '../../features/security/security.session';
import { AppSkeleton } from '../../components/ui/AppSkeleton';

export default function SetupLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const lastTargetRef = useRef<string | null>(null);
  const { hydrated, onboardingComplete, hasPin, locked, setUnlockRedirectPath } = useSecurity();
  const { isLoaded, isSignedIn, sessionId } = useAuth();

  const stableSessionIdRef = useRef<string | null>(null);

  if (isLoaded) {
    if (sessionId) stableSessionIdRef.current = sessionId;
    else if (!isSignedIn) stableSessionIdRef.current = null;
  }

  const isAuthed = Boolean(stableSessionIdRef.current) || isSignedIn;

  const navTarget = useMemo(() => {
    if (!env.clerkPublishableKey) return '/(app)';
    if (!hydrated || !isLoaded) return null;
    if (!onboardingComplete) return '/onboarding';
    if (!isAuthed) return '/(auth)/sign-in';
    if (!hasPin) return '/(auth)/create-pin';
    if (locked) return '/(auth)/pin-login';
    return null;
  }, [hydrated, isLoaded, onboardingComplete, isAuthed, hasPin, locked]);

  useEffect(() => {
    if (!navTarget) {
      lastTargetRef.current = null;
      return;
    }

    if (lastTargetRef.current === navTarget) return;
    lastTargetRef.current = navTarget;

    if (navTarget === '/(auth)/pin-login') {
      setUnlockRedirectPath(pathname);
    }
    router.replace(navTarget as any);
  }, [router, navTarget, pathname, setUnlockRedirectPath]);

  if (!hydrated || !isLoaded) return <AppSkeleton />;
  if (navTarget) return <AppSkeleton />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
