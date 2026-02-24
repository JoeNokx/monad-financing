import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { useUser } from '@clerk/clerk-expo';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { isLoaded, user } = useUser();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return currentPassword.trim().length >= 1 && newPassword.trim().length >= 8 && newPassword === confirm;
  }, [currentPassword, newPassword, confirm]);

  return (
    <View className="flex-1 bg-white px-5 pt-12">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-xl font-semibold text-gray-900">Change Password</Text>
      </View>

      <View className="h-8" />

      <View className="gap-3">
        <Input value={currentPassword} placeholder="Current password" onChangeText={setCurrentPassword} secureTextEntry />
        <Input value={newPassword} placeholder="New password (min 8 chars)" onChangeText={setNewPassword} secureTextEntry />
        <Input value={confirm} placeholder="Confirm new password" onChangeText={setConfirm} secureTextEntry />
      </View>

      <View className="flex-1" />

      <Button
        title={submitting ? 'Updating...' : 'Update Password'}
        disabled={!canSubmit || submitting || !isLoaded}
        onPress={() => {
          void (async () => {
            if (!isLoaded) return;

            if (newPassword !== confirm) {
              Alert.alert('Password', 'Passwords do not match');
              return;
            }

            try {
              setSubmitting(true);

              const fn = (user as any)?.updatePassword;
              if (typeof fn !== 'function') {
                Alert.alert('Password', 'Password change is not supported in this build.');
                return;
              }

              await fn.call(user, {
                currentPassword,
                newPassword,
              });

              Alert.alert('Password', 'Password updated successfully');
              router.replace('/(app)/security-settings');
            } catch (e: any) {
              Alert.alert('Password', e?.errors?.[0]?.longMessage ?? e?.message ?? 'Failed to update password');
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
