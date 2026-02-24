import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Text, View } from 'react-native';

import { env } from '../../config/env';
import { Button } from '../../components/ui/Button';
import { useSecurity } from '../../features/security/security.session';
import { useApiClient } from '../../hooks/useApiClient';
import { useQuery } from '../../hooks/useQuery';
import type { ApiEnvelope } from '../../types/api';
import type { ProfileMeResponse } from '../../types/profile';

export default function AppLayout() {
  if (!env.clerkPublishableKey) {
    return <FallbackTabs />;
  }

  return <ClerkGatedTabs />;
}

function ClerkGatedTabs() {
  const router = useRouter();
  const lastTargetRef = useRef<string | null>(null);
  const { isLoaded, isSignedIn, sessionId } = useAuth();
  const { hydrated, onboardingComplete, hasPin, locked, syncClerkSessionId } = useSecurity();
  const api = useApiClient();

  const profileQuery = useQuery(
    async () => {
      if (!hydrated || !onboardingComplete || !isSignedIn || !hasPin || locked) {
        return null;
      }
      return api.request<ApiEnvelope<ProfileMeResponse>>({ path: '/api/profile/me' });
    },
    [api, hydrated, onboardingComplete, isSignedIn, hasPin, locked],
  );

  useEffect(() => {
    if (!hydrated) return;
    syncClerkSessionId(sessionId ?? null);
  }, [hydrated, sessionId, syncClerkSessionId]);

  const navTarget = useMemo(() => {
    if (!hydrated || !isLoaded) return null;

    if (!onboardingComplete) return '/onboarding';
    if (!isSignedIn) return '/(auth)/sign-in';
    if (!hasPin) return '/(auth)/create-pin';
    if (locked) return '/(auth)/pin-login';
    if (profileQuery.data && !profileQuery.data.data.isComplete) return '/(setup)';

    return null;
  }, [hydrated, isLoaded, onboardingComplete, isSignedIn, hasPin, locked, profileQuery.data]);

  useEffect(() => {
    if (!navTarget) {
      lastTargetRef.current = null;
      return;
    }

    if (lastTargetRef.current === navTarget) return;
    lastTargetRef.current = navTarget;
    router.replace(navTarget as any);
  }, [router, navTarget]);

  if (!hydrated || !isLoaded) {
    return null;
  }

  if (navTarget) {
    return null;
  }

  if (profileQuery.error) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-base font-semibold text-gray-900">Unable to load profile</Text>
        <View className="h-2" />
        <Text className="text-center text-gray-600">{profileQuery.error}</Text>
        <View className="h-6" />
        <Button title="Retry" onPress={profileQuery.refetch} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarIcon: ({ color, size }) => {
          const name = (() => {
            switch (route.name) {
              case 'home':
                return 'home-outline';
              case 'loans':
                return 'briefcase-outline';
              case 'more':
                return 'menu-outline';
              case 'profile':
                return 'person-outline';
              default:
                return 'ellipse-outline';
            }
          })();

          return <Ionicons name={name as any} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="loans" options={{ title: 'Loans' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="about" options={{ href: null }} />
      <Tabs.Screen name="placeholder" options={{ href: null }} />
      <Tabs.Screen name="request-loan" options={{ href: null }} />
      <Tabs.Screen name="quick-personal-loan" options={{ href: null }} />
      <Tabs.Screen name="request-personal-loan" options={{ href: null }} />
      <Tabs.Screen name="review-confirm-loan" options={{ href: null }} />
      <Tabs.Screen name="loan-processing" options={{ href: null }} />
    </Tabs>
  );
}

function FallbackTabs() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarIcon: ({ color, size }) => {
          const name = (() => {
            switch (route.name) {
              case 'home':
                return 'home-outline';
              case 'loans':
                return 'briefcase-outline';
              case 'more':
                return 'menu-outline';
              case 'profile':
                return 'person-outline';
              default:
                return 'ellipse-outline';
            }
          })();

          return <Ionicons name={name as any} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="loans" options={{ title: 'Loans' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="about" options={{ href: null }} />
      <Tabs.Screen name="placeholder" options={{ href: null }} />
      <Tabs.Screen name="request-loan" options={{ href: null }} />
      <Tabs.Screen name="quick-personal-loan" options={{ href: null }} />
      <Tabs.Screen name="request-personal-loan" options={{ href: null }} />
      <Tabs.Screen name="review-confirm-loan" options={{ href: null }} />
      <Tabs.Screen name="loan-processing" options={{ href: null }} />
    </Tabs>
  );
}
