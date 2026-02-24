import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

type TabKey = 'terms' | 'privacy';

function TabButton(props: { active: boolean; icon: any; title: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="button"
      className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl px-3 py-3 ${props.active ? 'bg-purple-600' : 'bg-gray-100'}`}
    >
      <Ionicons name={props.icon} size={16} color={props.active ? '#FFFFFF' : '#6B7280'} />
      <Text className={`text-sm font-semibold ${props.active ? 'text-white' : 'text-gray-600'}`}>{props.title}</Text>
    </Pressable>
  );
}

function Card(props: { title: string; children: any }) {
  return (
    <View className="rounded-2xl border border-gray-100 bg-white p-5">
      <Text className="text-base font-semibold text-gray-900">{props.title}</Text>
      <View className="h-3" />
      <View className="gap-2">{props.children}</View>
    </View>
  );
}

function Bullet(props: { text: string }) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="mt-2 h-2 w-2 rounded-full bg-purple-600" />
      <Text className="flex-1 text-gray-600">{props.text}</Text>
    </View>
  );
}

export default function TermsPrivacyScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('terms');

  const termsCards = useMemo(
    () => [
      {
        title: '1. Acceptance of Terms',
        body: [
          "By accessing and using MONaD Financing's services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.",
        ],
      },
      {
        title: '2. Loan Terms',
        body: [
          'All loans are subject to approval and verification. Interest rates and repayment terms vary based on loan type, amount, and borrower’s creditworthiness.',
        ],
        bullets: ['Personal loans: Up to GH₵ 5,000', 'Business loans: Up to GH₵ 50,000', 'Interest rates: 5% - 20% based on assessment'],
      },
      {
        title: '3. Repayment Obligations',
        body: [
          'You agree to repay the loan amount plus applicable interest and fees according to the schedule provided. Late payments may incur additional fees and affect your credit score.',
        ],
      },
      {
        title: '4. User Responsibilities',
        body: [
          'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use.',
        ],
      },
      {
        title: '5. Termination',
        body: ['We reserve the right to terminate or suspend your account at any time for violations of these terms or fraudulent activity.'],
      },
    ],
    [],
  );

  const privacyCards = useMemo(
    () => [
      {
        title: '1. Information We Collect',
        body: ['We collect information that you provide directly to us, including:'],
        bullets: [
          'Personal identification (name, ID, photo)',
          'Contact information (phone, email, address)',
          'Financial information (mobile money details)',
          'Device and usage information',
        ],
      },
      {
        title: '2. How We Use Your Information',
        body: ['We use your information to:'],
        bullets: [
          'Process and approve loan applications',
          'Verify your identity and prevent fraud',
          'Communicate about your loans and account',
          'Improve our services and user experience',
        ],
      },
      {
        title: '3. Data Security',
        body: [
          'We implement industry-standard security measures to protect your personal information. All sensitive data is encrypted both in transit and at rest using bank-level encryption.',
        ],
      },
      {
        title: '4. Information Sharing',
        body: [
          'We do not sell your personal information. We may share data with credit bureaus, payment processors, and regulatory authorities as required by law or to provide our services.',
        ],
      },
      {
        title: '5. Your Rights',
        body: [
          'You have the right to access, correct, or delete your personal information. Contact our support team to exercise these rights or for any privacy concerns.',
        ],
      },
    ],
    [],
  );

  const data = tab === 'terms' ? termsCards : privacyCards;

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="px-5 pb-10 pt-12">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-xl font-semibold text-gray-900">Terms & Privacy</Text>
      </View>

      <View className="h-5" />

      <View className="flex-row gap-3 rounded-2xl bg-white p-2">
        <TabButton active={tab === 'terms'} icon="document-text-outline" title="Terms of Service" onPress={() => setTab('terms')} />
        <TabButton active={tab === 'privacy'} icon="shield-outline" title="Privacy Policy" onPress={() => setTab('privacy')} />
      </View>

      <View className="h-6" />

      <Text className="text-lg font-semibold text-gray-900">{tab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}</Text>
      <View className="h-2" />
      <Text className="text-gray-500">Last Updated: January 2026</Text>

      <View className="h-6" />

      <View className="gap-4">
        {data.map((c) => (
          <Card key={c.title} title={c.title}>
            {c.body.map((t) => (
              <Text key={t} className="text-gray-600">
                {t}
              </Text>
            ))}
            {c.bullets ? (
              <View className="mt-2 gap-2">
                {c.bullets.map((b) => (
                  <Bullet key={b} text={b} />
                ))}
              </View>
            ) : null}
          </Card>
        ))}

        {tab === 'privacy' ? (
          <View className="rounded-2xl bg-purple-50 p-5">
            <Text className="text-sm font-semibold text-gray-900">Questions about Privacy?</Text>
            <View className="h-2" />
            <Text className="text-gray-600">Contact us at privacy@monadfinancing.com for any privacy-related inquiries.</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
