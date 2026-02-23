import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Button } from '../../components/ui/Button';

export default function PlaceholderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const title = typeof params.title === 'string' && params.title.trim().length > 0 ? params.title : 'Details';

  return (
    <View className="flex-1 bg-white px-5 pt-12">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-xl font-semibold text-gray-900">{title}</Text>
      </View>

      <View className="h-6" />

      <View className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
        <Text className="text-base font-semibold text-gray-900">Coming soon</Text>
        <View className="h-1" />
        <Text className="text-gray-600">This page is a placeholder and will be implemented next.</Text>
      </View>

      <View className="flex-1" />
      <Button title="Back" onPress={() => router.back()} />
      <View className="h-8" />
    </View>
  );
}
