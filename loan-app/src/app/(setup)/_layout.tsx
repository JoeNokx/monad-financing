import { useAuth } from '@clerk/clerk-expo';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';

import { env } from '../../config/env';
import { useSecurity } from '../../features/security/security.session';
import { AppSkeleton } from '../../components/ui/AppSkeleton';

export default function SetupLayout() {
  const router = useRouter();
  const lastTargetRef = useRef<string | null>(null);
  const { hydrated, onboardingComplete, hasPin, locked } = useSecurity();
  const { isLoaded, isSignedIn } = useAuth();

  const navTarget = useMemo(() => {
    if (!env.clerkPublishableKey) return '/(app)';
    if (!hydrated || !isLoaded) return null;
    if (!onboardingComplete) return '/onboarding';
    if (!isSignedIn) return '/(auth)/sign-in';
    if (!hasPin) return '/(auth)/create-pin';
    if (locked) return '/(auth)/pin-login';
    return null;
  }, [hydrated, isLoaded, onboardingComplete, isSignedIn, hasPin, locked]);

  useEffect(() => {
    if (!navTarget) {
      lastTargetRef.current = null;
      return;
    }

    if (lastTargetRef.current === navTarget) return;
    lastTargetRef.current = navTarget;
    router.replace(navTarget as any);
  }, [router, navTarget]);

  if (!hydrated || !isLoaded) return <AppSkeleton />;
  if (navTarget) return <AppSkeleton />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
