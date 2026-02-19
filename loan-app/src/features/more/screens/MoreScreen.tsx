import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';

function Bullet({ text }: { text: string }) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-orange-50">
        <Ionicons name="checkmark" size={16} color="#F97316" />
      </View>
      <Text className="flex-1 text-gray-700">{text}</Text>
    </View>
  );
}

function InfoCard(props: { title: string; subtitle: string; icon: any; iconBg: string; iconColor: string }) {
  return (
    <View className="flex-row items-center justify-between rounded-2xl border border-gray-100 bg-white p-5">
      <View className="flex-1 pr-4">
        <Text className="text-lg font-semibold text-gray-900">{props.title}</Text>
        <View className="h-1" />
        <Text className="text-gray-600">{props.subtitle}</Text>
      </View>
      <View className={`h-12 w-12 items-center justify-center rounded-full ${props.iconBg}`}>
        <Ionicons name={props.icon} size={22} color={props.iconColor} />
      </View>
    </View>
  );
}

export default function MoreScreen() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-5 pb-10 pt-8">
      <Text className="text-3xl font-semibold text-gray-900">More</Text>
      <View className="h-5" />

      <View className="rounded-2xl bg-purple-600 p-5">
        <Text className="text-lg font-semibold text-white">Invite friends, earn cash!</Text>
        <View className="h-2" />
        <Text className="text-white/90">Get GHS 30 for every friend who signs up with your referral code and takes a loan.</Text>
        <View className="h-4" />
        <Pressable className="rounded-full bg-white py-3">
          <Text className="text-center font-semibold text-purple-700">Invite Now</Text>
        </Pressable>
      </View>

      <View className="h-5" />

      <View className="rounded-2xl border border-gray-100 bg-white p-5">
        <Text className="text-lg font-semibold text-gray-900">Why borrow from Us?</Text>
        <View className="h-4" />
        <View className="gap-3">
          <Bullet text="Low interest rates and flexible repayment." />
          <Bullet text="Instant approval and quick cash out." />
          <Bullet text="Secure and transparent process." />
        </View>
      </View>

      <View className="h-5" />

      <InfoCard
        title="About FlexiLoan"
        subtitle="Learn more about our mission and values"
        icon="information"
        iconBg="bg-blue-50"
        iconColor="#2563EB"
      />

      <View className="h-4" />

      <InfoCard
        title="Need Help?"
        subtitle="Chat with our support team on WhatsApp"
        icon="logo-whatsapp"
        iconBg="bg-green-50"
        iconColor="#22C55E"
      />

      <View className="h-4" />

      <InfoCard
        title="FAQs"
        subtitle="Find answers to commonly asked questions"
        icon="help"
        iconBg="bg-gray-100"
        iconColor="#6B7280"
      />
    </ScrollView>
  );
}
