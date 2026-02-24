import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useSecurity } from '../../security/security.session';
import { useApiClient } from '../../../hooks/useApiClient';
import type { ApiEnvelope } from '../../../types/api';
import type { ProfileMeResponse, ProfileUpsertPatch } from '../../../types/profile';

function StepHeader(props: { step: number; total: number; title: string; subtitle: string }) {
  const pct = Math.max(0, Math.min(1, props.step / props.total));

  return (
    <View>
      <Text className="text-sm font-semibold text-gray-500">Step {props.step} of {props.total}</Text>
      <View className="h-2" />
      <View className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <View style={{ width: `${pct * 100}%` }} className="h-2 bg-blue-600" />
      </View>
      <View className="h-6" />
      <Text className="text-2xl font-semibold text-gray-900">{props.title}</Text>
      <View className="h-2" />
      <Text className="text-gray-600">{props.subtitle}</Text>
    </View>
  );
}

export default function SetupAboutScreen() {
  const router = useRouter();
  const api = useApiClient();

  const { appData, setAppData } = useSecurity();
  const existing = appData?.profileMe.profile;

  const [fullName, setFullName] = useState(() => existing?.fullName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(() => existing?.phoneNumber ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(() => existing?.dateOfBirth ?? '');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>(() => (existing?.gender as any) ?? '');
  const [address, setAddress] = useState(() => existing?.address ?? '');
  const [referralCode, setReferralCode] = useState(() => existing?.referralCode ?? '');
  const [submitting, setSubmitting] = useState(false);

  const canContinue = useMemo(() => {
    return phoneNumber.trim().length >= 7 && dateOfBirth.trim().length >= 8 && gender !== '' && address.trim().length >= 3;
  }, [phoneNumber, dateOfBirth, gender, address]);

  return (
    <View className="flex-1 bg-white px-6 pt-10">
      <StepHeader step={1} total={3} title="About yourself" subtitle="Tell us a bit about you." />

      <View className="h-8" />
      <View className="gap-3">
        <Input value={fullName} placeholder="Full name (optional)" onChangeText={setFullName} />
        <Input value={phoneNumber} placeholder="Phone number" onChangeText={setPhoneNumber} />
        <Input value={dateOfBirth} placeholder="Date of birth (YYYY-MM-DD)" onChangeText={setDateOfBirth} />

        <View>
          <Text className="mb-2 text-sm font-semibold text-gray-700">Gender</Text>
          <View className="flex-row gap-2">
            {(['male', 'female', 'other'] as const).map((g) => {
              const active = gender === g;
              return (
                <Pressable
                  key={g}
                  onPress={() => setGender(g)}
                  className={`rounded-full px-4 py-2 ${active ? 'bg-blue-600' : 'bg-gray-100'}`}
                >
                  <Text className={`font-semibold ${active ? 'text-white' : 'text-gray-700'}`}>{g}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Input value={address} placeholder="Address" onChangeText={setAddress} />
        <Input value={referralCode} placeholder="Referral code (optional)" onChangeText={setReferralCode} />
      </View>

      <View className="flex-1" />
      <Button
        title={submitting ? 'Saving...' : 'Continue'}
        disabled={!canContinue || submitting}
        onPress={() => {
          void (async () => {
            try {
              setSubmitting(true);

              const patch: ProfileUpsertPatch = {
                ...(fullName.trim() ? { fullName: fullName.trim() } : {}),
                phoneNumber: phoneNumber.trim(),
                ...(referralCode.trim() ? { referralCode: referralCode.trim() } : {}),
                dateOfBirth: dateOfBirth.trim(),
                gender: gender as any,
                address: address.trim(),
              };

              const res = await api.request<ApiEnvelope<ProfileMeResponse>>({
                method: 'PUT',
                path: '/api/profile/me',
                body: patch,
              });

              setAppData((prev) => {
                if (!prev) return prev;
                return { ...prev, profileMe: res.data };
              });

              if (!res.data.profile) {
                Alert.alert('Setup', 'Failed to save profile');
                return;
              }

              router.push('/(setup)/emergency');
            } catch (e: any) {
              Alert.alert('Setup', e?.message ?? 'Failed to save');
            } finally {
              setSubmitting(false);
            }
          })();
        }}
      />
      <View className="h-8" />
    </View>
  );
}
