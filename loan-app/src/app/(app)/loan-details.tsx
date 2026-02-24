import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Card } from '../../components/ui/Card';
import { useSecurity } from '../../features/security/security.session';
import type { Loan } from '../../types/loan';
import { daysUntil, formatGhs, toNumber } from '../../utils/format';

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

function loanTypeLabel(loanType: string) {
  const lower = loanType.toLowerCase();
  if (lower.includes('personal')) return 'Personal Loan';
  if (lower.includes('business')) return 'Business Loan';
  return loanType;
}

function InfoRow({ label, value, right }: { label: string; value: string; right?: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <Text className="text-gray-500">{label}</Text>
      <View className="flex-row items-center gap-2">
        <Text className="font-semibold text-gray-900">{value}</Text>
        {right}
      </View>
    </View>
  );
}

export default function LoanDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { appData } = useSecurity();

  const loanIdRaw = getParam(params.loanId);
  const loanId = typeof loanIdRaw === 'string' ? loanIdRaw : '';

  const loans: Loan[] = appData?.loans ?? [];
  const loan = loans.find((l) => String(l.id) === String(loanId));

  if (!loan) {
    return (
      <View className="flex-1 bg-white px-5 pt-12">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </Pressable>
          <Text className="text-xl font-semibold text-gray-900">Loan Details</Text>
        </View>

        <View className="h-8" />
        <Text className="text-gray-600">We couldn’t find that loan.</Text>
      </View>
    );
  }

  const statusLabel = loan.status === 'COMPLETED' ? 'COMPLETED' : loan.status;
  const daysLeft = Math.max(daysUntil(loan.dueDate), 0);

  const amountToRepay = loan.status === 'ACTIVE' ? toNumber(loan.remainingBalance) : toNumber(loan.totalRepayment);
  const loanAmount = toNumber(loan.originalAmount);
  const repaymentAmount = toNumber(loan.totalRepayment);
  const interest = toNumber(loan.interestAmount);

  const approvedOn = (loan as any).approvedAt ?? loan.createdAt;
  const disbursedOn = (loan as any).disbursedAt ?? (loan as any).disbursedOn ?? null;

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="px-5 pb-10 pt-12">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-xl font-semibold text-gray-900">Loan Details</Text>
      </View>

      <View className="h-6" />

      <View className="rounded-3xl bg-purple-600 p-5">
        <View className="flex-row items-center justify-between">
          <View className="rounded-2xl bg-white/15 px-4 py-2">
            <Text className="font-semibold text-white">{loanTypeLabel(loan.loanType)}</Text>
          </View>
          <View className="rounded-full bg-white/80 px-4 py-2">
            <Text className="text-xs font-semibold text-purple-700">{statusLabel}</Text>
          </View>
        </View>

        <View className="h-6" />

        <Text className="text-white/85">Amount to Repay</Text>
        <View className="h-2" />
        <Text className="text-4xl font-semibold text-white">{formatGhs(amountToRepay)}</Text>

        <View className="h-5" />

        <View className="self-start rounded-2xl bg-white/15 px-4 py-2">
          <Text className="font-semibold text-white">{daysLeft} days remaining</Text>
        </View>
      </View>

      <View className="h-6" />

      <Card className="rounded-2xl border-gray-100 p-5">
        <Text className="text-lg font-semibold text-gray-900">Loan Information</Text>
        <View className="h-3" />

        <InfoRow
          label="Loan ID"
          value={String(loan.id)}
          right={
            <Pressable accessibilityRole="button" className="h-8 w-8 items-center justify-center rounded-full bg-purple-50">
              <Ionicons name="copy-outline" size={16} color="#7C3AED" />
            </Pressable>
          }
        />
        <View className="h-px bg-gray-100" />

        <InfoRow label="Loan Amount" value={formatGhs(loanAmount)} />
        <View className="h-px bg-gray-100" />

        <InfoRow label="Repayment Amount" value={formatGhs(repaymentAmount)} />
        <View className="h-px bg-gray-100" />

        <InfoRow label="Interest" value={formatGhs(interest)} />
        <View className="h-px bg-gray-100" />

        <InfoRow label="Due Date" value={formatDateLabel(loan.dueDate)} />
        <View className="h-px bg-gray-100" />

        <InfoRow label="Approved On" value={formatDateLabel(approvedOn)} />
        <View className="h-px bg-gray-100" />

        <InfoRow label="Disbursed On" value={formatDateLabel(disbursedOn)} />
      </Card>

      {loan.status === 'ACTIVE' ? (
        <>
          <View className="h-8" />
          <Pressable
            className="rounded-full bg-purple-600 py-4"
            accessibilityRole="button"
            onPress={() => router.push(`/(app)/repay-loan?loanId=${encodeURIComponent(String(loan.id))}` as any)}
          >
            <Text className="text-center text-base font-semibold text-white">Make Repayment</Text>
          </Pressable>

          <View className="h-3" />

          <Pressable
            className="rounded-full border border-gray-200 bg-white py-4"
            accessibilityRole="button"
            onPress={() => router.push(`/(app)/payment-history?loanId=${encodeURIComponent(String(loan.id))}` as any)}
          >
            <Text className="text-center text-base font-semibold text-gray-700">View Payment History</Text>
          </Pressable>
        </>
      ) : null}
    </ScrollView>
  );
}
