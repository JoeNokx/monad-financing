import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { env } from '../../config/env';
import { Button } from '../../components/ui/Button';
import { AppSkeleton } from '../../components/ui/AppSkeleton';
import { useSecurity } from '../../features/security/security.session';
import { useApiClient } from '../../hooks/useApiClient';
import type { ApiEnvelope } from '../../types/api';
import type { ProfileMeResponse } from '../../types/profile';
import type { KycStatusResponse } from '../../types/kyc';
import type { Loan, LoanProduct } from '../../types/loan';
import type { User } from '../../types/user';

export default function AppLayout() {
  if (!env.clerkPublishableKey) {
    return <FallbackTabs />;
  }

  return <ClerkGatedTabs />;
}

function ClerkGatedTabs() {
  const router = useRouter();
  const lastTargetRef = useRef<string | null>(null);
  const lastLoadedNonceRef = useRef<number | null>(null);
  const { isLoaded, isSignedIn, sessionId } = useAuth();
  const { hydrated, onboardingComplete, hasPin, locked, syncClerkSessionId, appData, setAppData, refreshAppData, appDataRefreshNonce } = useSecurity();
  const api = useApiClient();

  const [preloadLoading, setPreloadLoading] = useState(false);
  const [preloadError, setPreloadError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    syncClerkSessionId(sessionId ?? null);
  }, [hydrated, sessionId, syncClerkSessionId]);

  useEffect(() => {
    if (!hydrated || !isLoaded || !onboardingComplete || !isSignedIn || !hasPin) {
      setPreloadError(null);
      setPreloadLoading(false);
      setAppData(null);
      lastLoadedNonceRef.current = null;
      return;
    }

    if (locked) {
      setPreloadError(null);
      setPreloadLoading(false);
      return;
    }

    const alreadyLoaded = Boolean(appData) && lastLoadedNonceRef.current === appDataRefreshNonce;
    if (alreadyLoaded) return;

    let cancelled = false;

    async function preload() {
      setPreloadLoading(true);
      setPreloadError(null);

      try {
        const [profileRes, meRes, kycRes, loansRes, productsRes] = await Promise.all([
          api.request<ApiEnvelope<ProfileMeResponse>>({ path: '/api/profile/me' }),
          api.request<ApiEnvelope<User>>({ path: '/api/users/me' }),
          api.request<ApiEnvelope<KycStatusResponse>>({ path: '/api/kyc/status' }),
          api.request<ApiEnvelope<Loan[]>>({ path: '/api/loans' }),
          api.request<ApiEnvelope<LoanProduct[]>>({ path: '/api/loans/products' }),
        ]);

        if (cancelled) return;

        setAppData({
          profileMe: profileRes.data,
          me: meRes.data,
          kyc: kycRes.data,
          loans: loansRes.data,
          products: productsRes.data,
        });
        lastLoadedNonceRef.current = appDataRefreshNonce;
        setPreloadLoading(false);
      } catch (e) {
        if (cancelled) return;
        setAppData(null);
        lastLoadedNonceRef.current = null;
        setPreloadLoading(false);
        setPreloadError(e instanceof Error ? e.message : 'Unable to load app data');
      }
    }

    void preload();

    return () => {
      cancelled = true;
    };
  }, [api, hydrated, isLoaded, onboardingComplete, isSignedIn, hasPin, locked, appData, appDataRefreshNonce, setAppData]);

  const navTarget = useMemo(() => {
    if (!hydrated || !isLoaded) return null;

    if (!onboardingComplete) return '/onboarding';
    if (!isSignedIn) return '/(auth)/sign-in';
    if (!hasPin) return '/(auth)/create-pin';
    if (locked) return '/(auth)/pin-login';

    if (appData && !appData.profileMe.isComplete) return '/(setup)';

    return null;
  }, [hydrated, isLoaded, onboardingComplete, isSignedIn, hasPin, locked, appData]);

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
    return <AppSkeleton />;
  }

  if (navTarget) {
    return <AppSkeleton />;
  }

  if (preloadError) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-base font-semibold text-gray-900">Unable to load app data</Text>
        <View className="h-2" />
        <Text className="text-center text-gray-600">{preloadError}</Text>
        <View className="h-6" />
        <Button title="Retry" onPress={refreshAppData} />
      </View>
    );
  }

  if (preloadLoading || !appData) {
    return <AppSkeleton />;
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
      <Tabs.Screen name="faqs" options={{ href: null }} />
      <Tabs.Screen name="loan-details" options={{ href: null }} />
      <Tabs.Screen name="request-loan" options={{ href: null }} />
      <Tabs.Screen name="quick-personal-loan" options={{ href: null }} />
      <Tabs.Screen name="request-personal-loan" options={{ href: null }} />
      <Tabs.Screen name="review-confirm-loan" options={{ href: null }} />
      <Tabs.Screen name="loan-processing" options={{ href: null }} />
      <Tabs.Screen name="personal-information" options={{ href: null }} />
      <Tabs.Screen name="security-settings" options={{ href: null }} />
      <Tabs.Screen name="mobile-money" options={{ href: null }} />
      <Tabs.Screen name="change-password" options={{ href: null }} />
      <Tabs.Screen name="change-pin" options={{ href: null }} />
      <Tabs.Screen name="confirm-change-pin" options={{ href: null }} />
      <Tabs.Screen name="help-support" options={{ href: null }} />
      <Tabs.Screen name="repay-loan" options={{ href: null }} />
      <Tabs.Screen name="payment-history" options={{ href: null }} />
      <Tabs.Screen name="terms-privacy" options={{ href: null }} />
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
      <Tabs.Screen name="faqs" options={{ href: null }} />
      <Tabs.Screen name="loan-details" options={{ href: null }} />
      <Tabs.Screen name="request-loan" options={{ href: null }} />
      <Tabs.Screen name="quick-personal-loan" options={{ href: null }} />
      <Tabs.Screen name="request-personal-loan" options={{ href: null }} />
      <Tabs.Screen name="review-confirm-loan" options={{ href: null }} />
      <Tabs.Screen name="loan-processing" options={{ href: null }} />
      <Tabs.Screen name="personal-information" options={{ href: null }} />
      <Tabs.Screen name="security-settings" options={{ href: null }} />
      <Tabs.Screen name="mobile-money" options={{ href: null }} />
      <Tabs.Screen name="change-password" options={{ href: null }} />
      <Tabs.Screen name="change-pin" options={{ href: null }} />
      <Tabs.Screen name="confirm-change-pin" options={{ href: null }} />
      <Tabs.Screen name="help-support" options={{ href: null }} />
      <Tabs.Screen name="repay-loan" options={{ href: null }} />
      <Tabs.Screen name="payment-history" options={{ href: null }} />
      <Tabs.Screen name="terms-privacy" options={{ href: null }} />
    </Tabs>
  );
}
