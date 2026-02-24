import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useSecurity } from '../../security/security.session';
import { initials } from '../../../utils/format';

function Field(props: { label: string; value?: string | null }) {
  return (
    <View>
      <Text className="text-sm font-semibold text-gray-700">{props.label}</Text>
      <View className="h-2" />
      <View className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
        <Text className="text-gray-900">{props.value && props.value.trim().length > 0 ? props.value : '—'}</Text>
      </View>
    </View>
  );
}

function Section(props: { title: string; children: any }) {
  return (
    <View className="rounded-2xl border border-gray-100 bg-white p-5">
      <Text className="text-base font-semibold text-gray-900">{props.title}</Text>
      <View className="h-4" />
      <View className="gap-4">{props.children}</View>
    </View>
  );
}

export default function PersonalInformationScreen() {
  const router = useRouter();
  const { appData } = useSecurity();

  const me = appData?.me;
  const profile = appData?.profileMe.profile;

  const fullName = profile?.fullName ?? me?.fullName ?? '';

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-5 pb-10 pt-12">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </Pressable>
          <Text className="text-xl font-semibold text-gray-900">Personal Information</Text>
        </View>

        <Pressable onPress={() => router.push('/(setup)/about')} accessibilityRole="button">
          <Text className="font-semibold text-purple-700">Edit</Text>
        </Pressable>
      </View>

      <View className="h-10" />

      <View className="items-center">
        <View className="h-28 w-28 items-center justify-center rounded-full bg-purple-600">
          <Text className="text-4xl font-semibold text-white">{initials(fullName) || 'U'}</Text>
        </View>
      </View>

      <View className="h-10" />

      <View className="gap-4">
        <Section title="User registration details">
          <Field label="Full Name" value={fullName} />
          <Field label="Email Address" value={me?.email ?? ''} />
          <Field label="Phone Number" value={me?.phone ?? profile?.phoneNumber ?? ''} />
        </Section>

        <Section title="First Stepper form">
          <Field label="Phone Number" value={profile?.phoneNumber ?? ''} />
          <Field label="Date of Birth" value={profile?.dateOfBirth ?? ''} />
          <Field label="Gender" value={profile?.gender ?? ''} />
          <Field label="Address" value={profile?.address ?? ''} />
          <Field label="Referral Code" value={profile?.referralCode ?? ''} />
        </Section>

        <Section title="Second Stepper form">
          <Field label="Emergency Name" value={profile?.emergencyName ?? ''} />
          <Field label="Emergency Phone" value={profile?.emergencyPhone ?? ''} />
          <Field label="Emergency Relationship" value={profile?.emergencyRelationship ?? ''} />
        </Section>
      </View>
    </ScrollView>
  );
}
