import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { Button } from '../../../components/ui/Button';
import { PinCodeInput } from '../../auth/components/PinCodeInput';
import { useSecurity } from '../../security/security.session';

export default function ChangePinScreen() {
  const router = useRouter();
  const { verifyPin, startPinSetup, clearPendingPin } = useSecurity();

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [step, setStep] = useState<'current' | 'new'>('current');
  const [submitting, setSubmitting] = useState(false);

  const canContinue = useMemo(() => {
    if (step === 'current') return currentPin.length === 4;
    return newPin.length === 4;
  }, [currentPin, newPin, step]);

  return (
    <View className="flex-1 bg-white px-5 pt-12">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-xl font-semibold text-gray-900">Change PIN</Text>
      </View>

      <View className="h-8" />
      <Text className="text-gray-600">
        {step === 'current' ? 'Enter your current 4-digit PIN to continue.' : 'Enter your new 4-digit PIN.'}
      </Text>

      <View className="h-10" />
      <PinCodeInput value={step === 'current' ? currentPin : newPin} onChange={step === 'current' ? setCurrentPin : setNewPin} />

      <View className="flex-1" />

      <Button
        title={submitting ? 'Please wait...' : 'Continue'}
        disabled={!canContinue || submitting}
        onPress={() => {
          void (async () => {
            try {
              if (step === 'current') {
                setSubmitting(true);
                const ok = await verifyPin(currentPin);
                if (!ok) {
                  Alert.alert('PIN', 'Incorrect current PIN');
                  setCurrentPin('');
                  return;
                }

                setStep('new');
                return;
              }

              if (newPin.length !== 4) {
                Alert.alert('PIN', 'Please enter a 4-digit PIN');
                return;
              }

              clearPendingPin();
              startPinSetup(newPin);
              router.push('/(app)/confirm-change-pin');
            } finally {
              setSubmitting(false);
            }
          })();
        }}
      />

      <View className="h-8" />
    </View>
  );
}
