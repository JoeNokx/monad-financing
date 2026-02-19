import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function WelcomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-6">
      <Text className="text-xl font-semibold">Loan App</Text>
      <View className="h-4" />
      <Link href="/(auth)/sign-in" asChild>
        <Text className="text-blue-600">Go to Sign In</Text>
      </Link>
    </View>
  );
}
