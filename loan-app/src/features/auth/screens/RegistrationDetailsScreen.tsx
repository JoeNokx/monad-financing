import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export default function RegistrationDetailsScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');

  const canContinue = useMemo(() => {
    return fullName.trim().length > 2 && dob.trim().length > 3 && gender.trim().length > 0 && address.trim().length > 3;
  }, [fullName, dob, gender, address]);

  return (
    <View className="flex-1 bg-white px-6 pt-10">
      <Text className="text-2xl font-semibold text-gray-900">Your details</Text>
      <View className="h-2" />
      <Text className="text-gray-600">Tell us a bit about you.</Text>

      <View className="h-8" />
      <View className="gap-3">
        <Input value={fullName} placeholder="Full name" onChangeText={setFullName} />
        <Input value={dob} placeholder="Date of birth (YYYY-MM-DD)" onChangeText={setDob} />
        <Input value={gender} placeholder="Gender" onChangeText={setGender} />
        <Input value={address} placeholder="Address" onChangeText={setAddress} />
      </View>

      <View className="flex-1" />
      <Button title="Continue" disabled={!canContinue} onPress={() => router.push('/(auth)/emergency-contact')} />
      <View className="h-8" />
    </View>
  );
}
