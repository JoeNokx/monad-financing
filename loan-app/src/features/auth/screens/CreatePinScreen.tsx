import { useRouter } from 'expo-router';
import { Redirect } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { useAuth } from '@clerk/clerk-expo';

import { Button } from '../../../components/ui/Button';
import { PinCodeInput } from '../components/PinCodeInput';
import { env } from '../../../config/env';
import { useSecurity } from '../../security/security.session';

export default function CreatePinScreen() {
  if (!env.clerkPublishableKey) {
    return <Redirect href="/(app)" />;
  }

  return <CreatePinInner />;
}

function CreatePinInner() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { hydrated, onboardingComplete, startPinSetup } = useSecurity();

  useEffect(() => {
    if (!hydrated) return;
    if (!onboardingComplete) {
      router.replace('/onboarding');
      return;
    }
    if (!isSignedIn) {
      router.replace('/(auth)/sign-in');
    }
  }, [hydrated, onboardingComplete, isSignedIn, router]);

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
