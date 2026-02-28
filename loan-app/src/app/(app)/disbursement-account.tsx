import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useSecurity } from '../../features/security/security.session';
import { getSecureItem } from '../../services/secure.storage';

type Network = 'MTN' | 'Telecel' | 'AirtelTigo';

type MoMoAccount = {
  id: string;
  network: Network;
  number: string;
  name: string;
  isPrimary?: boolean;
};

function getParam(value: unknown) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function networkStyle(n: Network) {
  if (n === 'MTN') return { bg: 'bg-yellow-100', iconBg: 'bg-yellow-500' };
  if (n === 'Telecel') return { bg: 'bg-red-100', iconBg: 'bg-red-500' };
  return { bg: 'bg-blue-100', iconBg: 'bg-blue-500' };
}

function maskNumber(num: string) {
  const trimmed = num.replace(/\s+/g, '');
  if (trimmed.length <= 6) return trimmed;
  return `${trimmed.slice(0, 3)}****${trimmed.slice(-3)}`;
}

export default function DisbursementAccountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { appData } = useSecurity();

  const loanTypeRaw = getParam(params.loanType);
  const loanType = typeof loanTypeRaw === 'string' && loanTypeRaw.trim().length > 0 ? loanTypeRaw : 'BUSINESS';

  const amountRaw = getParam(params.amount);
  const durationDaysRaw = getParam(params.durationDays);
  const repaymentFrequencyRaw = getParam(params.repaymentFrequency);
  const totalInstallmentsRaw = getParam(params.totalInstallments);

  const amount = typeof amountRaw === 'string' ? amountRaw : '';
  const durationDays = typeof durationDaysRaw === 'string' ? durationDaysRaw : '';
  const repaymentFrequency = typeof repaymentFrequencyRaw === 'string' ? repaymentFrequencyRaw : '';
  const totalInstallments = typeof totalInstallmentsRaw === 'string' ? totalInstallmentsRaw : '';

  const profile = appData?.profileMe.profile;

  const userId = appData?.me?.id ?? 'anonymous';
  const storageKey = `momo_accounts_v1_${userId}`;

  const [accounts, setAccounts] = useState<MoMoAccount[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const raw = await getSecureItem(storageKey);
        const parsed = raw ? (JSON.parse(raw) as MoMoAccount[]) : [];

        const profilePrimary: MoMoAccount | null =
          profile?.mobileNetwork && profile?.mobileNumber && profile?.mobileName
            ? {
                id: 'profile_primary',
                network: profile.mobileNetwork,
                number: profile.mobileNumber,
                name: profile.mobileName,
                isPrimary: true,
              }
            : null;

        const normalized = Array.isArray(parsed) ? parsed.filter((a) => a && typeof a.id === 'string') : [];
        let next = normalized;

        if (profilePrimary) {
          const idx = next.findIndex((a) => a.id === 'profile_primary');
          if (idx >= 0) {
            next = next.map((a) => (a.id === 'profile_primary' ? profilePrimary : a));
          } else {
            next = [profilePrimary, ...next];
          }

          next = next.map((a) => ({ ...a, isPrimary: a.id === 'profile_primary' }));
        } else if (next.length > 0 && !next.some((a) => a.isPrimary)) {
          next = next.map((a, i) => ({ ...a, isPrimary: i === 0 }));
        }

        if (!cancelled) {
          setAccounts(next);
          setLoaded(true);
          if (next.length > 0) {
            const primary = next.find((a) => a.isPrimary) ?? next[0];
            setSelectedId(primary?.id ?? '');
          }
        }
      } catch {
        if (!cancelled) {
          setAccounts([]);
          setLoaded(true);
          setSelectedId('');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile?.mobileName, profile?.mobileNetwork, profile?.mobileNumber, storageKey]);

  useEffect(() => {
    if (accounts.length > 0 && !accounts.some((a) => a.id === selectedId)) {
      const primary = accounts.find((a) => a.isPrimary) ?? accounts[0];
      setSelectedId(primary?.id ?? '');
    }
  }, [accounts, selectedId]);

  const selected = accounts.find((a) => a.id === selectedId) ?? null;

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-28 pt-12">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </Pressable>
          <Text className="text-xl font-semibold text-gray-900">Disbursement Account</Text>
        </View>

        <View className="h-6" />

        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-blue-100">
          <Ionicons name="phone-portrait-outline" size={20} color="#2563EB" />
        </View>

        <View className="h-4" />

        <Text className="text-2xl font-semibold text-gray-900">Where should we send your loan?</Text>
        <View className="h-1" />
        <Text className="text-gray-500">Select or add a mobile money account to receive your funds</Text>

        <View className="h-6" />

        <Text className="text-xs font-semibold text-gray-600">Your Accounts</Text>
        <View className="h-3" />

        <View className="gap-3">
          {loaded && accounts.length === 0 ? (
            <View className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <Text className="text-sm font-semibold text-gray-900">No accounts yet</Text>
              <View className="h-1" />
              <Text className="text-xs text-gray-600">Add a mobile money account to receive your loan disbursement.</Text>
            </View>
          ) : null}

          {accounts.map((a) => {
            const active = selectedId === a.id;
            const style = networkStyle(a.network);
            return (
              <Pressable
                key={a.id}
                onPress={() => setSelectedId(a.id)}
                accessibilityRole="button"
                className={`rounded-2xl border bg-white p-4 ${active ? 'border-blue-700 bg-blue-50' : 'border-gray-200'}`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className={`h-10 w-10 items-center justify-center rounded-2xl ${style.iconBg}`}>
                      <Ionicons name="phone-portrait-outline" size={18} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text className="text-sm font-semibold text-gray-900">{a.network} Mobile Money</Text>
                      <View className="h-1" />
                      <Text className="text-xs text-gray-600">{maskNumber(a.number)}</Text>
                      <Text className="text-[10px] text-gray-400">{a.name}</Text>
                    </View>
                  </View>

                  {active ? (
                    <View className="h-6 w-6 items-center justify-center rounded-full border border-blue-700 bg-blue-700">
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                  ) : (
                    <View className="h-6 w-6 rounded-full border border-gray-300" />
                  )}
                </View>
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => {
              router.push('/(app)/mobile-money' as any);
            }}
            accessibilityRole="button"
            className="items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-4"
          >
            <Text className="text-sm font-semibold text-blue-700">+ Add New Account</Text>
          </Pressable>

          <Card className="rounded-2xl border-blue-100 bg-blue-50">
            <Text className="text-xs text-blue-700">Note: Funds will be disbursed to the selected mobile money account within 5-10 minutes after approval.</Text>
          </Card>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-5 pb-8 pt-4">
        <Button
          title="Continue"
          onPress={() => {
            if (!selected) {
              Alert.alert('Disbursement', 'Please select an account');
              return;
            }
            router.replace(
              `/(app)/loan-processing?loanType=${encodeURIComponent(loanType)}&amount=${encodeURIComponent(
                String(amount),
              )}&durationDays=${encodeURIComponent(String(durationDays))}&repaymentFrequency=${encodeURIComponent(
                String(repaymentFrequency),
              )}&totalInstallments=${encodeURIComponent(String(totalInstallments))}` as any,
            );
          }}
        />
      </View>
    </View>
  );
}
