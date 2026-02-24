import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { useAuth } from '@clerk/clerk-expo';

import { Button } from '../../../components/ui/Button';
import { PinCodeInput } from '../components/PinCodeInput';
import { env } from '../../../config/env';
import { useSecurity } from '../../security/security.session';

export default function CreatePinScreen() {
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

  return <CreatePinInner />;
}

function CreatePinInner() {
  const router = useRouter();
  const lastTargetRef = useRef<string | null>(null);
  const { isLoaded, isSignedIn } = useAuth();
  const { hydrated, onboardingComplete, startPinSetup } = useSecurity();

  useEffect(() => {
    if (!hydrated || !isLoaded) return;

    const target = (() => {
      if (!onboardingComplete) return '/onboarding';
      if (!isSignedIn) return '/(auth)/sign-in';
      return null;
    })();

    if (!target) {
      lastTargetRef.current = null;
      return;
    }

    if (lastTargetRef.current === target) return;
    lastTargetRef.current = target;
    router.replace(target as any);
  }, [hydrated, isLoaded, onboardingComplete, isSignedIn, router]);

  const [pin, setPin] = useState('');

  const canContinue = useMemo(() => pin.length === 4, [pin]);

  return (
    <View className="flex-1 bg-white px-6 pt-10">
      <Text className="text-2xl font-semibold text-gray-900">Create your PIN</Text>
      <View className="h-2" />
      <Text className="text-gray-600">This PIN will be used to quickly sign in next time.</Text>

      <View className="h-10" />
      <PinCodeInput value={pin} onChange={setPin} />

      <View className="flex-1" />
      <Button
        title="Continue"
        disabled={!canContinue}
        onPress={() => {
          if (pin.length !== 4) {
            Alert.alert('PIN', 'Please enter a 4-digit PIN');
            return;
          }

          startPinSetup(pin);
          router.push('/(auth)/confirm-pin');
        }}
      />
      <View className="h-8" />
    </View>
  );
}
