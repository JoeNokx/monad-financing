import { useRouter } from 'expo-router';
import { Redirect } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { useAuth } from '@clerk/clerk-expo';

import { Button } from '../../../components/ui/Button';
import { PinCodeInput } from '../components/PinCodeInput';
import { env } from '../../../config/env';
import { useSecurity } from '../../security/security.session';

export default function ConfirmPinScreen() {
  if (!env.clerkPublishableKey) {
    return <Redirect href="/(app)" />;
  }

  return <ConfirmPinInner />;
}

function ConfirmPinInner() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { hydrated, onboardingComplete, pendingPin, clearPendingPin, setPin } = useSecurity();

  const [pin, setPinInput] = useState('');

  useEffect(() => {
    if (!hydrated) return;
    if (!onboardingComplete) {
      router.replace('/onboarding');
      return;
    }
    if (!isSignedIn) {
      router.replace('/(auth)/sign-in');
      return;
    }

    if (!pendingPin) {
      router.replace('/(auth)/create-pin');
    }
  }, [hydrated, onboardingComplete, isSignedIn, pendingPin, router]);

  const canContinue = useMemo(() => pin.length === 4, [pin]);

  return (
    <View className="flex-1 bg-white px-6 pt-10">
      <Text className="text-2xl font-semibold text-gray-900">Confirm your PIN</Text>
      <View className="h-2" />
      <Text className="text-gray-600">Re-enter your 4-digit PIN to confirm.</Text>

      <View className="h-10" />
      <PinCodeInput value={pin} onChange={setPinInput} />

      <View className="flex-1" />
      <Button
        title="Continue"
        disabled={!canContinue}
        onPress={async () => {
          if (!pendingPin) {
            router.replace('/(auth)/create-pin');
            return;
          }

          if (pin !== pendingPin) {
            Alert.alert('PIN', 'PINs do not match. Please try again.');
            setPinInput('');
            return;
          }

          await setPin(pin);
          clearPendingPin();
          router.replace('/(setup)');
        }}
      />
      <View className="h-8" />
    </View>
  );
}
