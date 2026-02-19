import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function DashboardScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-6">
      <Text className="text-xl font-semibold">Dashboard</Text>
      <View className="h-2" />
      <Text className="text-center text-gray-600">Backend data screens will be implemented next.</Text>
      <View className="h-6" />
      <Link href="/" asChild>
        <Text className="text-blue-600">Back to root</Text>
      </Link>
    </View>
  );
}
