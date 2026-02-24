import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { Button } from '../../../components/ui/Button';
import { PinCodeInput } from '../../auth/components/PinCodeInput';
import { useSecurity } from '../../security/security.session';

export default function ConfirmChangePinScreen() {
  const router = useRouter();
  const { pendingPin, clearPendingPin, setPin } = useSecurity();

  const [pin, setPinInput] = useState('');

  const canContinue = useMemo(() => pin.length === 4, [pin]);

  return (
    <View className="flex-1 bg-white px-5 pt-12">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-xl font-semibold text-gray-900">Confirm PIN</Text>
      </View>

      <View className="h-8" />
      <Text className="text-gray-600">Re-enter your new 4-digit PIN to confirm.</Text>

      <View className="h-10" />
      <PinCodeInput value={pin} onChange={setPinInput} />

      <View className="flex-1" />

      <Button
        title="Update PIN"
        disabled={!canContinue}
        onPress={() => {
          void (async () => {
            if (!pendingPin) {
              Alert.alert('PIN', 'No pending PIN change found. Please try again.');
              router.replace('/(app)/change-pin');
              return;
            }

            if (pin !== pendingPin) {
              Alert.alert('PIN', 'PINs do not match. Please try again.');
              setPinInput('');
              return;
            }

            await setPin(pin);
            clearPendingPin();
            Alert.alert('PIN', 'PIN updated successfully');
            router.replace('/(app)/security-settings');
          })();
        }}
      />

      <View className="h-8" />
    </View>
  );
}
