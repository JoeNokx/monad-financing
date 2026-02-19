import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function WelcomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-6">
      <Text className="text-xl font-semibold">Welcome</Text>
      <View className="h-4" />
      <Link href="/onboarding" asChild>
        <Text className="text-blue-600">Open onboarding</Text>
      </Link>
    </View>
  );
}
