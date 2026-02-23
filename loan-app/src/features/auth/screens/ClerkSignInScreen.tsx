import { useRouter } from 'expo-router';
import { Redirect } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { useSignIn } from '@clerk/clerk-expo';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { env } from '../../../config/env';
import { useSecurity } from '../../security/security.session';

export default function ClerkSignInScreen() {
  if (!env.clerkPublishableKey) {
    return <Redirect href="/(app)" />;
  }

  return <ClerkSignInInner />;
}

function ClerkSignInInner() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { hydrated, hasPin } = useSecurity();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = useMemo(() => identifier.trim().length > 3 && password.trim().length >= 4, [identifier, password]);

  return (
    <View className="flex-1 bg-white px-6 pt-10">
      <Text className="text-2xl font-semibold text-gray-900">Sign in</Text>
      <View className="h-2" />
      <Text className="text-gray-600">Use your email (or phone) and password.</Text>

      <View className="h-8" />
      <View className="gap-3">
        <Input value={identifier} placeholder="Email or phone" onChangeText={setIdentifier} />
        <Input value={password} placeholder="Password" onChangeText={setPassword} secureTextEntry />
      </View>

      <View className="h-4" />
      <Text
        onPress={() => router.push('/(auth)/sign-up')}
        className="text-center font-semibold text-blue-600"
        suppressHighlighting
      >
        New here? Create an account
      </Text>

      <View className="flex-1" />
      <Button
        title="Continue"
        disabled={!canSubmit || !isLoaded}
        onPress={async () => {
          if (!isLoaded) return;
          try {
            const res = await signIn.create({ identifier, password });
            if (res.createdSessionId) {
              await setActive({ session: res.createdSessionId });
              if (hydrated && hasPin) {
                router.replace('/(auth)/pin-login');
              } else {
                router.replace('/(auth)/create-pin');
              }
              return;
            }

            Alert.alert('Sign in', 'Sign in requires additional steps.');
          } catch (err: any) {
            Alert.alert('Sign in failed', err?.errors?.[0]?.longMessage ?? 'Please try again');
          }
        }}
      />
      <View className="h-8" />
    </View>
  );
}
