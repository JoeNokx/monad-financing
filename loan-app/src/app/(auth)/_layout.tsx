import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useRef } from 'react';

import { env } from '../../config/env';
import { useSecurity } from '../../features/security/security.session';
import { AppSkeleton } from '../../components/ui/AppSkeleton';
import { AuthNavigator } from '../../navigation/AuthNavigator';

export default function AuthLayout() {
  const router = useRouter();
  const lastTargetRef = useRef<string | null>(null);
  const { isLoaded, isSignedIn, sessionId } = useAuth();
  const { hydrated, onboardingComplete, hasPin, locked } = useSecurity();

  const stableSessionIdRef = useRef<string | null>(null);

  if (isLoaded) {
    if (sessionId) stableSessionIdRef.current = sessionId;
    else if (!isSignedIn) stableSessionIdRef.current = null;
  }

  const isAuthed = Boolean(stableSessionIdRef.current) || isSignedIn;

  if (!hydrated || !isLoaded) return <AppSkeleton />;

  const target = (() => {
    if (!env.clerkPublishableKey) return '/(app)';
    if (!onboardingComplete) return '/onboarding';
    if (!isAuthed) return null;
    if (!hasPin) return '/(auth)/create-pin';
    if (locked) return '/(auth)/pin-login';
    return '/(app)';
  })();

  useEffect(() => {
    if (!target) return;
    if (lastTargetRef.current === target) return;
    lastTargetRef.current = target;
    router.replace(target as any);
  }, [router, target]);

  return <AuthNavigator />;
}
