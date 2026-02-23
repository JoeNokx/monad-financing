import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '../../components/ui/Button';

export default function AboutMonadFinancingScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-5 pb-10 pt-12">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-xl font-semibold text-gray-900">About MONaD Financing</Text>
      </View>

      <View className="h-6" />

      <Text className="text-base leading-6 text-gray-700">
        {"MONaD Financing is Ghana's leading digital lending platform, committed to providing fast, secure, and accessible financial solutions to individuals and businesses across the country. Founded in 2024, we understand the challenges Ghanaians face when trying to access traditional banking services and loans.\n\nOur mission is to democratize access to credit by leveraging technology to make the lending process simple, transparent, and instant. Whether you need funds for personal emergencies, business expansion, or any other financial need, MONaD Financing is here to support your journey.\n\nWe pride ourselves on our commitment to:\n\nInstant loan approval and disbursement within minutes\nCompetitive interest rates tailored to your needs\nFlexible repayment terms that work with your schedule\nBank-level security to protect your personal information\n24/7 customer support via WhatsApp and in-app chat\nNo hidden fees or surprise charges\n\nMONaD Financing is licensed and regulated by the Bank of Ghana, ensuring that all our operations meet the highest standards of financial service provision. We are committed to responsible lending practices and work closely with our customers to ensure sustainable financial solutions.\n\nJoin thousands of satisfied customers who trust MONaD Financing for their financial needs. Download the app today and experience the future of lending in Ghana!"}
      </Text>

      <View className="h-10" />

      <Button title="Got it" onPress={() => router.back()} />
    </ScrollView>
  );
}
