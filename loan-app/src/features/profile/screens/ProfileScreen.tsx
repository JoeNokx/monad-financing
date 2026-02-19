import { useClerk } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { APP_NAME } from '../../../config/constants';
import { useApiClient } from '../../../hooks/useApiClient';
import { useQuery } from '../../../hooks/useQuery';
import type { ApiEnvelope } from '../../../types/api';
import type { KycStatusResponse } from '../../../types/kyc';
import type { User } from '../../../types/user';
import { initials } from '../../../utils/format';

function scoreLabel(score: number) {
  if (score >= 750) return 'Excellent';
  if (score >= 650) return 'Good';
  if (score >= 500) return 'Fair';
  return 'Poor';
}

function kycTitle(status: string) {
  if (status === 'APPROVED') return 'Verified';
  if (status === 'REJECTED') return 'Verification Failed';
  return 'Verification in Progress';
}

function MenuItem(props: { icon: any; color: string; title: string; onPress?: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={props.onPress} className="flex-row items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-4">
      <View className="flex-row items-center gap-3">
        <View className={`h-12 w-12 items-center justify-center rounded-full ${props.color}`}>
          <Ionicons name={props.icon} size={22} color={props.danger ? '#DC2626' : '#111827'} />
        </View>
        <Text className={`text-base font-semibold ${props.danger ? 'text-red-600' : 'text-gray-900'}`}>{props.title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const api = useApiClient();
  const { signOut } = useClerk();

  const meQuery = useQuery(async () => {
    return api.request<ApiEnvelope<User>>({ path: '/api/users/me' });
  }, [api]);

  const kycQuery = useQuery(async () => {
    return api.request<ApiEnvelope<KycStatusResponse>>({ path: '/api/kyc/status' });
  }, [api]);

  const me = meQuery.data?.data;
  const kyc = kycQuery.data?.data;

  const isVerified = kyc?.status === 'APPROVED';

  const creditScore = me?.creditScore ?? 0;

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="px-5 pb-10 pt-8">
      {meQuery.loading ? <Text className="text-gray-500">Loading...</Text> : null}
      {meQuery.error ? <Text className="text-red-600">{meQuery.error}</Text> : null}

      {me ? (
        <>
          <View className="flex-row items-center gap-4">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-blue-700">
              <Text className="text-2xl font-semibold text-white">{initials(me.fullName)}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xl font-semibold text-gray-900">{me.fullName ?? 'User'}</Text>
              <Text className="text-gray-600">{me.phone}</Text>
              <View className="h-1" />
              {isVerified ? (
                <View className="flex-row items-center gap-2">
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text className="font-semibold text-emerald-600">Verified Account</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View className="h-5" />

          <View className="rounded-2xl border border-gray-100 bg-white p-5">
            <Text className="text-sm text-gray-500">Credit Score</Text>
            <View className="h-2" />
            <View className="flex-row items-end justify-between">
              <Text className="text-3xl font-semibold text-emerald-600">
                {creditScore} <Text className="text-base font-semibold text-gray-500">/ 850</Text>
              </Text>
              <View className="rounded-full bg-emerald-50 px-3 py-1">
                <Text className="text-xs font-semibold text-emerald-700">{scoreLabel(creditScore)}</Text>
              </View>
            </View>
          </View>

          <View className="h-4" />

          <View className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <Ionicons name="shield-checkmark" size={22} color="#B45309" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">KYC Verification</Text>
                <View className="h-1" />
                <View className="flex-row items-center gap-2">
                  <Ionicons name="time" size={14} color="#B45309" />
                  <Text className="font-semibold text-amber-700">{kycTitle(kyc?.status ?? 'PENDING')}</Text>
                </View>
                <View className="h-1" />
                <Text className="text-gray-600">We’re reviewing your documents (24-48 hours)</Text>
              </View>
            </View>
          </View>

          <View className="h-5" />

          <View className="gap-3">
            <MenuItem icon="person-outline" color="bg-blue-50" title="Personal Information" />
            <MenuItem icon="trending-up-outline" color="bg-emerald-50" title="Credit Score" />
            <MenuItem icon="shield-outline" color="bg-purple-50" title="Security Settings" />
            <MenuItem icon="card-outline" color="bg-emerald-50" title="Mobile Money" />
            <MenuItem icon="help-circle-outline" color="bg-orange-50" title="Help & Support" />
            <MenuItem icon="document-text-outline" color="bg-gray-100" title="Terms & Privacy" />
            <MenuItem icon="log-out-outline" color="bg-red-50" title="Log Out" danger onPress={() => signOut()} />
          </View>

          <View className="h-8" />

          <Text className="text-center text-gray-400">{APP_NAME} v1.0.0</Text>
        </>
      ) : null}
    </ScrollView>
  );
}
