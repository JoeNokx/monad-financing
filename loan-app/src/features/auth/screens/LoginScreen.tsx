import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function LoginScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-6">
      <Text className="text-xl font-semibold">Sign in</Text>
      <View className="h-2" />
      <Text className="text-center text-gray-600">Clerk UI will be wired here after dependencies are installed.</Text>
      <View className="h-6" />
      <Link href="/(app)" asChild>
        <Text className="text-blue-600">Continue (placeholder)</Text>
      </Link>
      <View className="h-4" />
      <Link href="/" asChild>
        <Text className="text-gray-700">Back</Text>
      </Link>
    </View>
  );
}
