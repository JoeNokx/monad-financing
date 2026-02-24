import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';

import { Button } from '../../../components/ui/Button';
import { useApiClient } from '../../../hooks/useApiClient';
import { useQuery } from '../../../hooks/useQuery';
import type { ApiEnvelope } from '../../../types/api';
import type { ProfileMeResponse } from '../../../types/profile';

function nextRouteFromProfile(res: ProfileMeResponse | null) {
  const p = res?.profile;
  if (!p) return '/(setup)/about';

  if (!p.phoneNumber || !p.dateOfBirth || !p.gender || !p.address) return '/(setup)/about';
  if (!p.emergencyName || !p.emergencyPhone || !p.emergencyRelationship) return '/(setup)/emergency';
  if (!p.mobileNetwork || !p.mobileNumber || !p.mobileName) return '/(setup)/mobile-money';

  return '/(app)';
}

export default function SetupIndexScreen() {
  const router = useRouter();
  const api = useApiClient();
  const lastNextRef = useRef<string | null>(null);

  const query = useQuery(async () => {
    return api.request<ApiEnvelope<ProfileMeResponse>>({ path: '/api/profile/me' });
  }, [api]);

  useEffect(() => {
    if (query.loading || query.error) return;

    const next = nextRouteFromProfile(query.data?.data ?? null);
    if (lastNextRef.current === next) return;
    lastNextRef.current = next;
    router.replace(next);
  }, [query.loading, query.error, query.data, router]);

  if (query.loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-base font-semibold text-gray-900">Loading setup...</Text>
      </View>
    );
  }

  if (query.error) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-base font-semibold text-gray-900">Unable to load setup</Text>
        <View className="h-2" />
        <Text className="text-center text-gray-600">{query.error}</Text>
        <View className="h-6" />
        <Button title="Retry" onPress={query.refetch} />
      </View>
    );
  }

  return null;
}
