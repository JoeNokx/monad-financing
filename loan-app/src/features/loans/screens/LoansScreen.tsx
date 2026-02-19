import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useApiClient } from '../../../hooks/useApiClient';
import { useQuery } from '../../../hooks/useQuery';
import { formatGhs, daysUntil, toNumber } from '../../../utils/format';
import type { ApiEnvelope } from '../../../types/api';
import type { Loan } from '../../../types/loan';

type LoansResponse = ApiEnvelope<Loan[]>;

type TabKey = 'active' | 'history';

function chipClasses(active: boolean) {
  return `rounded-full px-3 py-1 ${active ? 'bg-purple-100' : 'bg-gray-100'}`;
}

function chipTextClasses(active: boolean) {
  return `${active ? 'text-purple-700' : 'text-gray-700'} text-xs font-semibold`;
}

function loanTypeLabel(loanType: string) {
  const lower = loanType.toLowerCase();
  if (lower.includes('personal')) return 'Personal';
  if (lower.includes('business')) return 'Business';
  return loanType;
}

export default function LoansScreen() {
  const api = useApiClient();
  const [tab, setTab] = useState<TabKey>('active');

  const { data, error, loading } = useQuery(async () => {
    return api.request<LoansResponse>({ path: '/api/loans' });
  }, [api]);

  const loans = data?.data ?? [];

  const activeLoans = useMemo(() => loans.filter((l) => l.status === 'ACTIVE'), [loans]);
  const historyLoans = useMemo(() => loans.filter((l) => l.status !== 'ACTIVE'), [loans]);

  const outstanding = useMemo(() => {
    return activeLoans.reduce((sum, l) => sum + toNumber(l.remainingBalance), 0);
  }, [activeLoans]);

  function formatDateLabel(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-5 pb-10 pt-8">
      <Text className="text-3xl font-semibold text-gray-900">My Loans</Text>
      <View className="h-5" />

      <View className="flex-row gap-3">
        <View className="flex-1 rounded-2xl bg-purple-50 p-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="trending-up" size={16} color="#7C3AED" />
            <Text className="text-sm text-purple-700">Active Loans</Text>
          </View>
          <View className="h-2" />
          <Text className="text-3xl font-semibold text-purple-900">{activeLoans.length}</Text>
        </View>

        <View className="flex-1 rounded-2xl bg-blue-50 p-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="information-circle" size={16} color="#2563EB" />
            <Text className="text-sm text-blue-700">Outstanding</Text>
          </View>
          <View className="h-2" />
          <Text className="text-3xl font-semibold text-blue-900">{formatGhs(outstanding)}</Text>
        </View>
      </View>

      <View className="h-5" />

      <View className="flex-row items-center justify-center gap-8 border-b border-gray-100 pb-3">
        <Pressable onPress={() => setTab('active')}>
          <View className="items-center">
            <Text className={`text-base font-semibold ${tab === 'active' ? 'text-purple-700' : 'text-gray-400'}`}>Active</Text>
            <View className={`mt-2 h-0.5 w-12 ${tab === 'active' ? 'bg-purple-700' : 'bg-transparent'}`} />
          </View>
        </Pressable>
        <Pressable onPress={() => setTab('history')}>
          <View className="items-center">
            <Text className={`text-base font-semibold ${tab === 'history' ? 'text-purple-700' : 'text-gray-400'}`}>History</Text>
            <View className={`mt-2 h-0.5 w-12 ${tab === 'history' ? 'bg-purple-700' : 'bg-transparent'}`} />
          </View>
        </Pressable>
      </View>

      <View className="h-4" />

      {loading ? <Text className="text-gray-500">Loading...</Text> : null}
      {error ? <Text className="text-red-600">{error}</Text> : null}

      {!loading && !error ? (
        <View className="gap-4">
          {(tab === 'active' ? activeLoans : historyLoans).map((loan) => {
            const daysLeft = daysUntil(loan.dueDate);
            const statusLabel = loan.status === 'COMPLETED' ? 'Completed' : loan.status;

            const primaryDate = loan.status === 'COMPLETED' && loan.completedAt ? loan.completedAt : loan.dueDate;

            return (
              <View key={loan.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View className={chipClasses(true)}>
                      <Text className={chipTextClasses(true)}>{loanTypeLabel(loan.loanType)}</Text>
                    </View>
                    <View className={chipClasses(loan.status === 'ACTIVE')}>
                      <Text className={chipTextClasses(loan.status === 'ACTIVE')}>{statusLabel}</Text>
                    </View>
                  </View>

                  {loan.status === 'ACTIVE' ? (
                    <View className="rounded-full bg-orange-50 px-3 py-1">
                      <Text className="text-xs font-semibold text-orange-700">{Math.max(daysLeft, 0)} days left</Text>
                    </View>
                  ) : null}
                </View>

                <View className="h-4" />

                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-xs text-gray-400">LOAN AMOUNT</Text>
                    <View className="h-1" />
                    <Text className="text-2xl font-semibold text-gray-900">{formatGhs(loan.originalAmount)}</Text>
                  </View>

                  <View>
                    <Text className="text-right text-xs text-gray-400">{loan.status === 'ACTIVE' ? 'AMOUNT TO REPAY' : 'AMOUNT PAID'}</Text>
                    <View className="h-1" />
                    <Text className="text-right text-2xl font-semibold text-gray-900">
                      {loan.status === 'ACTIVE' ? formatGhs(loan.totalRepayment) : formatGhs(loan.amountPaid)}
                    </Text>
                  </View>
                </View>

                <View className="h-4" />

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="time" size={14} color="#9CA3AF" />
                    <Text className="text-sm text-gray-500">
                      {loan.status === 'COMPLETED' ? 'Paid on' : 'Due on'} {formatDateLabel(primaryDate)}
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-400">ID: {loan.id}</Text>
                </View>

                <View className="h-4" />

                <View className="flex-row gap-3">
                  <Pressable className="flex-1 rounded-full border border-gray-200 bg-white py-3">
                    <Text className="text-center font-semibold text-gray-700">View Details</Text>
                  </Pressable>

                  {loan.status === 'ACTIVE' ? (
                    <Pressable className="flex-1 rounded-full bg-purple-600 py-3">
                      <Text className="text-center font-semibold text-white">Make Payment</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })}

          {(tab === 'active' ? activeLoans : historyLoans).length === 0 ? (
            <Text className="text-gray-500">No loans found.</Text>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}
