import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { useAuth } from '@clerk/clerk-expo';
import { useSignIn } from '@clerk/clerk-expo';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { env } from '../../../config/env';
import { useSecurity } from '../../security/security.session';

export default function ClerkSignInScreen() {
  const router = useRouter();
  const didNavRef = useRef(false);

  const hasClerk = Boolean(env.clerkPublishableKey);

  useEffect(() => {
    if (hasClerk) return;
    if (didNavRef.current) return;
    didNavRef.current = true;
    router.replace('/(app)');
  }, [hasClerk, router]);

  if (!hasClerk) {
    return null;
  }

  return <ClerkSignInInner />;
}

function ClerkSignInInner() {
  const router = useRouter();
  const lastTargetRef = useRef<string | null>(null);
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { hydrated, onboardingComplete, hasPin, locked } = useSecurity();

  useEffect(() => {
    if (!hydrated || !isAuthLoaded) return;
    const target = (() => {
      if (!onboardingComplete) return '/onboarding';
      if (!isSignedIn) return null;
      if (!hasPin) return '/(auth)/create-pin';
      if (locked) return '/(auth)/pin-login';
      return '/(app)/home';
    })();

    if (!target) {
      lastTargetRef.current = null;
      return;
    }

    if (lastTargetRef.current === target) return;
    lastTargetRef.current = target;
    router.replace(target as any);
  }, [hydrated, isAuthLoaded, onboardingComplete, isSignedIn, hasPin, locked, router]);

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
          if (isAuthLoaded && isSignedIn) {
            if (hydrated && hasPin) {
              router.replace('/(auth)/pin-login');
            } else {
              router.replace('/(auth)/create-pin');
            }
            return;
          }
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
            if (isAuthLoaded && isSignedIn) {
              if (hydrated && hasPin) {
                router.replace('/(auth)/pin-login');
              } else {
                router.replace('/(auth)/create-pin');
              }
              return;
            }

            Alert.alert('Sign in failed', err?.errors?.[0]?.longMessage ?? 'Please try again');
          }
        }}
      />
      <View className="h-8" />
    </View>
  );
}
