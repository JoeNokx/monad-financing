import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '../../../components/ui/Button';
import { APP_NAME } from '../../../config/constants';
import { useSecurity } from '../../security/security.session';
import { initials } from '../../../utils/format';

export default function HomeScreen() {
  const router = useRouter();
  const { appData } = useSecurity();

  const openWhatsApp = async () => {
    const phone = '233546022758';
    const appUrl = `whatsapp://send?phone=${phone}`;
    const webUrl = `https://wa.me/${phone}`;

    try {
      const supported = await Linking.canOpenURL(appUrl);
      await Linking.openURL(supported ? appUrl : webUrl);
    } catch {
      await Linking.openURL(webUrl);
    }
  };

  const me = appData?.me;
  const displayName = me?.fullName ?? me?.email ?? '';
  const firstName = displayName.trim().length > 0 ? displayName.trim().split(' ')[0] : '';

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="px-5 pb-10 pt-12">
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => router.push('/(app)/profile')}
          className="flex-row items-center gap-3"
          accessibilityRole="button"
        >
          {me ? (
            <View className="h-12 w-12 items-center justify-center rounded-full bg-purple-600">
              <Text className="text-base font-semibold text-white">{initials(displayName) || 'U'}</Text>
            </View>
          ) : (
            <View className="h-12 w-12 rounded-full bg-gray-200" />
          )}

          <View>
            <Text className="text-lg font-semibold text-gray-900">Hi {firstName ? `${firstName},` : ''}</Text>
            <View className="h-1" />
            <Text className="text-sm text-gray-500">Welcome back to {APP_NAME},</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => {}}
          className="h-12 w-12 items-center justify-center rounded-full bg-white"
          accessibilityRole="button"
        >
          <Ionicons name="notifications-outline" size={22} color="#6B7280" />
        </Pressable>
      </View>

      <View className="h-6" />

      <View className="rounded-3xl bg-white p-5 shadow-sm">
        <Text className="text-xs font-semibold tracking-widest text-purple-600">AVAILABLE LOANS</Text>
        <View className="h-4" />

        <View className="rounded-2xl bg-gray-50 p-4">
          <Text className="text-base font-semibold text-gray-900">No loan plans available yet</Text>
          <View className="h-1" />
          <Text className="text-sm text-gray-600">When an admin creates loan plans, they will appear here.</Text>
        </View>

        <View className="h-4" />

        <Button title="Request a Loan" onPress={() => router.push('/(app)/request-loan')} />
      </View>

      <View className="h-5" />

      <View className="overflow-hidden rounded-3xl bg-purple-600 p-5">
        <Text className="text-lg font-semibold text-white">Invite friends, earn cash!</Text>
        <View className="h-2" />
        <Text className="text-sm text-purple-100">
          Get rewards for every friend who signs up with your referral code and takes a loan.
        </Text>
        <View className="h-4" />
        <Pressable className="rounded-full bg-white py-4" accessibilityRole="button">
          <Text className="text-center font-semibold text-purple-700">Invite Now</Text>
        </Pressable>
      </View>

      <View className="h-5" />

      <View className="rounded-3xl bg-white p-5 shadow-sm">
        <Text className="text-lg font-semibold text-gray-900">Why borrow from us?</Text>
        <View className="h-4" />

        <View className="gap-4">
          <View className="flex-row items-start gap-3">
            <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-orange-50">
              <Ionicons name="checkmark" size={18} color="#EA580C" />
            </View>
            <Text className="flex-1 text-sm font-semibold text-gray-700">Low interest rates and flexible repayment.</Text>
          </View>

          <View className="flex-row items-start gap-3">
            <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-orange-50">
              <Ionicons name="checkmark" size={18} color="#EA580C" />
            </View>
            <Text className="flex-1 text-sm font-semibold text-gray-700">Instant approval and quick cash out.</Text>
          </View>

          <View className="flex-row items-start gap-3">
            <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-orange-50">
              <Ionicons name="checkmark" size={18} color="#EA580C" />
            </View>
            <Text className="flex-1 text-sm font-semibold text-gray-700">Secure and transparent process.</Text>
          </View>
        </View>
      </View>

      <View className="h-5" />

      <Pressable onPress={() => void openWhatsApp()} accessibilityRole="button" className="rounded-3xl bg-white p-5 shadow-sm">
        <Text className="text-lg font-semibold text-gray-900">Need Help?</Text>
        <View className="h-2" />
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-sm text-gray-600">Chat with our support team on WhatsApp</Text>
          </View>
          <View className="h-12 w-12 items-center justify-center rounded-full bg-green-50">
            <Ionicons name="logo-whatsapp" size={26} color="#16A34A" />
          </View>
        </View>
      </Pressable>
    </ScrollView>
  );
}
