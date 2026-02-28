import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useApiClient } from '../../hooks/useApiClient';
import { useSecurity } from '../../features/security/security.session';
import type { ApiEnvelope } from '../../types/api';
import type { LoanProduct, LoanQuote } from '../../types/loan';
import { formatGhs, toNumber } from '../../utils/format';

type Frequency = 'WEEKLY' | 'MONTHLY';

function getParam(value: unknown) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function formatGhs2(value: number) {
  const formatted = new Intl.NumberFormat('en-GH', { maximumFractionDigits: 2 }).format(value);
  return `GH₵ ${formatted}`;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function AmountSlider(props: { min: number; max: number; value: number; onChange: (v: number) => void }) {
  const trackWidthRef = useRef(0);

  const pct = props.max > props.min ? (props.value - props.min) / (props.max - props.min) : 0;
  const knobLeft = Math.max(0, trackWidthRef.current * pct - 10);

  const pan = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_evt, gesture) => {
        const w = trackWidthRef.current;
        if (!w) return;
        const x = clamp(knobLeft + gesture.dx + 10, 0, w);
        const next = props.min + (x / w) * (props.max - props.min);
        props.onChange(Math.round(next));
      },
    });
  }, [props, knobLeft]);

  function onLayout(e: LayoutChangeEvent) {
    trackWidthRef.current = e.nativeEvent.layout.width;
  }

  const fillWidth = trackWidthRef.current * pct;

  return (
    <View>
      <View onLayout={onLayout} className="h-3 justify-center rounded-full bg-gray-200">
        <View className="h-3 rounded-full bg-blue-600" style={{ width: fillWidth }} />
        <View
          {...pan.panHandlers}
          className="absolute h-5 w-5 rounded-full bg-blue-800"
          style={{ left: knobLeft, top: -4 }}
        />
      </View>

      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-[10px] text-gray-500">{formatGhs(props.min)}</Text>
        <Text className="text-[10px] text-gray-500">{formatGhs(props.max)}</Text>
      </View>
    </View>
  );
}

function Pill(props: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="button"
      className={`rounded-full border px-4 py-2 ${props.active ? 'border-blue-600 bg-blue-600' : 'border-gray-200 bg-white'}`}
    >
      <Text className={`text-xs font-semibold ${props.active ? 'text-white' : 'text-gray-700'}`}>{props.label}</Text>
    </Pressable>
  );
}

