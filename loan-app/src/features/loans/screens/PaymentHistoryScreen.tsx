import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useApiClient } from '../../../hooks/useApiClient';
import type { ApiEnvelope } from '../../../types/api';
import type { Transaction } from '../../../types/transaction';
import { useSecurity } from '../../security/security.session';
import { formatGhs } from '../../../utils/format';

function getParam(value: unknown) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function maskMomo(num?: string | null) {
  if (!num) return '—';
  const digits = num.replace(/\D/g, '');
  if (digits.length < 7) return num;
  const first = digits.slice(0, 3);
  const last = digits.slice(-4);
  return `${first} XXX ${last}`;
}

export default function PaymentHistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const api = useApiClient();
  const { appData } = useSecurity();

  const loanIdRaw = getParam(params.loanId);
  const loanId = typeof loanIdRaw === 'string' ? loanIdRaw : '';

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Transaction[]>([]);

  const momoNumber = appData?.profileMe.profile?.mobileNumber ?? '';

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        setLoading(true);
        const res = await api.request<ApiEnvelope<Transaction[]>>({ path: '/api/transactions' });
        if (cancelled) return;
        const all = Array.isArray(res.data) ? res.data : [];
        const filtered = loanId ? all.filter((t) => String(t.loanId ?? '') === String(loanId)) : all;
        setItems(filtered);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [api, loanId]);

  const hasAny = items.length > 0;

  const rows = useMemo(() => {
    return items.map((t) => {
      const status = String(t.status ?? '').toUpperCase();
      const success = status === 'SUCCESS';
      return { ...t, __success: success } as any;
    });
  }, [items]);

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-5 pb-10 pt-12">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-xl font-semibold text-gray-900">Payment History</Text>
      </View>

      <View className="h-6" />

      {loading ? <Text className="text-gray-500">Loading...</Text> : null}

      {!loading && !hasAny ? (
        <View className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <Text className="text-base font-semibold text-gray-900">No payments yet</Text>
          <View className="h-1" />
          <Text className="text-gray-600">Your repayment transactions will appear here.</Text>
        </View>
      ) : null}

      <View className="gap-4">
        {rows.map((t: any) => (
          <View key={t.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <View className="flex-row items-start justify-between">
              <View className="flex-row items-center gap-3">
                <View className={`h-8 w-8 items-center justify-center rounded-full ${t.__success ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                  <Ionicons name={t.__success ? 'checkmark' : 'time-outline'} size={18} color={t.__success ? '#16A34A' : '#6B7280'} />
                </View>
                <View>
                  <Text className="text-base font-semibold text-gray-900">{formatGhs(t.amount)}</Text>
                  <View className="h-1" />
                  <Text className="text-gray-500">{formatDateTime(t.createdAt)}</Text>
                </View>
              </View>

              <View className={`rounded-full px-3 py-1 ${t.__success ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                <Text className={`text-xs font-semibold ${t.__success ? 'text-emerald-700' : 'text-gray-600'}`}>{String(t.status ?? '').toUpperCase() || 'PENDING'}</Text>
              </View>
            </View>

            <View className="h-4" />
            <View className="h-px bg-gray-100" />
            <View className="h-4" />

            <View className="flex-row items-center justify-between">
              <Text className="text-gray-500">MoMo Number</Text>
              <Text className="font-semibold text-gray-900">{maskMomo(momoNumber)}</Text>
            </View>

            <View className="h-3" />

            <View className="flex-row items-center justify-between">
              <Text className="text-gray-500">Reference</Text>
              <Text className="font-semibold text-gray-900">{t.paystackRef ?? t.id}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
