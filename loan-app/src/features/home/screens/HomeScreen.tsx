import { Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-white px-5 pt-8">
      <Text className="text-3xl font-semibold text-gray-900">Home</Text>
      <View className="h-4" />
      <Text className="text-gray-500">Home tab UI will be matched once you provide the Home screenshot.</Text>
    </View>
  );
}
