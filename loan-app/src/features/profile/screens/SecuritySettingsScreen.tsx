import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

function Item(props: { icon: any; title: string; subtitle: string; onPress: () => void; iconBg: string; iconColor: string }) {
  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="button"
      className="flex-row items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-4"
    >
      <View className="flex-row items-center gap-3">
        <View className={`h-12 w-12 items-center justify-center rounded-full ${props.iconBg}`}>
          <Ionicons name={props.icon} size={22} color={props.iconColor} />
        </View>
        <View>
          <Text className="text-base font-semibold text-gray-900">{props.title}</Text>
          <View className="h-1" />
          <Text className="text-gray-500">{props.subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </Pressable>
  );
}

export default function SecuritySettingsScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-5 pb-10 pt-12">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-xl font-semibold text-gray-900">Security Settings</Text>
      </View>

      <View className="h-6" />
      <Text className="text-gray-500">Manage your security credentials to keep your account safe</Text>

      <View className="h-6" />

      <View className="gap-3">
        <Item
          icon="lock-closed-outline"
          title="Change Password"
          subtitle="Update your account password"
          iconBg="bg-blue-100"
          iconColor="#1D4ED8"
          onPress={() => router.push('/(app)/change-password')}
        />
        <Item
          icon="key-outline"
          title="Change PIN"
          subtitle="Update your 4-digit security PIN"
          iconBg="bg-purple-100"
          iconColor="#7C3AED"
          onPress={() => router.push('/(app)/change-pin')}
        />
      </View>

      <View className="h-6" />

      <View className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Ionicons name="shield-outline" size={22} color="#1D4ED8" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-blue-900">Security Tip</Text>
            <View className="h-1" />
            <Text className="text-blue-900/80">
              Change your password and PIN regularly to keep your account secure. Never share your credentials with anyone, including MONaD Financing staff.
            </Text>
          </View>
        </View>
      </View>

      <View className="h-8" />
      <Text className="text-center text-gray-400">Last login: Today from Accra, Ghana</Text>
    </ScrollView>
  );
}
