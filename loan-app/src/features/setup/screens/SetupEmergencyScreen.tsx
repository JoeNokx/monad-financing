import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

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

export default function SetupEmergencyScreen() {
  const router = useRouter();
  const api = useApiClient();

  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canContinue = useMemo(() => {
    return emergencyName.trim().length >= 2 && emergencyPhone.trim().length >= 7 && emergencyRelationship.trim().length >= 2;
  }, [emergencyName, emergencyPhone, emergencyRelationship]);

  return (
    <View className="flex-1 bg-white px-6 pt-10">
      <StepHeader step={2} total={3} title="Emergency contact" subtitle="Who should we contact in case of emergency?" />

      <View className="h-8" />
      <View className="gap-3">
        <Input value={emergencyName} placeholder="Full name" onChangeText={setEmergencyName} />
        <Input value={emergencyPhone} placeholder="Phone number" onChangeText={setEmergencyPhone} />
        <Input value={emergencyRelationship} placeholder="Relationship" onChangeText={setEmergencyRelationship} />
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
                emergencyName: emergencyName.trim(),
                emergencyPhone: emergencyPhone.trim(),
                emergencyRelationship: emergencyRelationship.trim(),
              };

              await api.request<ApiEnvelope<ProfileMeResponse>>({ method: 'PUT', path: '/api/profile/me', body: patch });

              router.push('/(setup)/mobile-money');
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
