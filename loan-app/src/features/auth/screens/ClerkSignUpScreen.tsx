import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { useSignUp } from '@clerk/clerk-expo';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { env } from '../../../config/env';

export default function ClerkSignUpScreen() {
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

  return <ClerkSignUpInner />;
}

function ClerkSignUpInner() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();

  const [step, setStep] = useState<'create' | 'verify'>('create');
  const [hasCreatedSignUp, setHasCreatedSignUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');

  const canCreate = useMemo(() => {
    const pwOk = password.trim().length >= 8 && password === confirmPassword;
    return firstName.trim().length > 0 && lastName.trim().length > 0 && email.trim().length > 3 && pwOk;
  }, [firstName, lastName, email, password, confirmPassword]);
  const canVerify = useMemo(() => code.trim().length >= 4, [code]);

  return (
    <View className="flex-1 bg-white px-6 pt-10">
      <Text className="text-2xl font-semibold text-gray-900">Create account</Text>
      <View className="h-2" />
      <Text className="text-gray-600">Sign up with email and password.</Text>

      <View className="h-8" />

      {step === 'create' ? (
        <View className="gap-3">
          <Input value={firstName} placeholder="First name" onChangeText={setFirstName} />
          <Input value={lastName} placeholder="Last name" onChangeText={setLastName} />
          <Input value={email} placeholder="Email" onChangeText={setEmail} />
          <Input value={username} placeholder="Username (optional)" onChangeText={setUsername} />
          <Input value={password} placeholder="Password" onChangeText={setPassword} secureTextEntry />
          <Input value={confirmPassword} placeholder="Confirm password" onChangeText={setConfirmPassword} secureTextEntry />

          <View className="h-2" />
          <Button
            title="Continue"
            disabled={!canCreate || !isLoaded}
            onPress={async () => {
              if (!isLoaded) return;

              if (password !== confirmPassword) {
                Alert.alert('Sign up', 'Passwords do not match');
                return;
              }

              try {
                if (!hasCreatedSignUp) {
                  await signUp.create({
                    emailAddress: email.trim(),
                    password,
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    ...(username.trim() ? { username: username.trim() } : {}),
                  });
                  setHasCreatedSignUp(true);
                  await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
                  setStep('verify');
                  return;
                }

                const updated = await signUp.update({
                  firstName: firstName.trim(),
                  lastName: lastName.trim(),
                  ...(username.trim() ? { username: username.trim() } : {}),
                });

                const status = (updated as any)?.status;
                const sessionId = (updated as any)?.createdSessionId;
                if (status === 'complete' && sessionId) {
                  await setActive({ session: sessionId });
                  router.replace('/(auth)/create-pin');
                  return;
                }

                const missingFields = ((updated as any)?.missingFields as string[] | undefined) ?? [];
                if (missingFields.length > 0) {
                  Alert.alert('Sign up', `Please provide: ${missingFields.join(', ')}`);
                  return;
                }

                Alert.alert('Sign up', 'Your account still needs additional information. Please review your details.');
              } catch (err: any) {
                Alert.alert('Sign up failed', err?.errors?.[0]?.longMessage ?? 'Please try again');
              }
            }}
          />

          <Text
            onPress={() => router.push('/(auth)/sign-in')}
            className="text-center font-semibold text-blue-600"
            suppressHighlighting
          >
            Already have an account? Sign in
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          <Text className="text-gray-700">Enter the verification code sent to your email.</Text>
          <Input value={code} placeholder="Verification code" onChangeText={setCode} />

          <View className="h-2" />
          <Button
            title="Verify"
            disabled={!canVerify || !isLoaded}
            onPress={async () => {
              if (!isLoaded) return;

              try {
                const res = await signUp.attemptEmailAddressVerification({ code });
                const status = (res as any)?.status;
                const sessionId = (res as any)?.createdSessionId ?? (signUp as any)?.createdSessionId;

                if (status === 'complete') {
                  if (sessionId) {
                    await setActive({ session: sessionId });
                    router.replace('/(auth)/create-pin');
                    return;
                  }

                  Alert.alert('Verification', 'Email verified, but no session was created. Please try signing in.');
                  router.replace('/(auth)/sign-in');
                  return;
                }

                const missingFields =
                  ((res as any)?.missingFields as string[] | undefined) ??
                  ((signUp as any)?.missingFields as string[] | undefined) ??
                  [];
                if (missingFields.length > 0 || status === 'missing_requirements') {
                  setHasCreatedSignUp(true);
                  setStep('create');
                  Alert.alert('Sign up', `Additional information required: ${missingFields.length > 0 ? missingFields.join(', ') : 'please review your details'}`);
                  return;
                }

                Alert.alert('Verification', 'Verification not completed yet. Please try again.');
              } catch (err: any) {
                Alert.alert('Verification failed', err?.errors?.[0]?.longMessage ?? 'Please try again');
              }
            }}
          />

          <Text
            onPress={() => {
              setStep('create');
              setCode('');
            }}
            className="text-center font-semibold text-blue-600"
            suppressHighlighting
          >
            Back
          </Text>
        </View>
      )}

      <View className="flex-1" />
      <View className="h-8" />
    </View>
  );
}
