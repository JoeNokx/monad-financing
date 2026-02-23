import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';

import { env } from '../../config/env';
import { useSecurity } from '../../features/security/security.session';

export default function SetupLayout() {
  const { hydrated, onboardingComplete, hasPin, locked } = useSecurity();

  if (!env.clerkPublishableKey) {
    return <Redirect href="/(app)" />;
  }

  return <SetupLayoutInner hydrated={hydrated} onboardingComplete={onboardingComplete} hasPin={hasPin} locked={locked} />;
}

function SetupLayoutInner(props: {
  hydrated: boolean;
  onboardingComplete: boolean;
  hasPin: boolean;
  locked: boolean;
}) {
  const { isSignedIn } = useAuth();

  if (!props.hydrated) return null;
  if (!props.onboardingComplete) return <Redirect href="/onboarding" />;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;
  if (!props.hasPin) return <Redirect href="/(auth)/create-pin" />;
  if (props.locked) return <Redirect href="/(auth)/pin-login" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
