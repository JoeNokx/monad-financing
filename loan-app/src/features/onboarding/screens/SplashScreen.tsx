import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { APP_NAME } from '../../../config/constants';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const id = setTimeout(() => {
      router.replace('/onboarding');
    }, 1200);

    return () => clearTimeout(id);
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-blue-700">
      <View className="items-center">
        <View className="h-20 w-20 items-center justify-center rounded-2xl bg-white">
          <Ionicons name="wallet-outline" size={40} color="#1D4ED8" />
        </View>

        <View className="h-5" />
        <Text className="text-3xl font-semibold text-white">{APP_NAME}</Text>
        <View className="h-2" />
        <Text className="text-white/80">Your trusted loan partner</Text>
      </View>
    </View>
  );
}