export default function BusinessLoanRequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const api = useApiClient();
  const { appData } = useSecurity();

  const loanTypeRaw = getParam(params.loanType);
  const loanType = typeof loanTypeRaw === 'string' && loanTypeRaw.trim().length > 0 ? loanTypeRaw : 'BUSINESS';

  const trackRaw = getParam(params.track);
  const track = typeof trackRaw === 'string' && trackRaw.trim().length > 0 ? trackRaw : 'ENTERPRISE';

  const product: LoanProduct | null = useMemo(() => {
    const products = appData?.products ?? [];
    return products.find((p) => p.id === loanType) ?? null;
  }, [appData, loanType]);

  const minAmount = Math.max(track === 'ENTERPRISE' ? 1000 : 0, product?.minAmount ?? 0);
  const maxAmount = Math.min(
    track === 'ENTERPRISE' ? 50000 : Number.POSITIVE_INFINITY,
    product?.availableAmount ?? product?.maxAmount ?? (track === 'ENTERPRISE' ? 50000 : 50000),
  );

  const [amount, setAmount] = useState<number>(Math.min(Math.max(5000, minAmount), maxAmount));

  const monthOptions = useMemo(() => {
    if (track === 'ENTERPRISE') return [3, 6, 9, 12, 18, 24];
    const configured = (product?.durationOptionsDays ?? [])
      .map((d) => Math.round(d / 30))
      .filter((m) => Number.isFinite(m) && m > 0);
    const unique = Array.from(new Set(configured)).sort((a, b) => a - b);
    return unique.length > 0 ? unique : [3, 6, 9, 12, 18, 24];
  }, [product, track]);

  const [months, setMonths] = useState<number>(monthOptions.includes(6) ? 6 : monthOptions[0] ?? 6);
  const durationDays = months * 30;

  useEffect(() => {
    if (!monthOptions.includes(months)) {
      setMonths(monthOptions[0] ?? 6);
    }
  }, [monthOptions, months]);

  const [frequency, setFrequency] = useState<Frequency>('MONTHLY');

  const totalInstallments = useMemo(() => {
    if (frequency === 'MONTHLY') return Math.max(1, months);
    const weeks = Math.round(durationDays / 7);
    return Math.max(1, weeks);
  }, [frequency, months, durationDays]);

  const [quote, setQuote] = useState<LoanQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quoteKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!product) return;

    const key = `${loanType}:${amount}:${durationDays}`;
    if (quoteKeyRef.current === key) return;
    quoteKeyRef.current = key;

    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .request<ApiEnvelope<LoanQuote>>({
        method: 'POST',
        path: '/api/loans/quote',
        body: { loanType, amount, durationDays },
      })
      .then((res) => {
        if (cancelled) return;
        setQuote(res.data);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setQuote(null);
        setLoading(false);
        setError(e instanceof Error ? e.message : 'Unable to calculate quote');
      });

    return () => {
      cancelled = true;
    };
  }, [api, product, loanType, amount, durationDays]);

  const summary = useMemo(() => {
    const principalAmount = quote ? quote.principalAmount : amount;
    const interestAmount = quote ? quote.interestAmount : 0;
    const serviceChargeAmount = quote ? quote.serviceChargeAmount : 0;
    const totalRepayment = quote ? quote.totalRepayment : principalAmount + interestAmount + serviceChargeAmount;

    const installment = totalInstallments > 0 ? totalRepayment / totalInstallments : totalRepayment;

    return {
      principalAmount,
      interestAmount,
      serviceChargeAmount,
      totalRepayment,
      installment: round1(installment),
    };
  }, [quote, amount, totalInstallments]);

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-5 pb-10 pt-12">
      <View className="flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-sm font-semibold text-gray-900">Business Loan Request</Text>
        <View className="h-10 w-10" />
      </View>

      <View className="h-6" />

      <Text className="text-2xl font-semibold text-gray-900">How much do you need?</Text>
      <View className="h-1" />
      <Text className="text-gray-600">Choose your loan amount and repayment plan</Text>

      <View className="h-6" />

      <View className="gap-4">
        <Card className="rounded-2xl border-gray-100">
          <View className="flex-row items-center gap-2">
            <Ionicons name="cash-outline" size={16} color="#2563EB" />
            <Text className="text-xs font-semibold text-gray-700">Loan Amount</Text>
          </View>
          <View className="h-3" />
          <Text className="text-3xl font-semibold text-gray-900">{formatGhs(amount)}</Text>
          <View className="h-4" />
          <AmountSlider min={minAmount} max={maxAmount} value={amount} onChange={(v) => setAmount(clamp(v, minAmount, maxAmount))} />
        </Card>

        <Card className="rounded-2xl border-gray-100">
          <View className="flex-row items-center gap-2">
            <Ionicons name="calendar-outline" size={16} color="#2563EB" />
            <Text className="text-xs font-semibold text-gray-700">Loan Tenure</Text>
          </View>
          <View className="h-1" />
          <Text className="text-xs text-gray-500">How long you'll take to repay the loan</Text>
          <View className="h-4" />
          <View className="flex-row flex-wrap gap-2">
            {monthOptions.map((m) => (
              <Pill key={String(m)} label={`${m} months`} active={months === m} onPress={() => setMonths(m)} />
            ))}
          </View>
        </Card>

        <Card className="rounded-2xl border-gray-100">
          <View className="flex-row items-center gap-2">
            <Ionicons name="repeat-outline" size={16} color="#2563EB" />
            <Text className="text-xs font-semibold text-gray-700">Repayment Frequency</Text>
          </View>
          <View className="h-1" />
          <Text className="text-xs text-gray-500">How often you'll make payments</Text>
          <View className="h-4" />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Pressable
                accessibilityRole="button"
                onPress={() => setFrequency('WEEKLY')}
                className={`rounded-2xl border px-4 py-4 ${frequency === 'WEEKLY' ? 'border-blue-700 bg-blue-700' : 'border-gray-200 bg-white'}`}
              >
                <Text className={`text-center text-sm font-semibold ${frequency === 'WEEKLY' ? 'text-white' : 'text-gray-900'}`}>Weekly</Text>
              </Pressable>
            </View>
            <View className="flex-1">
              <Pressable
                accessibilityRole="button"
                onPress={() => setFrequency('MONTHLY')}
                className={`rounded-2xl border px-4 py-4 ${frequency === 'MONTHLY' ? 'border-blue-700 bg-blue-700' : 'border-gray-200 bg-white'}`}
              >
                <Text className={`text-center text-sm font-semibold ${frequency === 'MONTHLY' ? 'text-white' : 'text-gray-900'}`}>Monthly</Text>
              </Pressable>
            </View>
          </View>
        </Card>

        <View className="overflow-hidden rounded-2xl bg-blue-700 p-5">
          <Text className="text-base font-semibold text-white">Loan Summary</Text>
          <View className="h-4" />

          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-blue-100">Principal Amount</Text>
            <Text className="text-xs font-semibold text-white">{formatGhs(summary.principalAmount)}</Text>
          </View>
          <View className="h-3" />
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-blue-100">Interest ({quote ? `${quote.interestRatePercent}% p.a.` : `${toNumber(product?.interestRatePercent)}% p.a.`})</Text>
            <Text className="text-xs font-semibold text-white">{formatGhs(summary.interestAmount)}</Text>
          </View>
          <View className="h-3" />
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-blue-100">Service Charge ({quote ? `${quote.serviceChargePercent}%` : `${toNumber(product?.serviceChargePercent)}%`})</Text>
            <Text className="text-xs font-semibold text-white">{formatGhs(summary.serviceChargeAmount)}</Text>
          </View>

          <View className="h-4" />
          <View className="h-px bg-blue-500/40" />
          <View className="h-4" />

          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold text-white">Total Repayment</Text>
            <Text className="text-lg font-semibold text-white">{formatGhs(summary.totalRepayment)}</Text>
          </View>
          <View className="h-4" />
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-blue-100">{frequency === 'MONTHLY' ? 'Monthly' : 'Weekly'} Installment</Text>
            <Text className="text-xs font-semibold text-white">{formatGhs2(summary.installment)}</Text>
          </View>
        </View>

        <View className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <Text className="text-xs font-semibold text-amber-700">Important:</Text>
          <View className="h-1" />
          <Text className="text-xs text-amber-700">Business loans follow a fixed repayment schedule. Early payment will not reduce interest charges.</Text>
        </View>

        {error ? (
          <View className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <Text className="text-xs font-semibold text-red-700">Unable to calculate breakdown</Text>
            <View className="h-1" />
            <Text className="text-xs text-red-600">{error}</Text>
          </View>
        ) : null}

        <View className="h-2" />

        <Button
          title={loading ? 'Loading...' : 'View Repayment Schedule'}
          disabled={!quote || loading}
          onPress={() => {
            if (!quote) return;
            router.push(
              `/(app)/repayment-schedule?loanType=${encodeURIComponent(loanType)}&amount=${encodeURIComponent(
                String(amount),
              )}&durationDays=${encodeURIComponent(String(durationDays))}&repaymentFrequency=${encodeURIComponent(
                frequency,
              )}&totalInstallments=${encodeURIComponent(String(totalInstallments))}&principalAmount=${encodeURIComponent(
                String(quote.principalAmount),
              )}&interestRatePercent=${encodeURIComponent(String(quote.interestRatePercent))}&serviceChargePercent=${encodeURIComponent(
                String(quote.serviceChargePercent),
              )}&interestAmount=${encodeURIComponent(String(quote.interestAmount))}&serviceChargeAmount=${encodeURIComponent(
                String(quote.serviceChargeAmount),
              )}&totalRepayment=${encodeURIComponent(String(quote.totalRepayment))}` as any,
            );
          }}
        />
      </View>
    </ScrollView>
  );
}
