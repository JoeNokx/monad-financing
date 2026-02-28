import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname, useRouter } from 'expo-router';
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
  const pathname = usePathname();
  const lastTargetRef = useRef<string | null>(null);
  const lastLoadedNonceRef = useRef<number | null>(null);
  const { isLoaded, isSignedIn, sessionId } = useAuth();
  const authLoadedOnceRef = useRef(false);
  const stableSessionIdRef = useRef<string | null>(null);
  const {
    hydrated,
    onboardingComplete,
    hasPin,
    locked,
    syncClerkSessionId,
    appData,
    setAppData,
    refreshAppData,
    appDataRefreshNonce,
    setUnlockRedirectPath,
  } = useSecurity();
  const api = useApiClient();

  const [preloadLoading, setPreloadLoading] = useState(false);
  const [preloadError, setPreloadError] = useState<string | null>(null);

  if (isLoaded) {
    if (sessionId) stableSessionIdRef.current = sessionId;
    else if (!isSignedIn) stableSessionIdRef.current = null;
  }

  const isAuthed = Boolean(stableSessionIdRef.current) || isSignedIn;

  if (isLoaded) authLoadedOnceRef.current = true;
  const authReady = hydrated && authLoadedOnceRef.current;

  useEffect(() => {
    if (!hydrated) return;
    syncClerkSessionId(sessionId ?? null);
  }, [hydrated, sessionId, syncClerkSessionId]);

  useEffect(() => {
    if (!hydrated) return;

    if (!authLoadedOnceRef.current) {
      return;
    }

    if (!onboardingComplete || !hasPin) {
      setPreloadError(null);
      setPreloadLoading(false);
      setAppData(null);
      lastLoadedNonceRef.current = null;
      return;
    }

    if (!isAuthed) {
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
        const wrap = <T,>(promise: Promise<T>, label: string) => {
          return promise.catch((e) => {
            const msg = e instanceof Error ? e.message : String(e);
            throw new Error(`${label}: ${msg}`);
          });
        };

        const [profileRes, meRes, kycRes, loansRes, productsRes] = await Promise.all([
          wrap(api.request<ApiEnvelope<ProfileMeResponse>>({ path: '/api/profile/me' }), '/api/profile/me'),
          wrap(api.request<ApiEnvelope<User>>({ path: '/api/users/me' }), '/api/users/me'),
          wrap(api.request<ApiEnvelope<KycStatusResponse>>({ path: '/api/kyc/status' }), '/api/kyc/status'),
          wrap(api.request<ApiEnvelope<Loan[]>>({ path: '/api/loans' }), '/api/loans'),
          wrap(api.request<ApiEnvelope<LoanProduct[]>>({ path: '/api/loans/products' }), '/api/loans/products'),
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
  }, [api, hydrated, onboardingComplete, isAuthed, hasPin, locked, appData, appDataRefreshNonce, setAppData]);

  const navTarget = useMemo(() => {
    if (!authReady) return null;

    if (!onboardingComplete) return '/onboarding';
    if (!isAuthed) return '/(auth)/sign-in';
    if (!hasPin) return '/(auth)/create-pin';
    if (locked) return '/(auth)/pin-login';

    if (appData && !appData.profileMe.isComplete) return '/(setup)';

    return null;
  }, [authReady, onboardingComplete, isAuthed, hasPin, locked, appData]);

  const debugLines = useMemo(() => {
    return [
      `path: ${pathname}`,
      `authReady: ${String(authReady)} isLoaded: ${String(isLoaded)} isSignedIn: ${String(isSignedIn)}`,
      `sessionId: ${sessionId ? 'yes' : 'no'} stableSessionId: ${stableSessionIdRef.current ? 'yes' : 'no'} isAuthed: ${String(isAuthed)}`,
      `hasPin: ${String(hasPin)} locked: ${String(locked)}`,
      `navTarget: ${navTarget ?? 'null'}`,
      `preloadLoading: ${String(preloadLoading)} appData: ${appData ? 'yes' : 'no'} nonce: ${String(appDataRefreshNonce)}`,
      `preloadError: ${preloadError ?? 'null'}`,
    ];
  }, [pathname, authReady, isLoaded, isSignedIn, sessionId, isAuthed, hasPin, locked, navTarget, preloadLoading, appData, appDataRefreshNonce, preloadError]);

  useEffect(() => {
    if (!navTarget) {
      lastTargetRef.current = null;
      return;
    }

    if (lastTargetRef.current === navTarget) return;
    lastTargetRef.current = navTarget;

    if (navTarget === '/(auth)/pin-login') {
      setUnlockRedirectPath(pathname);
    }
    router.replace(navTarget as any);
  }, [router, navTarget, pathname, setUnlockRedirectPath]);

  if (!authReady) {
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

  if (!appData) {
    return <AppSkeleton />;
  }

  return (
    <View className="flex-1">
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
        <Tabs.Screen name="kyc" options={{ href: null }} />
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
        <Tabs.Screen name="notifications" options={{ href: null }} />
      </Tabs>

      {__DEV__ ? (
        <View className="absolute bottom-2 left-2 right-2 rounded-xl bg-black/70 p-3" pointerEvents="none">
          {debugLines.map((line, idx) => (
            <Text key={String(idx)} className="text-[10px] text-white">
              {line}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
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
      <Tabs.Screen name="kyc" options={{ href: null }} />
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
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
