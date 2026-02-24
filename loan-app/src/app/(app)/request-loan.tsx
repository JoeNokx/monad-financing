import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useApiClient } from '../../hooks/useApiClient';
import { useQuery } from '../../hooks/useQuery';
import type { ApiEnvelope } from '../../types/api';
import type { LoanProduct } from '../../types/loan';
import { formatGhs } from '../../utils/format';

export default function RequestLoanScreen() {
  const router = useRouter();
  const api = useApiClient();

  const { data, error, loading, refetch } = useQuery(async () => {
    return api.request<ApiEnvelope<LoanProduct[]>>({ path: '/api/loans/products' });
  }, [api]);

  const products = data?.data ?? [];

  function goToProduct(product: LoanProduct) {
    if (product.id.toLowerCase().includes('personal')) {
      router.push(`/(app)/quick-personal-loan?loanType=${encodeURIComponent(product.id)}` as any);
      return;
    }

    router.push(`/(app)/request-personal-loan?loanType=${encodeURIComponent(product.id)}` as any);
  }

  return (
    <View className="flex-1 bg-white px-5 pt-12">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-xl font-semibold text-gray-900">Select Loan Type</Text>
      </View>

      <View className="h-6" />

      {loading ? <Text className="text-gray-500">Loading loan options...</Text> : null}

      {error ? (
        <View className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <Text className="font-semibold text-red-700">Unable to load loan options</Text>
          <View className="h-1" />
          <Text className="text-red-600">{error}</Text>
          <View className="h-4" />
          <Button title="Retry" onPress={refetch} />
        </View>
      ) : null}

      {!loading && !error ? (
        <View className="gap-4">
          {products.map((p) => {
            const subtitle = `${formatGhs(p.availableAmount)} available`;
            return (
              <Pressable key={p.id} onPress={() => goToProduct(p)} accessibilityRole="button">
                <Card className="rounded-2xl border-gray-100 p-5">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900">{p.displayName}</Text>
                      <View className="h-1" />
                      <Text className="text-gray-600">{subtitle}</Text>
                      {p.durationOptionsDays.length > 0 ? (
                        <>
                          <View className="h-2" />
                          <Text className="text-xs text-gray-500">Duration: {p.durationOptionsDays.join(' / ')} days</Text>
                        </>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                  </View>
                </Card>
              </Pressable>
            );
          })}

          {products.length === 0 ? (
            <View className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <Text className="text-base font-semibold text-gray-900">No loan products available</Text>
              <View className="h-1" />
              <Text className="text-gray-600">Ask an admin to configure loan plans in system settings.</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View className="flex-1" />
      <Button title="Back" onPress={() => router.back()} />
      <View className="h-8" />
    </View>
  );
}
