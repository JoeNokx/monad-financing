import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '../../components/ui/Button';
import { toNumber } from '../../utils/format';

function getParam(value: unknown) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function formatGhs2(value: number) {
  const formatted = new Intl.NumberFormat('en-GH', { maximumFractionDigits: 2 }).format(value);
  return `GHC ${formatted}`;
}

function formatGhc0(value: number) {
  const formatted = new Intl.NumberFormat('en-GH', { maximumFractionDigits: 0 }).format(value);
  return `GHC ${formatted}`;
}

export default function RepaymentScheduleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const loanTypeRaw = getParam(params.loanType);
  const loanType = typeof loanTypeRaw === 'string' && loanTypeRaw.trim().length > 0 ? loanTypeRaw : 'BUSINESS';

  const amount = toNumber(params.amount);
  const durationDays = Math.floor(toNumber(params.durationDays));
  const repaymentFrequency = typeof params.repaymentFrequency === 'string' ? params.repaymentFrequency : 'MONTHLY';
  const totalInstallments = Math.max(1, Math.floor(toNumber(params.totalInstallments) || 1));

  const totalRepayment = toNumber(params.totalRepayment);

  const installmentAmount = totalInstallments > 0 ? totalRepayment / totalInstallments : totalRepayment;

  const schedule = useMemo(() => {
    const now = new Date();
    const isWeekly = repaymentFrequency.toUpperCase().includes('WEEK');

    const base = new Date(now);
    if (!isWeekly) {
      base.setDate(15);
      if (now.getDate() > 15) {
        base.setMonth(base.getMonth() + 1);
      }
    }

    const items = Array.from({ length: totalInstallments }).map((_, idx) => {
      const due = new Date(base);

      if (isWeekly) {
        due.setDate(due.getDate() + 7 * (idx + 1));
      } else {
        due.setMonth(due.getMonth() + idx);
      }
      const dueLabel = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(due);
      return { idx: idx + 1, dueLabel };
    });
    return items;
  }, [totalInstallments, repaymentFrequency]);

  const durationMonths = Math.max(1, Math.round(durationDays / 30));

  const titleFrequency = repaymentFrequency.toUpperCase().includes('WEEK') ? 'weekly' : 'monthly';

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-28 pt-12">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </Pressable>
          <Text className="text-xl font-semibold text-gray-900">Repayment Schedule</Text>
        </View>

        <View className="h-6" />

        <Text className="text-2xl font-semibold text-gray-900">Your Repayment Plan</Text>
        <View className="h-1" />
        <Text className="text-gray-500">Review your {titleFrequency} installment schedule</Text>

        <View className="h-4" />

        <View className="overflow-hidden rounded-2xl bg-blue-700 p-5">
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-[10px] text-blue-100">Loan Amount</Text>
              <View className="h-1" />
              <Text className="text-base font-semibold text-white">{formatGhc0(amount)}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[10px] text-blue-100">Total Repayment</Text>
              <View className="h-1" />
              <Text className="text-base font-semibold text-white">{formatGhc0(totalRepayment)}</Text>
            </View>
          </View>
          <View className="h-4" />
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-[10px] text-blue-100">{titleFrequency === 'weekly' ? 'Weekly Payment' : 'Monthly Payment'}</Text>
              <View className="h-1" />
              <Text className="text-base font-semibold text-white">{formatGhs2(installmentAmount)}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[10px] text-blue-100">Duration</Text>
              <View className="h-1" />
              <Text className="text-base font-semibold text-white">{durationMonths} months</Text>
            </View>
          </View>
        </View>

        <View className="h-4" />

        <View className="rounded-2xl border border-gray-100 bg-white p-4">
          <Text className="text-sm font-semibold text-gray-900">Installments</Text>
          <View className="h-3" />

          <View className="gap-3">
            {schedule.map((s) => {
              const isFirst = s.idx === 1;
              return (
                <View key={String(s.idx)} className="flex-row items-center justify-between rounded-2xl bg-gray-50 px-4 py-4">
                  <View className="flex-row items-center gap-3">
                    <View className={`h-5 w-5 items-center justify-center rounded-full border ${isFirst ? 'border-amber-400 bg-amber-100' : 'border-gray-300 bg-white'}`}>
                      {isFirst ? <View className="h-2 w-2 rounded-full bg-amber-500" /> : null}
                    </View>
                    <View>
                      <Text className="text-xs font-semibold text-gray-900">Installment {s.idx}</Text>
                      <View className="h-1" />
                      <Text className="text-[10px] text-gray-500">{s.dueLabel}</Text>
                    </View>
                  </View>
                  <Text className="text-xs font-semibold text-gray-900">{formatGhs2(installmentAmount)}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View className="h-4" />

        <View className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <Text className="text-xs font-semibold text-blue-700">Important Information</Text>
          <View className="h-2" />
          <Text className="text-xs text-blue-700">- Missing a payment may result in loan default</Text>
          <Text className="text-xs text-blue-700">- Early payment will not reduce the total interest</Text>
          <Text className="text-xs text-blue-700">- No grace period for business loans</Text>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-5 pb-8 pt-4">
        <Button
          title="Confirm & Request Loan"
          onPress={() => {
            router.push(
              `/(app)/disbursement-account?loanType=${encodeURIComponent(loanType)}&amount=${encodeURIComponent(
                String(amount),
              )}&durationDays=${encodeURIComponent(String(durationDays))}&repaymentFrequency=${encodeURIComponent(
                String(repaymentFrequency),
              )}&totalInstallments=${encodeURIComponent(String(totalInstallments))}&totalRepayment=${encodeURIComponent(
                String(totalRepayment),
              )}` as any,
            );
          }}
        />
      </View>
    </View>
  );
}
