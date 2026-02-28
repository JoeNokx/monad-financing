import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useSecurity } from '../../features/security/security.session';

type BusinessLoanTrack = 'TRADER' | 'ENTERPRISE';

type TrackConfig = {
  id: BusinessLoanTrack;
  title: string;
  description: string;
  badge: string;
  range: string;
};

function getParam(value: unknown) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function TrackCard(props: { cfg: TrackConfig; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={props.onPress} accessibilityRole="button">
      <View className={`rounded-2xl border bg-white p-4 ${props.selected ? 'border-blue-200' : 'border-gray-200'}`}>
        <View className="flex-row items-start gap-3">
          <View className={`h-10 w-10 items-center justify-center rounded-2xl ${props.cfg.id === 'TRADER' ? 'bg-purple-100' : 'bg-indigo-100'}`}>
            <Ionicons name="briefcase-outline" size={18} color={props.cfg.id === 'TRADER' ? '#7C3AED' : '#1D4ED8'} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-gray-900">{props.cfg.title}</Text>
            <View className="h-1" />
            <Text className="text-xs text-gray-600">{props.cfg.description}</Text>
            <View className="h-2" />
            <View className="flex-row items-center justify-between">
              <Text className={`text-xs font-semibold ${props.cfg.id === 'TRADER' ? 'text-purple-600' : 'text-indigo-600'}`}>{props.cfg.badge}</Text>
              <Text className="text-xs text-gray-500">{props.cfg.range}</Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function TypeSelectorModal(props: {
  visible: boolean;
  selected: BusinessLoanTrack;
  onClose: () => void;
  onSelect: (t: BusinessLoanTrack) => void;
  onContinue: () => void;
}) {
  const tracks: TrackConfig[] = useMemo(
    () => [
      {
        id: 'TRADER',
        title: 'Trader Loan',
        description: 'Perfect for small business owners, traders, and market vendors',
        badge: 'Up to GHS 10,000',
        range: '3 - 12 months',
      },
      {
        id: 'ENTERPRISE',
        title: 'Enterprise Loan',
        description: 'Designed for registered businesses and enterprises',
        badge: 'Up to GHS 50,000',
        range: '6 - 24 months',
      },
    ],
    [],
  );

  return (
    <Modal visible={props.visible} transparent animationType="fade" onRequestClose={props.onClose}>
      <View className="flex-1 items-center justify-center bg-black/50 px-5">
        <View className="w-full max-w-md rounded-3xl bg-white p-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-gray-900">Select Business Loan Type</Text>
            <Pressable onPress={props.onClose} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <Ionicons name="close" size={18} color="#111827" />
            </Pressable>
          </View>
          <View className="h-1" />
          <Text className="text-xs text-gray-600">Choose the loan type that best fits your business needs</Text>

          <View className="h-4" />
          <View className="gap-3">
            {tracks.map((t) => (
              <TrackCard key={t.id} cfg={t} selected={props.selected === t.id} onPress={() => props.onSelect(t.id)} />
            ))}
          </View>

          <View className="h-5" />
          <Button title="Continue" onPress={props.onContinue} />
        </View>
      </View>
    </Modal>
  );
}

export default function BusinessLoanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { appData } = useSecurity();

  const loanTypeRaw = getParam(params.loanType);
  const loanType = typeof loanTypeRaw === 'string' && loanTypeRaw.trim().length > 0 ? loanTypeRaw : 'BUSINESS';

  const businessProduct = useMemo(() => {
    const products = appData?.products ?? [];
    return products.find((p) => p.id === loanType) ?? null;
  }, [appData, loanType]);

  const [modalOpen, setModalOpen] = useState(false);
  const [track, setTrack] = useState<BusinessLoanTrack>('ENTERPRISE');

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-28 pt-12">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </Pressable>
          <Text className="text-xl font-semibold text-gray-900">Business Loan</Text>
        </View>

        <View className="h-6" />

        <Text className="text-2xl font-semibold text-gray-900">Grow Your Business</Text>
        <View className="h-1" />
        <Text className="text-gray-600">Access structured business financing with flexible repayment options. Perfect for traders and enterprises looking to expand.</Text>

        <View className="h-6" />

        <Text className="text-sm font-semibold text-gray-900">Key Features</Text>
        <View className="h-3" />
        <View className="gap-3">
          <View className="flex-row items-start gap-3 rounded-2xl bg-gray-50 p-4">
            <View className="h-9 w-9 items-center justify-center rounded-2xl bg-purple-100">
              <Ionicons name="briefcase-outline" size={16} color="#7C3AED" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900">Structured loans</Text>
              <View className="h-1" />
              <Text className="text-xs text-gray-600">Professional financing for registered businesses</Text>
            </View>
          </View>
          <View className="flex-row items-start gap-3 rounded-2xl bg-gray-50 p-4">
            <View className="h-9 w-9 items-center justify-center rounded-2xl bg-blue-100">
              <Ionicons name="calendar-outline" size={16} color="#2563EB" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900">Fixed installments</Text>
              <View className="h-1" />
              <Text className="text-xs text-gray-600">Weekly or monthly repayment schedule</Text>
            </View>
          </View>
          <View className="flex-row items-start gap-3 rounded-2xl bg-gray-50 p-4">
            <View className="h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100">
              <Ionicons name="trending-up-outline" size={16} color="#16A34A" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900">Higher limits</Text>
              <View className="h-1" />
              <Text className="text-xs text-gray-600">Access larger amounts for business growth</Text>
            </View>
          </View>
        </View>

        <View className="h-6" />

        <Text className="text-sm font-semibold text-gray-900">Loan Types</Text>
        <View className="h-3" />

        <View className="gap-3">
          <Card className="rounded-2xl border-gray-100 bg-blue-50">
            <Text className="text-sm font-semibold text-gray-900">Trader Loan</Text>
            <View className="h-1" />
            <Text className="text-xs text-gray-600">For market traders and small businesses</Text>
            <View className="h-2" />
            <View className="self-start rounded-full bg-blue-100 px-3 py-1">
              <Text className="text-xs font-semibold text-blue-700">Up to GH₵ 10,000</Text>
            </View>
          </Card>

          <Card className="rounded-2xl border-gray-100 bg-emerald-50">
            <Text className="text-sm font-semibold text-gray-900">Enterprise Loan</Text>
            <View className="h-1" />
            <Text className="text-xs text-gray-600">For registered businesses with documents</Text>
            <View className="h-2" />
            <View className="self-start rounded-full bg-emerald-100 px-3 py-1">
              <Text className="text-xs font-semibold text-emerald-700">Up to GH₵ 50,000</Text>
            </View>
          </Card>

          <View className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <View className="flex-row items-start gap-2">
              <Ionicons name="alert-circle-outline" size={18} color="#D97706" />
              <View className="flex-1">
                <Text className="text-xs font-semibold text-amber-700">Important: Business loans have:</Text>
                <View className="h-1" />
                <Text className="text-xs text-amber-700">- No early repayment discount</Text>
                <Text className="text-xs text-amber-700">- No grace period</Text>
                <Text className="text-xs text-amber-700">- Fixed repayment schedule</Text>
                <Text className="text-xs text-amber-700">- Requires business documentation</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-5 pb-8 pt-4">
        <Button title="Apply for Business Loan" onPress={() => setModalOpen(true)} disabled={!businessProduct} />
      </View>

      <TypeSelectorModal
        visible={modalOpen}
        selected={track}
        onClose={() => setModalOpen(false)}
        onSelect={(t) => setTrack(t)}
        onContinue={() => {
          setModalOpen(false);
          if (track === 'ENTERPRISE') {
            router.push(`/(app)/business-details?loanType=${encodeURIComponent(loanType)}&track=${encodeURIComponent(track)}` as any);
            return;
          }
          router.push(`/(app)/placeholder?title=${encodeURIComponent('Trader Loan')}` as any);
        }}
      />
    </View>
  );
}
