import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useApiClient } from '../../../hooks/useApiClient';
import { useSecurity } from '../../security/security.session';
import type { ApiEnvelope } from '../../../types/api';
import type { KycStatusResponse, KycVerificationStatus } from '../../../types/kyc';

type PickedImage = {
  uri: string;
  mimeType?: string | null;
  name?: string | null;
};

function statusColor(status: string) {
  if (status === 'APPROVED') return 'text-emerald-700';
  if (status === 'REJECTED') return 'text-red-700';
  return 'text-amber-700';
}

function statusLabel(status: string) {
  if (status === 'APPROVED') return 'KYC Approved';
  if (status === 'REJECTED') return 'KYC Rejected';
  return 'Pending Approval';
}

function StatusCard(props: { status: KycVerificationStatus | 'PENDING'; hasSubmission: boolean }) {
  return (
    <View className="rounded-2xl border border-gray-100 bg-white p-5">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-gray-900">Verification Status</Text>
        <Text className={`font-semibold ${statusColor(props.status)}`}>{props.hasSubmission ? statusLabel(props.status) : 'Upload Required'}</Text>
      </View>
      <View className="h-2" />
      <Text className="text-gray-600">
        {props.hasSubmission
          ? props.status === 'APPROVED'
            ? 'Your documents have been approved.'
            : props.status === 'REJECTED'
              ? 'Your submission was rejected. Please resubmit clear images.'
              : 'Your documents are under review (24-48 hours).'
          : 'Submit your documents to start verification.'}
      </Text>
    </View>
  );
}

function SelectOption(props: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={props.onPress} accessibilityRole="button" className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-4">
      <Text className="text-gray-900">{props.label}</Text>
      {props.selected ? <Ionicons name="checkmark-circle" size={20} color="#7C3AED" /> : <View className="h-5 w-5 rounded-full border border-gray-300" />}
    </Pressable>
  );
}

function UploadRow(props: { title: string; image: PickedImage | null; onPick: () => void }) {
  return (
    <View className="rounded-2xl border border-gray-100 bg-white p-5">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-gray-900">{props.title}</Text>
        <Pressable onPress={props.onPick} accessibilityRole="button" className="flex-row items-center gap-2 rounded-full bg-purple-600 px-4 py-2">
          <Ionicons name="cloud-upload-outline" size={16} color="#FFFFFF" />
          <Text className="font-semibold text-white">Select</Text>
        </Pressable>
      </View>

      <View className="h-4" />

      {props.image ? (
        <View className="overflow-hidden rounded-xl border border-gray-200">
          <Image source={{ uri: props.image.uri }} style={{ width: '100%', height: 200 }} resizeMode="cover" />
        </View>
      ) : (
        <View className="items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10">
          <Ionicons name="image-outline" size={28} color="#9CA3AF" />
          <View className="h-2" />
          <Text className="text-gray-500">No image selected</Text>
        </View>
      )}
    </View>
  );
}

export default function KycScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const api = useApiClient();
  const { appData, refreshAppData, suspendAutoLock, setUnlockRedirectPath } = useSecurity();

  const current = appData?.kyc ?? { status: 'PENDING', hasSubmission: false };

  const idTypes = useMemo(() => ['Passport', 'Ghana Card', "Voter's ID", "Driver's License"], []);

  const [idType, setIdType] = useState(idTypes[1] ?? 'Ghana Card');
  const [idNumber, setIdNumber] = useState('');

  const [idFront, setIdFront] = useState<PickedImage | null>(null);
  const [idBack, setIdBack] = useState<PickedImage | null>(null);
  const [selfie, setSelfie] = useState<PickedImage | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const goBackSafe = () => {
    if ((navigation as any)?.canGoBack?.()) {
      router.back();
      return;
    }
    router.replace('/(app)/profile');
  };

  async function pickImage(setter: (img: PickedImage | null) => void) {
    setUnlockRedirectPath('/(app)/kyc');
    suspendAutoLock(15000);

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please allow photo library access to upload your documents.');
      return;
    }

    suspendAutoLock(15000);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    setter({ uri: asset.uri, mimeType: (asset as any).mimeType, name: (asset as any).fileName });
  }

  async function submit() {
    if (!idType || idType.trim().length === 0) {
      Alert.alert('Missing ID type', 'Please select an ID type.');
      return;
    }

    if (!idNumber || idNumber.trim().length < 3) {
      Alert.alert('Missing ID number', 'Please enter a valid ID number.');
      return;
    }

    if (!idFront || !idBack || !selfie) {
      Alert.alert('Missing images', 'Please upload ID front, ID back, and a selfie.');
      return;
    }

    if (current.status === 'APPROVED') {
      Alert.alert('Already verified', 'Your KYC is already approved.');
      return;
    }

    setSubmitting(true);
    try {
      const body = new FormData();
      body.append('idType', idType);
      body.append('idNumber', idNumber.trim());
      body.append('idFront', { uri: idFront.uri, name: idFront.name ?? 'id_front.jpg', type: idFront.mimeType ?? 'image/jpeg' } as any);
      body.append('idBack', { uri: idBack.uri, name: idBack.name ?? 'id_back.jpg', type: idBack.mimeType ?? 'image/jpeg' } as any);
      body.append('selfie', { uri: selfie.uri, name: selfie.name ?? 'selfie.jpg', type: selfie.mimeType ?? 'image/jpeg' } as any);

      await api.request<ApiEnvelope<any>>({ method: 'POST', path: '/api/kyc/submit-files', body });

      Alert.alert('Submitted', 'Your documents have been submitted for review.');
      refreshAppData();
      router.replace('/(app)/profile');
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Unable to submit KYC');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="px-5 pb-10 pt-12">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={goBackSafe} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-xl font-semibold text-gray-900">KYC Verification</Text>
      </View>

      <View className="h-6" />

      <StatusCard status={current.status} hasSubmission={current.hasSubmission} />

      <View className="h-6" />

      <View className="rounded-2xl border border-gray-100 bg-white p-5">
        <Text className="text-base font-semibold text-gray-900">Select ID Type</Text>
        <View className="h-4" />
        <View className="gap-3">
          {idTypes.map((t) => (
            <SelectOption key={t} label={t} selected={idType === t} onPress={() => setIdType(t)} />
          ))}
        </View>

        <View className="h-5" />

        <Text className="text-base font-semibold text-gray-900">ID Number</Text>
        <View className="h-2" />
        <Input value={idNumber} placeholder="Enter ID number" onChangeText={setIdNumber} />
      </View>

      <View className="h-6" />

      <View className="gap-4">
        <UploadRow title="Upload ID Front" image={idFront} onPick={() => void pickImage(setIdFront)} />
        <UploadRow title="Upload ID Back" image={idBack} onPick={() => void pickImage(setIdBack)} />
        <UploadRow title="Upload Selfie" image={selfie} onPick={() => void pickImage(setSelfie)} />
      </View>

      <View className="h-6" />

      <Button title={submitting ? 'Submitting...' : 'Submit for Review'} onPress={() => void submit()} disabled={submitting} />

      <View className="h-2" />
      <Text className="text-center text-xs text-gray-500">Make sure all images are clear and readable.</Text>
    </ScrollView>
  );
}
