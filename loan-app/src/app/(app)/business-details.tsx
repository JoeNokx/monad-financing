import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

function getParam(value: unknown) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function SelectModal(props: { title: string; visible: boolean; options: string[]; onClose: () => void; onSelect: (v: string) => void }) {
  return (
    <Modal visible={props.visible} transparent animationType="fade" onRequestClose={props.onClose}>
      <View className="flex-1 items-center justify-center bg-black/50 px-5">
        <View className="w-full max-w-md rounded-3xl bg-white p-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-gray-900">{props.title}</Text>
            <Pressable onPress={props.onClose} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <Ionicons name="close" size={18} color="#111827" />
            </Pressable>
          </View>
          <View className="h-4" />
          <View className="gap-2">
            {props.options.map((o) => (
              <Pressable
                key={o}
                onPress={() => props.onSelect(o)}
                accessibilityRole="button"
                className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-4"
              >
                <Text className="text-sm text-gray-900">{o}</Text>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SelectField(props: {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const selectedLabel = props.value.trim().length > 0 ? props.value : props.placeholder;
  const isPlaceholder = props.value.trim().length === 0;

  const [open, setOpen] = useState(false);

  return (
    <View>
      <Text className="mb-2 text-xs font-semibold text-gray-700">{props.label}</Text>
      <View className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          className="flex-row items-center justify-between px-4 py-4"
        >
          <Text className={`text-sm ${isPlaceholder ? 'text-gray-400' : 'text-gray-900'}`}>{selectedLabel}</Text>
          <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
        </Pressable>
      </View>

      <SelectModal
        title={props.label}
        visible={open}
        options={props.options}
        onClose={() => setOpen(false)}
        onSelect={(v) => {
          props.onChange(v);
          setOpen(false);
        }}
      />
    </View>
  );
}

function InputField(props: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  keyboardType?: 'default' | 'number-pad';
  optional?: boolean;
  prefix?: string;
}) {
  return (
    <View>
      <Text className="mb-2 text-xs font-semibold text-gray-700">
        {props.label}
        {props.optional ? <Text className="text-gray-400"> (Optional)</Text> : null}
      </Text>
      <View className="flex-row items-center overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-3">
        {props.prefix ? <Text className="mr-2 text-sm text-gray-500">{props.prefix}</Text> : null}
        <TextInput
          value={props.value}
          placeholder={props.placeholder}
          placeholderTextColor="#9CA3AF"
          onChangeText={props.onChange}
          keyboardType={props.keyboardType ?? 'default'}
          className="flex-1 text-sm text-gray-900"
        />
      </View>
    </View>
  );
}

export default function BusinessDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const loanTypeRaw = getParam(params.loanType);
  const loanType = typeof loanTypeRaw === 'string' && loanTypeRaw.trim().length > 0 ? loanTypeRaw : 'BUSINESS';

  const trackRaw = getParam(params.track);
  const track = typeof trackRaw === 'string' && trackRaw.trim().length > 0 ? trackRaw : 'ENTERPRISE';

  const typeOptions = useMemo(() => ['Limited Liability Company', 'Sole Proprietorship', 'Partnership', 'NGO / Non-Profit'], []);
  const sectorOptions = useMemo(() => ['Retail', 'Services', 'Manufacturing', 'Agriculture', 'Technology', 'Other'], []);

  const [businessName, setBusinessName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [sector, setSector] = useState('');
  const [years, setYears] = useState('');
  const [tin, setTin] = useState('');
  const [monthlyProfit, setMonthlyProfit] = useState('');

  const canContinue = useMemo(() => {
    return businessName.trim().length > 1 && businessType.trim().length > 0 && sector.trim().length > 0 && years.trim().length > 0 && monthlyProfit.trim().length > 0;
  }, [businessName, businessType, sector, years, monthlyProfit]);

  const details = useMemo(() => {
    return {
      businessName: businessName.trim(),
      registrationNumber: registrationNumber.trim() || null,
      businessType: businessType.trim() || null,
      sector: sector.trim() || null,
      yearsInOperation: years.trim() || null,
      tin: tin.trim() || null,
      estimatedMonthlyProfit: monthlyProfit.trim() || null,
    };
  }, [businessName, registrationNumber, businessType, sector, years, tin, monthlyProfit]);

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-5 pb-10 pt-12">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-xl font-semibold text-gray-900">Business Details</Text>
      </View>

      <View className="h-6" />

      <Text className="text-2xl font-semibold text-gray-900">Tell us about your business</Text>
      <View className="h-1" />
      <Text className="text-gray-600">We need some information to process your enterprise loan application</Text>

      <View className="h-6" />

      <View className="gap-4">
        <InputField label="Registered Business Name" value={businessName} placeholder="Enter your registered business name" onChange={setBusinessName} />
        <InputField
          label="Business Registration Number"
          optional
          value={registrationNumber}
          placeholder="Enter registration number"
          onChange={setRegistrationNumber}
        />

        <SelectField label="Type of Business" value={businessType} placeholder="Select type of business" options={typeOptions} onChange={setBusinessType} />
        <SelectField label="Industry Sector" value={sector} placeholder="Select industry sector" options={sectorOptions} onChange={setSector} />

        <InputField label="Years in Operation" value={years} placeholder="Enter years" onChange={setYears} keyboardType="number-pad" />
        <InputField label="Tax Identification Number" optional value={tin} placeholder="Enter TIN" onChange={setTin} />
        <InputField
          label="Estimated Monthly Profit"
          value={monthlyProfit}
          placeholder="Enter estimated monthly profit"
          onChange={setMonthlyProfit}
          keyboardType="number-pad"
          prefix="GH₵"
        />

        <Card className="rounded-2xl border-blue-100 bg-blue-50">
          <Text className="text-xs font-semibold text-blue-700">Note:</Text>
          <View className="h-1" />
          <Text className="text-xs text-blue-700">All information provided will be verified for accuracy.</Text>
        </Card>
      </View>

      <View className="h-8" />

      <Button
        title="Continue"
        disabled={!canContinue}
        onPress={() => {
          const encoded = encodeURIComponent(JSON.stringify(details));
          router.push(
            `/(app)/upload-documents?loanType=${encodeURIComponent(loanType)}&track=${encodeURIComponent(track)}&details=${encoded}` as any,
          );
        }}
      />
    </ScrollView>
  );
}
