import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function RegisterScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-6">
      <Text className="text-xl font-semibold">Register</Text>
      <View className="h-6" />
      <Link href="/(auth)/sign-in" asChild>
        <Text className="text-blue-600">Back to Sign In</Text>
      </Link>
    </View>
  );
}
