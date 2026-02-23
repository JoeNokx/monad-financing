import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export default function EmergencyContactScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');

  const canContinue = useMemo(() => {
    return name.trim().length > 2 && phone.trim().length > 6 && relationship.trim().length > 1;
  }, [name, phone, relationship]);

  return (
    <View className="flex-1 bg-white px-6 pt-10">
      <Text className="text-2xl font-semibold text-gray-900">Emergency contact</Text>
      <View className="h-2" />
      <Text className="text-gray-600">Who should we contact in case of emergency?</Text>

      <View className="h-8" />
      <View className="gap-3">
        <Input value={name} placeholder="Full name" onChangeText={setName} />
        <Input value={phone} placeholder="Phone number" onChangeText={setPhone} />
        <Input value={relationship} placeholder="Relationship" onChangeText={setRelationship} />
      </View>

      <View className="flex-1" />
      <Button title="Continue" disabled={!canContinue} onPress={() => router.push('/(auth)/link-momo')} />
      <View className="h-8" />
    </View>
  );
}
