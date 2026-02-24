import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Input } from '../../../components/ui/Input';
import { useApiClient } from '../../../hooks/useApiClient';
import type { ApiEnvelope } from '../../../types/api';
import type { Loan } from '../../../types/loan';
import { useSecurity } from '../../security/security.session';
import { formatGhs, toNumber } from '../../../utils/format';

const MIN_PARTIAL_PAYMENT = 500;

function getParam(value: unknown) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function formatDateLabel(iso?: string | null) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function maskMomo(num?: string | null) {
  if (!num) return '—';
  const digits = num.replace(/\D/g, '');
  if (digits.length < 7) return num;
  const first = digits.slice(0, 3);
  const last = digits.slice(-4);
  return `${first} XXX ${last}`;
}

export default function RepayLoanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const api = useApiClient();
  const { appData, refreshAppData } = useSecurity();

  const loanIdRaw = getParam(params.loanId);
  const loanId = typeof loanIdRaw === 'string' ? loanIdRaw : '';

  const loans: Loan[] = appData?.loans ?? [];
  const loan = loans.find((l) => String(l.id) === String(loanId));

  const outstanding = loan ? toNumber(loan.remainingBalance) : 0;
  const dueDate = loan?.dueDate ?? null;

  const momoNetwork = appData?.profileMe.profile?.mobileNetwork ?? 'MTN';
  const momoNumber = appData?.profileMe.profile?.mobileNumber ?? '';

  const [mode, setMode] = useState<'full' | 'partial'>('partial');
  const [amountText, setAmountText] = useState(String(MIN_PARTIAL_PAYMENT));
  const [submitting, setSubmitting] = useState(false);

  const minPartial = useMemo(() => Math.min(MIN_PARTIAL_PAYMENT, Math.max(outstanding, 0)), [outstanding]);

  const amount = useMemo(() => {
    if (mode === 'full') return outstanding;
    const n = Number(amountText);
    if (!Number.isFinite(n)) return 0;
    return n;
  }, [amountText, mode, outstanding]);

  const remainingAfter = useMemo(() => {
    const v = Math.max(outstanding - amount, 0);
    return v;
  }, [amount, outstanding]);

  const valid = useMemo(() => {
    if (!loan) return false;
    if (outstanding <= 0) return false;
    if (mode === 'full') return true;
    if (amount < minPartial) return false;
    if (amount > outstanding) return false;
    return true;
  }, [amount, loan, minPartial, mode, outstanding]);

  if (!loan) {
    return (
      <View className="flex-1 bg-white px-5 pt-12">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </Pressable>
          <Text className="text-xl font-semibold text-gray-900">Repay Loan</Text>
        </View>
        <View className="h-8" />
        <Text className="text-gray-600">We couldn’t find that loan.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-5 pb-10 pt-12">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-xl font-semibold text-gray-900">Repay Loan</Text>
      </View>

      <View className="h-6" />

      <View className="rounded-3xl bg-blue-700 p-5">
        <Text className="text-white/80">Outstanding Balance</Text>
        <View className="h-2" />
        <Text className="text-4xl font-semibold text-white">{formatGhs(outstanding)}</Text>
        <View className="h-4" />
        <View className="flex-row items-center gap-2">
          <Ionicons name="information-circle-outline" size={16} color="#E5E7EB" />
          <Text className="text-white/80">Due: {formatDateLabel(dueDate)}</Text>
        </View>
      </View>

      <View className="h-6" />

      <Text className="text-sm font-semibold text-gray-700">Payment Type</Text>
      <View className="h-3" />

      <View className="flex-row gap-3">
        <Pressable
          onPress={() => setMode('full')}
          accessibilityRole="button"
          className={`flex-1 rounded-2xl border px-4 py-4 ${mode === 'full' ? 'border-blue-700 bg-blue-50' : 'border-gray-200 bg-white'}`}
        >
          <Text className={`text-center text-sm font-semibold ${mode === 'full' ? 'text-blue-700' : 'text-gray-700'}`}>Pay Full</Text>
          <View className="h-2" />
          <Text className="text-center text-xl font-semibold text-gray-900">{formatGhs(outstanding)}</Text>
        </Pressable>

        <Pressable
          onPress={() => setMode('partial')}
          accessibilityRole="button"
          className={`flex-1 rounded-2xl border px-4 py-4 ${mode === 'partial' ? 'border-blue-700 bg-blue-50' : 'border-gray-200 bg-white'}`}
        >
          <Text className={`text-center text-sm font-semibold ${mode === 'partial' ? 'text-blue-700' : 'text-gray-700'}`}>Pay Partial</Text>
          <View className="h-2" />
          <Text className="text-center text-sm font-semibold text-gray-900">Min: {formatGhs(minPartial)}</Text>
        </Pressable>
      </View>

      {mode === 'partial' ? (
        <>
          <View className="h-6" />
          <Text className="text-sm font-semibold text-gray-700">Enter Amount</Text>
          <View className="h-3" />
          <Input value={amountText} placeholder={`Min. ${formatGhs(minPartial)}`} onChangeText={setAmountText} />
          <View className="h-2" />
          <Text className="text-gray-500">Minimum payment: {formatGhs(minPartial)}</Text>
        </>
      ) : null}

      <View className="h-6" />

      <Text className="text-sm font-semibold text-gray-700">Payment Method</Text>
      <View className="h-3" />

      <View className="flex-row items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-4">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 rounded-full bg-yellow-400" />
          <View>
            <Text className="text-base font-semibold text-gray-900">{momoNetwork} Mobile Money</Text>
            <View className="h-1" />
            <Text className="text-gray-500">{maskMomo(momoNumber)}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>

      <View className="h-6" />

      <View className="rounded-2xl border border-gray-100 bg-white p-5">
        <Text className="text-base font-semibold text-gray-900">Payment Summary</Text>
        <View className="h-4" />

        <View className="flex-row items-center justify-between">
          <Text className="text-gray-500">Payment Amount</Text>
          <Text className="font-semibold text-gray-900">{formatGhs(amount)}</Text>
        </View>

        <View className="h-3" />

        <View className="flex-row items-center justify-between">
          <Text className="text-gray-500">Processing Fee</Text>
          <Text className="font-semibold text-gray-900">Free</Text>
        </View>

        <View className="h-3" />

        <View className="h-px bg-gray-100" />

        <View className="h-3" />

        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-gray-900">Total</Text>
          <Text className="text-base font-semibold text-blue-700">{formatGhs(amount)}</Text>
        </View>

        {mode === 'partial' ? (
          <>
            <View className="h-3" />
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-500">Remaining after payment</Text>
              <Text className="font-semibold text-gray-900">{formatGhs(remainingAfter)}</Text>
            </View>
          </>
        ) : null}
      </View>

      {mode === 'full' ? (
        <>
          <View className="h-4" />
          <View className="rounded-2xl bg-emerald-50 p-4">
            <View className="flex-row items-start gap-3">
              <View className="h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                <Ionicons name="checkmark" size={16} color="#16A34A" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-emerald-800">Early Payment Bonus!</Text>
                <View className="h-1" />
                <Text className="text-emerald-800/80">You’ll save on interest by paying early.</Text>
              </View>
            </View>
          </View>
        </>
      ) : null}

      <View className="h-8" />

      <Pressable
        accessibilityRole="button"
        disabled={!valid || submitting}
        onPress={() => {
          void (async () => {
            try {
              if (!valid) return;
              setSubmitting(true);
              await api.request<ApiEnvelope<unknown>>({ method: 'POST', path: `/api/loans/${loan.id}/repay`, body: { amount } });
              refreshAppData();
              Alert.alert('Payment', 'Payment successful');
              router.replace(`/(app)/loan-details?loanId=${encodeURIComponent(String(loan.id))}` as any);
            } catch (e: any) {
              Alert.alert('Payment', e?.message ?? 'Payment failed');
            } finally {
              setSubmitting(false);
            }
          })();
        }}
        className={`rounded-full py-4 ${!valid || submitting ? 'bg-gray-300' : 'bg-blue-700'}`}
      >
        <Text className="text-center text-base font-semibold text-white">{submitting ? 'Processing...' : `Pay ${formatGhs(amount)}`}</Text>
      </Pressable>
    </ScrollView>
  );
}
