import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useRef } from 'react';

import { env } from '../../config/env';
import { useSecurity } from '../../features/security/security.session';
import { AuthNavigator } from '../../navigation/AuthNavigator';

export default function AuthLayout() {
  const router = useRouter();
  const lastTargetRef = useRef<string | null>(null);
  const { isLoaded, isSignedIn } = useAuth();
  const { hydrated, onboardingComplete, hasPin, locked } = useSecurity();

  if (!hydrated || !isLoaded) return null;

  const target = (() => {
    if (!env.clerkPublishableKey) return '/(app)';
    if (!onboardingComplete) return '/onboarding';
    if (!isSignedIn) return null;
    if (!hasPin) return '/(auth)/create-pin';
    if (locked) return '/(auth)/pin-login';
    return '/(app)/home';
  })();

  useEffect(() => {
    if (!target) return;
    if (lastTargetRef.current === target) return;
    lastTargetRef.current = target;
    router.replace(target as any);
  }, [router, target]);

  if (target && !target.startsWith('/(auth)/')) {
    return null;
  }

  return <AuthNavigator />;
}
