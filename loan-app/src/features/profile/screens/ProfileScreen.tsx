import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { APP_NAME } from '../../../config/constants';
import { useClerk } from '@clerk/clerk-expo';
import { initials } from '../../../utils/format';
import { useSecurity } from '../../security/security.session';

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

function kycSubtitle(status: string) {
  if (status === 'APPROVED') return 'Your account is verified.';
  if (status === 'REJECTED') return 'Your submission was rejected. Please resubmit clear images.';
  return 'We’re reviewing your documents (24-48 hours)';
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
  const router = useRouter();
  const { signOut } = useClerk();
  const { appData } = useSecurity();

  const me = appData?.me;
  const kyc = appData?.kyc;

  const isVerified = kyc?.status === 'APPROVED';

  const creditScore = me?.creditScore ?? 0;

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="px-5 pb-10 pt-8">
      <View className="flex-row items-center gap-4">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-blue-700">
          <Text className="text-2xl font-semibold text-white">{initials(me?.fullName)}</Text>
        </View>

        <View className="flex-1">
          <Text className="text-xl font-semibold text-gray-900">{me?.fullName ?? 'User'}</Text>

          <View className="h-2" />

          <Text className="text-gray-600">{me?.phone ?? ''}</Text>

          <View className="h-2" />

          {isVerified ? (
            <View className="flex-row items-center gap-2">
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text className="font-semibold text-emerald-600">Verified Account</Text>
            </View>
          ) : (
            <View className="h-5" />
          )}
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

      <Pressable onPress={() => router.push('/(app)/kyc')} accessibilityRole="button" className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <Ionicons name="shield-checkmark" size={22} color="#B45309" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">KYC Verification</Text>
            <View className="h-1" />
            <View className="flex-row items-center gap-2">
              <Ionicons name="time" size={14} color="#B45309" />
              <Text className="font-semibold text-amber-700">
                {kyc && kyc.hasSubmission ? kycTitle(kyc.status) : 'Upload your KYC and get huge loans'}
              </Text>
            </View>
            <View className="h-1" />
            <Text className="text-gray-600">
              {kyc && kyc.hasSubmission ? kycSubtitle(kyc.status) : 'Submit your ID and selfie to unlock higher loan limits.'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#B45309" />
        </View>
      </Pressable>

      <View className="h-5" />

      <View className="gap-3">
        <MenuItem
          icon="person-outline"
          color="bg-blue-50"
          title="Personal Information"
          onPress={() => router.push('/(app)/personal-information')}
        />
        <MenuItem
          icon="trending-up-outline"
          color="bg-emerald-50"
          title="Credit Score"
          onPress={() => router.push({ pathname: '/(app)/placeholder', params: { title: 'Credit Score' } } as any)}
        />
        <MenuItem
          icon="shield-outline"
          color="bg-purple-50"
          title="Security Settings"
          onPress={() => router.push('/(app)/security-settings')}
        />
        <MenuItem
          icon="card-outline"
          color="bg-emerald-50"
          title="Mobile Money"
          onPress={() => router.push('/(app)/mobile-money')}
        />
        <MenuItem
          icon="help-circle-outline"
          color="bg-orange-50"
          title="Help & Support"
          onPress={() => router.push('/(app)/help-support')}
        />
        <MenuItem
          icon="document-text-outline"
          color="bg-gray-100"
          title="Terms & Privacy"
          onPress={() => router.push('/(app)/terms-privacy')}
        />
        <MenuItem icon="log-out-outline" color="bg-red-50" title="Log Out" danger onPress={() => void signOut()} />
      </View>

      <View className="h-8" />

      <Text className="text-center text-gray-400">{APP_NAME} v1.0.0</Text>
    </ScrollView>
  );
}
