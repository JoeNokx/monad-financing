import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useSecurity } from '../../features/security/security.session';
import { useApiClient } from '../../hooks/useApiClient';
import type { ApiEnvelope } from '../../types/api';
import type { Loan, LoanQuote } from '../../types/loan';
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

export default function LoanProcessingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const api = useApiClient();
  const { setAppData } = useSecurity();

  const loanTypeRaw = getParam(params.loanType);
  const loanType = typeof loanTypeRaw === 'string' && loanTypeRaw.trim().length > 0 ? loanTypeRaw : 'PERSONAL';

  const amount = toNumber(params.amount);
  const durationDays = Math.floor(toNumber(params.durationDays));

  const initialQuote = useMemo<LoanQuote | null>(() => {
    const principalAmount = toNumber(params.principalAmount);
    const interestRatePercent = toNumber(params.interestRatePercent);
    const serviceChargePercent = toNumber(params.serviceChargePercent);
    const interestAmount = toNumber(params.interestAmount);
    const serviceChargeAmount = toNumber(params.serviceChargeAmount);
    const totalRepayment = toNumber(params.totalRepayment);

    if (principalAmount <= 0 || durationDays <= 0) return null;
    if (totalRepayment <= 0) return null;

    return {
      loanType,
      amount,
      durationDays,
      interestRatePercent,
      serviceChargePercent,
      principalAmount,
      interestAmount,
      serviceChargeAmount,
      totalRepayment,
    };
  }, [params, loanType, amount, durationDays]);

  const [quote, setQuote] = useState<LoanQuote | null>(initialQuote);
  const [loan, setLoan] = useState<Loan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<'quoting' | 'submitting' | 'done'>('quoting');

  const startedRef = useRef(false);

  const canRetry = useMemo(() => Boolean(error) && stage !== 'done', [error, stage]);

  async function run() {
    setError(null);
    setLoan(null);

    try {
      setStage('quoting');
      const quoteRes = await api.request<ApiEnvelope<LoanQuote>>({
        method: 'POST',
        path: '/api/loans/quote',
        body: { loanType, amount, durationDays },
      });
      setQuote(quoteRes.data);

      setStage('submitting');
      const applyRes = await api.request<ApiEnvelope<Loan>>({
        method: 'POST',
        path: '/api/loans/apply',
        body: {
          loanType,
          amount,
          durationDays,
        },
      });

      setLoan(applyRes.data);

      setAppData((prev) => {
        if (!prev) return prev;
        const existing = prev.loans ?? [];
        if (existing.some((l) => l.id === applyRes.data.id)) return prev;
        return { ...prev, loans: [applyRes.data, ...existing] };
      });

      setStage('done');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unable to submit loan';
      setError(message);
    }
  }

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View className="flex-1 bg-white px-5 pt-12">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-xl font-semibold text-gray-900">Processing</Text>
      </View>

      <View className="h-6" />

      {stage !== 'done' ? (
        <Card className="rounded-2xl border-gray-100 p-5">
          <Text className="text-base font-semibold text-gray-900">Please wait</Text>
          <View className="h-1" />
          <Text className="text-gray-600">
            {stage === 'quoting'
              ? 'Calculating your final breakdown...'
              : stage === 'submitting'
                ? 'Submitting your loan request...'
                : 'Working...'}
          </Text>
        </Card>
      ) : null}

      <View>
        <View className="h-4" />
        <Card className="rounded-2xl border-gray-100 p-5">
          <Text className="text-base font-semibold text-gray-900">Final Breakdown</Text>
          <View className="h-3" />
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-600">Loan amount</Text>
            <Text className="font-semibold text-gray-900">{quote ? formatGhs(quote.principalAmount) : '-'}</Text>
          </View>
          <View className="h-2" />
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-600">Interest{quote ? ` (${quote.interestRatePercent}%)` : ''}</Text>
            <Text className="font-semibold text-gray-900">{quote ? formatGhs(quote.interestAmount) : '-'}</Text>
          </View>
          <View className="h-2" />
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-600">Service charge{quote ? ` (${quote.serviceChargePercent}%)` : ''}</Text>
            <Text className="font-semibold text-gray-900">{quote ? formatGhs(quote.serviceChargeAmount) : '-'}</Text>
          </View>
          <View className="h-3" />
          <View className="h-px bg-gray-100" />
          <View className="h-3" />
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-gray-900">Total to repay</Text>
            <Text className="text-base font-semibold text-gray-900">{quote ? formatGhs(quote.totalRepayment) : '-'}</Text>
          </View>
        </Card>
      </View>

      {error ? (
        <View>
          <View className="h-4" />
          <View className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <Text className="font-semibold text-red-700">Request failed</Text>
            <View className="h-1" />
            <Text className="text-red-600">{error}</Text>
          </View>
        </View>
      ) : null}

      {loan ? (
        <View>
          <View className="h-4" />
          <View className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <Text className="font-semibold text-green-700">Loan created</Text>
            <View className="h-1" />
            <Text className="text-green-600">Your loan has been created successfully.</Text>
          </View>
        </View>
      ) : null}

      <View className="flex-1" />

      {canRetry ? <Button title="Retry" onPress={run} /> : null}
      {stage === 'done' ? (
        <>
          <Button title="Go to My Loans" onPress={() => router.replace('/(app)/loans' as any)} />
          <View className="h-3" />
          <Button title="Done" onPress={() => router.replace('/(app)/home' as any)} />
        </>
      ) : null}

      <View className="h-8" />
    </View>
  );
}
