import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
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

export default function SetupMobileMoneyScreen() {
  const router = useRouter();
  const api = useApiClient();

  const [mobileNetwork, setMobileNetwork] = useState<'MTN' | 'Telecel' | 'AirtelTigo' | ''>('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileName, setMobileName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canFinish = useMemo(() => {
    return mobileNetwork !== '' && mobileNumber.trim().length >= 7 && mobileName.trim().length >= 2;
  }, [mobileNetwork, mobileNumber, mobileName]);

  return (
    <View className="flex-1 bg-white px-6 pt-10">
      <StepHeader step={3} total={3} title="Link Mobile Money" subtitle="Add your mobile money details." />

      <View className="h-8" />
      <View className="gap-3">
        <View>
          <Text className="mb-2 text-sm font-semibold text-gray-700">Network</Text>
          <View className="flex-row gap-2">
            {(['MTN', 'Telecel', 'AirtelTigo'] as const).map((n) => {
              const active = mobileNetwork === n;
              return (
                <Pressable
                  key={n}
                  onPress={() => setMobileNetwork(n)}
                  className={`rounded-full px-4 py-2 ${active ? 'bg-blue-600' : 'bg-gray-100'}`}
                >
                  <Text className={`font-semibold ${active ? 'text-white' : 'text-gray-700'}`}>{n}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Input value={mobileNumber} placeholder="Mobile money number" onChangeText={setMobileNumber} />
        <Input value={mobileName} placeholder="Account name" onChangeText={setMobileName} />
      </View>

      <View className="flex-1" />
      <Button
        title={submitting ? 'Saving...' : 'Finish'}
        disabled={!canFinish || submitting}
        onPress={() => {
          void (async () => {
            try {
              setSubmitting(true);

              const patch: ProfileUpsertPatch = {
                mobileNetwork: mobileNetwork as any,
                mobileNumber: mobileNumber.trim(),
                mobileName: mobileName.trim(),
              };

              const res = await api.request<ApiEnvelope<ProfileMeResponse>>({ method: 'PUT', path: '/api/profile/me', body: patch });

              if (!res.data.isComplete) {
                Alert.alert('Setup', 'Please complete all required fields.');
                return;
              }

              router.replace('/(app)');
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
