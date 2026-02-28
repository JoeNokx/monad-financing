import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useSecurity } from '../../features/security/security.session';
import { useApiClient } from '../../hooks/useApiClient';
import type { LoanProduct, LoanQuote } from '../../types/loan';
import { formatGhs } from '../../utils/format';

function getParam(value: unknown) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseMoney(text: string) {
  const clean = text.replace(/[^0-9.]/g, '');
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
}

export default function RequestPersonalLoanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const api = useApiClient();
  const { appData } = useSecurity();

  const loanTypeRaw = getParam(params.loanType);
  const loanType = typeof loanTypeRaw === 'string' && loanTypeRaw.trim().length > 0 ? loanTypeRaw : 'PERSONAL';
  const isBusiness = loanType.toLowerCase().includes('business');

  const product = useMemo(() => {
    const products = appData?.products ?? [];
    return products.find((p) => p.id === loanType) ?? null;
  }, [appData, loanType]);

  const [amountText, setAmountText] = useState('');
  const amount = useMemo(() => parseMoney(amountText), [amountText]);

  const durations = product?.durationOptionsDays ?? [];
  const [durationDays, setDurationDays] = useState<number | null>(durations.length > 0 ? durations[0] : null);

  useEffect(() => {
    if (durations.length === 0) return;
    setDurationDays((current) => {
      if (current && durations.includes(current)) return current;
      return durations[0] ?? null;
    });
  }, [durations]);

  const [quote, setQuote] = useState<LoanQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const lastQuoteKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const d = durationDays;
    if (!d || amount <= 0) {
      setQuote(null);
      setQuoteError(null);
      setQuoteLoading(false);
      lastQuoteKeyRef.current = null;
      return;
    }

    const key = `${loanType}:${amount}:${d}`;
    if (lastQuoteKeyRef.current === key) return;

    let cancelled = false;

    const timeoutId = setTimeout(() => {
      if (cancelled) return;

      lastQuoteKeyRef.current = key;
      setQuoteLoading(true);
      setQuoteError(null);

      api
        .request<ApiEnvelope<LoanQuote>>({
          method: 'POST',
          path: '/api/loans/quote',
          body: { loanType, amount, durationDays: d },
        })
        .then((res) => {
          if (cancelled) return;
          setQuote(res.data);
          setQuoteLoading(false);
        })
        .catch((e) => {
          if (cancelled) return;
          setQuote(null);
          setQuoteLoading(false);
          setQuoteError(e instanceof Error ? e.message : 'Unable to calculate quote');
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [api, amount, durationDays, loanType]);

  const minAmount = product?.minAmount ?? 0;
  const maxAmount = product?.availableAmount ?? product?.maxAmount ?? 0;

  const optimisticQuote = useMemo<LoanQuote | null>(() => {
    if (!product) return null;
    if (!durationDays || amount <= 0) return null;

    const interestRatePercent = product.interestRatePercent ?? 0;
    const serviceChargePercent = product.serviceChargePercent ?? 0;
    const principalAmount = amount;
    const interestAmount = (principalAmount * interestRatePercent) / 100;
    const serviceChargeAmount = (principalAmount * serviceChargePercent) / 100;
    const totalRepayment = principalAmount + interestAmount + serviceChargeAmount;

    return {
      loanType,
      amount: principalAmount,
      durationDays,
      interestRatePercent,
      serviceChargePercent,
      principalAmount,
      interestAmount,
      serviceChargeAmount,
      totalRepayment,
    };
  }, [amount, durationDays, loanType, product]);

  const displayQuote = quote ?? optimisticQuote;

  const amountValid = amount > 0 && (minAmount <= 0 || amount >= minAmount) && (maxAmount <= 0 || amount <= maxAmount);
  const durationValid = Boolean(durationDays);

  const canContinue = Boolean(product) && amountValid && durationValid && Boolean(quote) && !quoteLoading;

  const title = loanType.toLowerCase().includes('personal') ? 'Request Personal Loan' : 'Request Loan';

  return (
    <View className="flex-1 bg-white px-5 pt-12">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-xl font-semibold text-gray-900">{title}</Text>
      </View>

      <View className="h-6" />
      {!product ? (
        <View className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <Text className="text-base font-semibold text-gray-900">Loan type not available</Text>
          <View className="h-1" />
          <Text className="text-gray-600">Please go back and select a valid loan product.</Text>
        </View>
      ) : null}

      {product ? (
        <View className="gap-4">
          <Card className="rounded-2xl border-gray-100 p-5">
            <Text className="text-sm font-semibold text-gray-500">AVAILABLE AMOUNT</Text>
            <View className="h-1" />
            <Text className="text-2xl font-semibold text-gray-900">{formatGhs(product.availableAmount)}</Text>
            {product.minAmount > 0 ? (
              <>
                <View className="h-2" />
                <Text className="text-xs text-gray-500">Minimum: {formatGhs(product.minAmount)}</Text>
              </>
            ) : null}
          </Card>

          <View>
            <Text className="text-sm font-semibold text-gray-700">Amount</Text>
            <View className="h-2" />
            <Input value={amountText} placeholder="Enter amount" onChangeText={setAmountText} />
            {!amountValid && amountText.trim().length > 0 ? (
              <>
                <View className="h-2" />
                <Text className="text-xs text-red-600">Enter an amount between {formatGhs(minAmount)} and {formatGhs(maxAmount)}.</Text>
              </>
            ) : null}
          </View>

          <View>
            <Text className="text-sm font-semibold text-gray-700">Duration</Text>
            <View className="h-2" />
            {durations.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {durations.map((d) => {
                  const active = durationDays === d;
                  const label = isBusiness ? `${Math.round(d / 30)} months` : `${d} days`;
                  return (
                    <Pressable
                      key={String(d)}
                      onPress={() => setDurationDays(d)}
                      accessibilityRole="button"
                      className={`rounded-full px-4 py-2 ${active ? 'bg-purple-600' : 'bg-gray-100'}`}
                    >
                      <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-gray-700'}`}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Input
                value={durationDays ? String(durationDays) : ''}
                placeholder={isBusiness ? 'Duration (days)' : 'Duration (days)'}
                onChangeText={(t) => {
                  const n = Number(t.replace(/[^0-9]/g, ''));
                  setDurationDays(Number.isFinite(n) && n > 0 ? n : null);
                }}
              />
            )}
          </View>

          <Card className="rounded-2xl border-gray-100 p-5">
            <Text className="text-base font-semibold text-gray-900">Loan Breakdown</Text>
            <View className="h-3" />

            {quoteLoading && !optimisticQuote ? <Text className="text-gray-500">Calculating...</Text> : null}
            {quoteError ? <Text className="text-red-600">{quoteError}</Text> : null}

            {displayQuote ? (
              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-600">Loan amount</Text>
                  <Text className="font-semibold text-gray-900">{formatGhs(displayQuote.principalAmount)}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-600">Interest ({displayQuote.interestRatePercent}%)</Text>
                  <Text className="font-semibold text-gray-900">{formatGhs(displayQuote.interestAmount)}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-600">Service charge ({displayQuote.serviceChargePercent}%)</Text>
                  <Text className="font-semibold text-gray-900">{formatGhs(displayQuote.serviceChargeAmount)}</Text>
                </View>

                <View className="h-2" />
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-semibold text-gray-900">Total to repay</Text>
                  <Text className="text-base font-semibold text-gray-900">{formatGhs(displayQuote.totalRepayment)}</Text>
                </View>
              </View>
            ) : (
              <Text className="text-gray-500">Enter an amount to see your breakdown.</Text>
            )}
          </Card>

          <Button
            title="Continue"
            disabled={!canContinue}
            onPress={() => {
              if (!durationDays) return;
              if (!quote) return;
              router.push(
                `/(app)/review-confirm-loan?loanType=${encodeURIComponent(loanType)}&amount=${encodeURIComponent(String(amount))}&durationDays=${encodeURIComponent(
                  String(durationDays),
                )}&principalAmount=${encodeURIComponent(String(quote.principalAmount))}&interestRatePercent=${encodeURIComponent(
                  String(quote.interestRatePercent),
                )}&serviceChargePercent=${encodeURIComponent(String(quote.serviceChargePercent))}&interestAmount=${encodeURIComponent(
                  String(quote.interestAmount),
                )}&serviceChargeAmount=${encodeURIComponent(String(quote.serviceChargeAmount))}&totalRepayment=${encodeURIComponent(
                  String(quote.totalRepayment),
                )}` as any,
              );
            }}
          />

          <View className="h-8" />
        </View>
      ) : null}
    </View>
  );
}
