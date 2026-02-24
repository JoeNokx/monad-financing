import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useApiClient } from '../../hooks/useApiClient';
import { useQuery } from '../../hooks/useQuery';
import type { ApiEnvelope } from '../../types/api';
import type { LoanQuote } from '../../types/loan';
import { formatGhs } from '../../utils/format';

function getParam(value: unknown) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function toNumber(value: unknown) {
  const v = Array.isArray(value) ? value[0] : value;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export default function ReviewConfirmLoanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const api = useApiClient();

  const loanTypeRaw = getParam(params.loanType);
  const loanType = typeof loanTypeRaw === 'string' && loanTypeRaw.trim().length > 0 ? loanTypeRaw : 'PERSONAL';

  const amount = toNumber(params.amount);
  const durationDays = Math.floor(toNumber(params.durationDays));

  const [submitting, setSubmitting] = useState(false);

  const { data, error, loading, refetch } = useQuery(async () => {
    return api.request<ApiEnvelope<LoanQuote>>({
      method: 'POST',
      path: '/api/loans/quote',
      body: { loanType, amount, durationDays },
    });
  }, [api, loanType, amount, durationDays]);

  const quote = data?.data ?? null;

  const canSubmit = useMemo(() => {
    return Boolean(quote) && !loading && !error && !submitting;
  }, [quote, loading, error, submitting]);

  return (
    <View className="flex-1 bg-white px-5 pt-12">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-xl font-semibold text-gray-900">Review & Confirm</Text>
      </View>

      <View className="h-6" />

      {loading ? <Text className="text-gray-500">Loading breakdown...</Text> : null}

      {error ? (
        <View className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <Text className="font-semibold text-red-700">Unable to load breakdown</Text>
          <View className="h-1" />
          <Text className="text-red-600">{error}</Text>
          <View className="h-4" />
          <Button title="Retry" onPress={refetch} />
        </View>
      ) : null}

      {quote ? (
        <View className="gap-4">
          <Card className="rounded-2xl border-gray-100 p-5">
            <Text className="text-base font-semibold text-gray-900">Loan Summary</Text>
            <View className="h-4" />

            <View className="flex-row items-center justify-between">
              <Text className="text-gray-600">Loan type</Text>
              <Text className="font-semibold text-gray-900">{loanType}</Text>
            </View>
            <View className="h-2" />
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-600">Duration</Text>
              <Text className="font-semibold text-gray-900">{quote.durationDays} days</Text>
            </View>
          </Card>

          <Card className="rounded-2xl border-gray-100 p-5">
            <Text className="text-base font-semibold text-gray-900">Loan Breakdown</Text>
            <View className="h-4" />

            <View className="flex-row items-center justify-between">
              <Text className="text-gray-600">Loan amount</Text>
              <Text className="font-semibold text-gray-900">{formatGhs(quote.principalAmount)}</Text>
            </View>
            <View className="h-2" />
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-600">Interest ({quote.interestRatePercent}%)</Text>
              <Text className="font-semibold text-gray-900">{formatGhs(quote.interestAmount)}</Text>
            </View>
            <View className="h-2" />
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-600">Service charge ({quote.serviceChargePercent}%)</Text>
              <Text className="font-semibold text-gray-900">{formatGhs(quote.serviceChargeAmount)}</Text>
            </View>

            <View className="h-3" />
            <View className="h-px bg-gray-100" />
            <View className="h-3" />

            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-gray-900">Total to repay</Text>
              <Text className="text-base font-semibold text-gray-900">{formatGhs(quote.totalRepayment)}</Text>
            </View>
          </Card>

          <Button
            title={submitting ? 'Preparing...' : 'Confirm'}
            disabled={!canSubmit}
            onPress={() => {
              if (!quote) return;
              setSubmitting(true);
              router.replace(
                `/(app)/loan-processing?loanType=${encodeURIComponent(loanType)}&amount=${encodeURIComponent(
                  String(amount),
                )}&durationDays=${encodeURIComponent(String(durationDays))}` as any,
              );
            }}
          />

          <View className="h-8" />
        </View>
      ) : null}
    </View>
  );
}
