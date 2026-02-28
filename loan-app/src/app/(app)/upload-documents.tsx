import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useSecurity } from '../../features/security/security.session';

type PickedFile = {
  uri: string;
  mimeType?: string | null;
  name?: string | null;
};

function getParam(value: unknown) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function RequirementCard(props: { title: string; description: string; file: PickedFile | null; onPick: () => void }) {
  return (
    <View className="rounded-2xl border border-gray-100 bg-white p-5">
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-start gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-gray-100">
            <Ionicons name="document-text-outline" size={18} color="#6B7280" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-gray-900">{props.title}</Text>
            <View className="h-1" />
            <Text className="text-xs text-gray-600">{props.description}</Text>
            {props.file ? (
              <>
                <View className="h-2" />
                <Text className="text-xs font-semibold text-emerald-700">Selected</Text>
              </>
            ) : null}
          </View>
        </View>
      </View>

      <View className="h-4" />

      <Pressable onPress={props.onPick} accessibilityRole="button" className="flex-row items-center justify-center gap-2 rounded-full bg-purple-600 px-4 py-3">
        <Ionicons name="cloud-upload-outline" size={16} color="#FFFFFF" />
        <Text className="font-semibold text-white">Upload Document</Text>
      </Pressable>
    </View>
  );
}

export default function UploadDocumentsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { suspendAutoLock, setUnlockRedirectPath } = useSecurity();

  const loanTypeRaw = getParam(params.loanType);
  const loanType = typeof loanTypeRaw === 'string' && loanTypeRaw.trim().length > 0 ? loanTypeRaw : 'BUSINESS';

  const trackRaw = getParam(params.track);
  const track = typeof trackRaw === 'string' && trackRaw.trim().length > 0 ? trackRaw : 'ENTERPRISE';

  const details = typeof params.details === 'string' ? params.details : '';

  const [financial, setFinancial] = useState<PickedFile | null>(null);
  const [address, setAddress] = useState<PickedFile | null>(null);
  const [employment, setEmployment] = useState<PickedFile | null>(null);
  const [registration, setRegistration] = useState<PickedFile | null>(null);

  const items = useMemo(
    () => [
      {
        key: 'financial',
        title: 'Financial Statement',
        description: 'Bank or Mobile Money statement for the past 6 months',
        file: financial,
        setFile: setFinancial,
      },
      {
        key: 'address',
        title: 'Proof of Residential Address',
        description: 'Utility bill, rental agreement, or property document',
        file: address,
        setFile: setAddress,
      },
      {
        key: 'employment',
        title: 'Proof of Employment',
        description: 'Employment letter or business operation proof',
        file: employment,
        setFile: setEmployment,
      },
      {
        key: 'registration',
        title: 'Business Registration',
        description: 'Business registration certificate or trading license',
        file: registration,
        setFile: setRegistration,
      },
    ],
    [financial, address, employment, registration],
  );

  const uploadedCount = items.filter((i) => Boolean(i.file)).length;

  async function pick(setter: (v: PickedFile | null) => void) {
    setUnlockRedirectPath('/(app)/upload-documents');
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

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-5 pb-10 pt-12">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-xl font-semibold text-gray-900">Upload Documents</Text>
      </View>

      <View className="h-6" />

      <Text className="text-2xl font-semibold text-gray-900">Enterprise Loan Documents</Text>
      <View className="h-1" />
      <Text className="text-gray-600">Please upload the following documents to complete your application</Text>

      <View className="h-4" />

      <Card className="rounded-2xl border-blue-100 bg-blue-50">
        <View className="flex-row items-start gap-2">
          <Ionicons name="information-circle-outline" size={18} color="#2563EB" />
          <View className="flex-1">
            <Text className="text-xs font-semibold text-blue-700">Document Requirements</Text>
            <View className="h-1" />
            <Text className="text-xs text-blue-700">All documents must be clear and legible. Accepted formats: PDF, JPG, PNG. Maximum file size: 5MB</Text>
          </View>
        </View>
      </Card>

      <View className="h-4" />

      <View className="gap-4">
        {items.map((i) => (
          <RequirementCard key={i.key} title={i.title} description={i.description} file={i.file} onPick={() => void pick(i.setFile)} />
        ))}
      </View>

      <View className="h-4" />

      <View className="rounded-2xl border border-gray-100 bg-white p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-semibold text-gray-700">Upload Progress</Text>
          <Text className="text-xs font-semibold text-gray-700">{uploadedCount}/4</Text>
        </View>
        <View className="h-2" />
        <View className="h-2 overflow-hidden rounded-full bg-gray-100">
          <View className="h-2 bg-purple-600" style={{ width: `${Math.round((uploadedCount / 4) * 100)}%` }} />
        </View>
      </View>

      <View className="h-8" />

      <Button
        title="Continue"
        onPress={() => {
          router.push(
            `/(app)/business-loan-request?loanType=${encodeURIComponent(loanType)}&track=${encodeURIComponent(track)}&details=${details}` as any,
          );
        }}
      />

      <View className="h-2" />
      <Text className="text-center text-xs text-amber-600">For prototyping: You can continue without uploading all documents</Text>
    </ScrollView>
  );
}
