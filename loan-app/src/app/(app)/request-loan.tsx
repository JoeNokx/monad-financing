import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Button } from '../../components/ui/Button';

export default function RequestLoanScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white px-5 pt-12">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-xl font-semibold text-gray-900">Request a Loan</Text>
      </View>

      <View className="h-6" />

      <View className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
        <Text className="text-base font-semibold text-gray-900">Loan request is not available yet</Text>
        <View className="h-1" />
        <Text className="text-gray-600">Once loan plans are created by the admin, you will be able to request a loan here.</Text>
      </View>

      <View className="flex-1" />
      <Button title="Back" onPress={() => router.back()} />
      <View className="h-8" />
    </View>
  );
}
