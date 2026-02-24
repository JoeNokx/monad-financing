import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';

const SUPPORT_PHONE_E164 = '+233200000000';
const SUPPORT_PHONE_LABEL = '+233 20 000 0000';
const SUPPORT_EMAIL = 'support@monadfinancing.com';

async function openUrl(url: string) {
  const can = await Linking.canOpenURL(url);
  if (!can) throw new Error('Unable to open link');
  await Linking.openURL(url);
}

async function openWhatsApp() {
  const phone = SUPPORT_PHONE_E164.replace('+', '');
  const message = encodeURIComponent('Hi MONaD Financing Support, I need help.');
  const appUrl = `whatsapp://send?phone=${phone}&text=${message}`;
  const webUrl = `https://wa.me/${phone}?text=${message}`;

  try {
    await openUrl(appUrl);
  } catch {
    await openUrl(webUrl);
  }
}

function ContactItem(props: {
  title: string;
  subtitle: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={props.onPress} accessibilityRole="button" className="flex-row items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-4">
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

      <Ionicons name="open-outline" size={18} color="#9CA3AF" />
    </Pressable>
  );
}

export default function HelpSupportScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-5 pb-10 pt-12">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-xl font-semibold text-gray-900">Help & Support</Text>
      </View>

      <View className="h-6" />
      <Text className="text-sm font-semibold text-gray-700">Contact Us</Text>

      <View className="h-4" />

      <View className="gap-3">
        <ContactItem
          title="WhatsApp Support"
          subtitle="Chat with us on WhatsApp"
          icon="logo-whatsapp"
          iconBg="bg-emerald-50"
          iconColor="#16A34A"
          onPress={() => {
            void (async () => {
              try {
                await openWhatsApp();
              } catch {
                Alert.alert('WhatsApp', 'Unable to open WhatsApp.');
              }
            })();
          }}
        />

        <ContactItem
          title="Call Us"
          subtitle={SUPPORT_PHONE_LABEL}
          icon="call-outline"
          iconBg="bg-blue-50"
          iconColor="#2563EB"
          onPress={() => {
            void (async () => {
              try {
                await openUrl(`tel:${SUPPORT_PHONE_E164}`);
              } catch {
                Alert.alert('Call', 'Unable to open phone dialer.');
              }
            })();
          }}
        />

        <ContactItem
          title="Email Support"
          subtitle={SUPPORT_EMAIL}
          icon="mail-outline"
          iconBg="bg-purple-50"
          iconColor="#7C3AED"
          onPress={() => {
            void (async () => {
              try {
                await openUrl(`mailto:${SUPPORT_EMAIL}`);
              } catch {
                Alert.alert('Email', 'Unable to open email app.');
              }
            })();
          }}
        />
      </View>

      <View className="h-6" />

      <View className="rounded-2xl bg-purple-50 p-5">
        <Text className="text-sm font-semibold text-gray-700">Support Hours</Text>
        <View className="h-3" />
        <Text className="text-gray-600">Monday - Friday: 8:00 AM - 6:00 PM GMT</Text>
        <View className="h-2" />
        <Text className="text-gray-600">Saturday: 9:00 AM - 2:00 PM GMT</Text>
        <View className="h-2" />
        <Text className="text-gray-600">Sunday: Closed</Text>
      </View>
    </ScrollView>
  );
}
