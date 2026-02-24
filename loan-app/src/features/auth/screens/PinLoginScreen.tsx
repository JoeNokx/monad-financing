import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Button } from '../../../components/ui/Button';
import { PinCodeInput } from '../components/PinCodeInput';
import { useSecurity } from '../../security/security.session';
import { useAuth, useClerk } from '@clerk/clerk-expo';
import { env } from '../../../config/env';

export default function PinLoginScreen() {
  const router = useRouter();
  const didNavRef = useRef(false);

  const hasClerk = Boolean(env.clerkPublishableKey);

  useEffect(() => {
    if (hasClerk) return;
    if (didNavRef.current) return;
    didNavRef.current = true;
    router.replace('/(app)');
  }, [hasClerk, router]);

  if (!hasClerk) {
    return null;
  }

  return <PinLoginInner />;
}

function PinLoginInner() {
  const router = useRouter();
  const lastTargetRef = useRef<string | null>(null);
  const { signOut } = useClerk();
  const { isLoaded, isSignedIn } = useAuth();
  const { hydrated, onboardingComplete, hasPin, verifyPin } = useSecurity();

  const [pin, setPin] = useState('');
  const [cooldownMs, setCooldownMs] = useState(0);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (cooldownMs <= 0) return;

    const id = setInterval(() => {
      setCooldownMs((ms) => Math.max(0, ms - 250));
    }, 250);

    return () => clearInterval(id);
  }, [cooldownMs]);

  useEffect(() => {
    if (!hydrated || !isLoaded) return;

    const target = (() => {
      if (!onboardingComplete) return '/onboarding';
      if (!isSignedIn) return '/(auth)/sign-in';
      if (!hasPin) return '/(auth)/create-pin';
      return null;
    })();

    if (!target) {
      lastTargetRef.current = null;
      return;
    }

    if (lastTargetRef.current === target) return;
    lastTargetRef.current = target;
    router.replace(target as any);
  }, [hydrated, isLoaded, onboardingComplete, isSignedIn, hasPin, router]);

  const canContinue = useMemo(() => pin.length === 4, [pin]);

  return (
    <View className="flex-1 bg-white px-6 pt-10">
      <Text className="text-2xl font-semibold text-gray-900">Enter PIN</Text>
      <View className="h-2" />
      <Text className="text-gray-600">Sign in quickly using your 4-digit PIN.</Text>

      <View className="h-10" />
      <PinCodeInput value={pin} onChange={setPin} />

      <View className="flex-1" />
      <Button
        title="Sign in"
        disabled={!canContinue || cooldownMs > 0}
        onPress={async () => {
          const ok = await verifyPin(pin);
          if (!ok) {
            attemptsRef.current += 1;
            const remaining = Math.max(0, 5 - attemptsRef.current);
            Alert.alert('PIN', remaining > 0 ? `Incorrect PIN. ${remaining} attempts left.` : 'Too many attempts. Please sign in again.');
            setPin('');

            if (attemptsRef.current >= 3 && attemptsRef.current < 5) {
              setCooldownMs(2000);
            }

            if (attemptsRef.current >= 5) {
              try {
                await signOut();
              } finally {
                router.replace('/(auth)/sign-in');
              }
            }
            return;
          }

          router.replace('/(app)/home');
        }}
      />
      <View className="h-8" />
    </View>
  );
}
