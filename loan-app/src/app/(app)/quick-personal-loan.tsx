import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

function getParam(value: unknown) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default function QuickPersonalLoanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const loanTypeRaw = getParam(params.loanType);
  const loanType = typeof loanTypeRaw === 'string' && loanTypeRaw.trim().length > 0 ? loanTypeRaw : 'PERSONAL';

  return (
    <View className="flex-1 bg-white px-5 pt-12">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-xl font-semibold text-gray-900">Quick Personal Loan</Text>
      </View>

      <View className="h-6" />

      <Card className="rounded-2xl border-gray-100 p-5">
        <Text className="text-base font-semibold text-gray-900">Get cash in minutes</Text>
        <View className="h-2" />
        <Text className="text-gray-600">Choose your amount and duration. We will show you the full breakdown before you confirm.</Text>
        <View className="h-4" />

        <View className="flex-row items-center gap-2">
          <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
          <Text className="text-gray-700">Backend-calculated interest and fees</Text>
        </View>
        <View className="h-2" />
        <View className="flex-row items-center gap-2">
          <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
          <Text className="text-gray-700">Review before submission</Text>
        </View>
      </Card>

      <View className="flex-1" />

      <Button
        title="Continue"
        onPress={() => router.push(`/(app)/request-personal-loan?loanType=${encodeURIComponent(loanType)}` as any)}
      />
      <View className="h-3" />
      <Button title="Back" onPress={() => router.back()} />

      <View className="h-8" />
    </View>
  );
}
