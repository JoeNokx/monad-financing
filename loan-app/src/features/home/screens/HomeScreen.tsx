import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Linking, Modal, Pressable, ScrollView, Share, Text, View } from 'react-native';

import { Button } from '../../../components/ui/Button';
import { APP_NAME } from '../../../config/constants';
import { useApiClient } from '../../../hooks/useApiClient';
import type { ApiEnvelope } from '../../../types/api';
import type { Loan } from '../../../types/loan';
import type { Notification } from '../../../types/notification';
import type { Transaction } from '../../../types/transaction';
import { getSecureItem } from '../../../services/secure.storage';
import { useSecurity } from '../../security/security.session';
import { initials } from '../../../utils/format';
import { daysUntil, toNumber } from '../../../utils/format';

type ReferralSummary = {
  referralCode: string | null;
  friendsInvited: number;
  moneyEarned: number;
  pendingRewards: number;
};

export default function HomeScreen() {
  const router = useRouter();
  const api = useApiClient();
  const { appData, appDataRefreshNonce } = useSecurity();

  const userId = appData?.me?.id ?? 'anonymous';
  const readKey = `notifications_read_v1_${userId}`;

  const [apiNotifs, setApiNotifs] = useState<Notification[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [readIds, setReadIds] = useState<Record<string, true>>({});

  const [inviteMounted, setInviteMounted] = useState(false);
  const translateY = useRef(new Animated.Value(700)).current;
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteData, setInviteData] = useState<ReferralSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const raw = await getSecureItem(readKey);
        const parsed = raw ? (JSON.parse(raw) as string[]) : [];
        const next: Record<string, true> = {};
        for (const id of parsed ?? []) next[String(id)] = true;
        if (!cancelled) setReadIds(next);
      } catch {
        if (!cancelled) setReadIds({});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [readKey, appDataRefreshNonce]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [nRes, tRes] = await Promise.all([
          api.request<ApiEnvelope<Notification[]>>({ path: '/api/notifications' }),
          api.request<ApiEnvelope<Transaction[]>>({ path: '/api/transactions' }),
        ]);

        if (cancelled) return;
        setApiNotifs(Array.isArray(nRes.data) ? nRes.data : []);
        setTxs(Array.isArray(tRes.data) ? tRes.data : []);
      } catch {
        if (!cancelled) {
          setApiNotifs([]);
          setTxs([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [api, appDataRefreshNonce]);

  const unreadCount = useMemo(() => {
    const unreadById = new Map<string, boolean>();

    for (const n of apiNotifs) {
      const id = `api_${n.id}`;
      const isUnread = !n.isRead && !readIds[id];
      unreadById.set(id, isUnread);
    }

    const loans: Loan[] = appData?.loans ?? [];
    const kyc = appData?.kyc;

    for (const loan of loans) {
      if (loan.status === 'ACTIVE') {
        const baseId = `loan_approved_${loan.id}`;
        unreadById.set(baseId, (unreadById.get(baseId) ?? false) || !readIds[baseId]);

        const days = daysUntil(loan.dueDate);
        if (days === 3) {
          const id = `payment_due_soon_${loan.id}`;
          unreadById.set(id, (unreadById.get(id) ?? false) || !readIds[id]);
        }
        if (days < 0 && toNumber(loan.remainingBalance) > 0) {
          const id = `payment_overdue_${loan.id}`;
          unreadById.set(id, (unreadById.get(id) ?? false) || !readIds[id]);
        }
      }

      if (loan.status === 'COMPLETED') {
        const id = `loan_repaid_${loan.id}`;
        unreadById.set(id, (unreadById.get(id) ?? false) || !readIds[id]);
      }
    }

    for (const t of txs) {
      const status = String((t as any).status ?? '').toUpperCase();
      if (status !== 'SUCCESS') continue;
      const id = `payment_received_${t.id}`;
      unreadById.set(id, (unreadById.get(id) ?? false) || !readIds[id]);
    }

    if (kyc) {
      if (kyc.status === 'APPROVED') {
        const id = 'kyc_verified';
        unreadById.set(id, (unreadById.get(id) ?? false) || !readIds[id]);
      }
      if (kyc.status === 'PENDING' && (kyc as any).hasSubmission) {
        const id = 'kyc_under_review';
        unreadById.set(id, (unreadById.get(id) ?? false) || !readIds[id]);
      }
      if (kyc.status === 'REJECTED') {
        const id = 'kyc_rejected';
        unreadById.set(id, (unreadById.get(id) ?? false) || !readIds[id]);
      }
    }

    let count = 0;
    for (const isUnread of unreadById.values()) {
      if (isUnread) count += 1;
    }
    return count;
  }, [apiNotifs, appData?.kyc, appData?.loans, readIds, txs]);

  const inviteSnapshot = useMemo(() => {
    return (
      inviteData ?? {
        referralCode: null,
        friendsInvited: 0,
        moneyEarned: 0,
        pendingRewards: 0,
      }
    );
  }, [inviteData]);

  const openInvite = () => {
    setInviteMounted(true);
    translateY.setValue(700);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 240,
      useNativeDriver: true,
    }).start();

    void (async () => {
      try {
        setInviteLoading(true);
        const res = await api.request<ApiEnvelope<ReferralSummary>>({ path: '/api/referrals/summary' });
        setInviteData(res.data);
      } catch {
        // ignore
      } finally {
        setInviteLoading(false);
      }
    })();
  };

  const closeInvite = () => {
    Animated.timing(translateY, {
      toValue: 700,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setInviteMounted(false);
    });
  };

  const openWhatsApp = async () => {
    const phone = '233546022758';
    const appUrl = `whatsapp://send?phone=${phone}`;
    const webUrl = `https://wa.me/${phone}`;

    try {
      const supported = await Linking.canOpenURL(appUrl);
      await Linking.openURL(supported ? appUrl : webUrl);
    } catch {
      await Linking.openURL(webUrl);
    }
  };

  const me = appData?.me;
  const displayName = me?.fullName ?? me?.email ?? '';
  const firstName = displayName.trim().length > 0 ? displayName.trim().split(' ')[0] : '';

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="px-5 pb-10 pt-12">
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => router.push('/(app)/profile')}
          className="flex-row items-center gap-3"
          accessibilityRole="button"
        >
          {me ? (
            <View className="h-12 w-12 items-center justify-center rounded-full bg-purple-600">
              <Text className="text-base font-semibold text-white">{initials(displayName) || 'U'}</Text>
            </View>
          ) : (
            <View className="h-12 w-12 rounded-full bg-gray-200" />
          )}

          <View>
            <Text className="text-lg font-semibold text-gray-900">Hi {firstName ? `${firstName},` : ''}</Text>
            <View className="h-1" />
            <Text className="text-sm text-gray-500">Welcome back to {APP_NAME},</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(app)/notifications')}
          className="relative h-12 w-12 items-center justify-center rounded-full bg-white"
          accessibilityRole="button"
        >
          <Ionicons name="notifications-outline" size={22} color="#6B7280" />
          {unreadCount > 0 ? (
            <View className="absolute -right-1 -top-1 h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1">
              <Text className="text-[10px] font-semibold text-white">{unreadCount > 99 ? '99+' : String(unreadCount)}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View className="h-6" />

      <View className="rounded-3xl bg-white p-5 shadow-sm">
        <Text className="text-xs font-semibold tracking-widest text-purple-600">AVAILABLE LOANS</Text>
        <View className="h-4" />

        <View className="rounded-2xl bg-gray-50 p-4">
          <Text className="text-base font-semibold text-gray-900">No loan plans available yet</Text>
          <View className="h-1" />
          <Text className="text-sm text-gray-600">When an admin creates loan plans, they will appear here.</Text>
        </View>

        <View className="h-4" />

        <Button title="Request a Loan" onPress={() => router.push('/(app)/request-loan')} />
      </View>

      <View className="h-5" />

      <View className="overflow-hidden rounded-3xl bg-purple-600 p-5">
        <Text className="text-lg font-semibold text-white">Invite friends, earn cash!</Text>
        <View className="h-2" />
        <Text className="text-sm text-purple-100">
          Earn GHS 20 for personal loans and GHS 50 for business loans when friends use your code.
        </Text>
        <View className="h-4" />
        <Pressable onPress={openInvite} className="rounded-full bg-white py-4" accessibilityRole="button">
          <Text className="text-center font-semibold text-purple-700">Invite Now</Text>
        </Pressable>
      </View>

      <View className="h-5" />

      <View className="rounded-3xl bg-white p-5 shadow-sm">
        <Text className="text-lg font-semibold text-gray-900">Why borrow from us?</Text>
        <View className="h-4" />

        <View className="gap-4">
          <View className="flex-row items-start gap-3">
            <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-orange-50">
              <Ionicons name="checkmark" size={18} color="#EA580C" />
            </View>
            <Text className="flex-1 text-sm font-semibold text-gray-700">Low interest rates and flexible repayment.</Text>
          </View>

          <View className="flex-row items-start gap-3">
            <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-orange-50">
              <Ionicons name="checkmark" size={18} color="#EA580C" />
            </View>
            <Text className="flex-1 text-sm font-semibold text-gray-700">Instant approval and quick cash out.</Text>
          </View>

          <View className="flex-row items-start gap-3">
            <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-orange-50">
              <Ionicons name="checkmark" size={18} color="#EA580C" />
            </View>
            <Text className="flex-1 text-sm font-semibold text-gray-700">Secure and transparent process.</Text>
          </View>
        </View>
      </View>

      <View className="h-5" />

      <Pressable onPress={() => void openWhatsApp()} accessibilityRole="button" className="rounded-3xl bg-white p-5 shadow-sm">
        <Text className="text-lg font-semibold text-gray-900">Need Help?</Text>
        <View className="h-2" />
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-sm text-gray-600">Chat with our support team on WhatsApp</Text>
          </View>
          <View className="h-12 w-12 items-center justify-center rounded-full bg-green-50">
            <Ionicons name="logo-whatsapp" size={26} color="#16A34A" />
          </View>
        </View>
      </Pressable>

      <Modal visible={inviteMounted} transparent animationType="none" onRequestClose={closeInvite}>
        <View className="flex-1 justify-end">
          <Pressable onPress={closeInvite} className="absolute inset-0 bg-black/40" accessibilityRole="button" />

          <Animated.View style={{ transform: [{ translateY }] }} className="rounded-t-3xl bg-white px-5 pb-10 pt-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-gray-900">Invite a friend and earn money</Text>
              <Pressable onPress={closeInvite} accessibilityRole="button" className="h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                <Ionicons name="close" size={18} color="#111827" />
              </Pressable>
            </View>

            <View className="h-5" />

            <View className="flex-row gap-3">
              <View className="flex-1 rounded-2xl border border-gray-100 bg-white p-4">
                <Text className="text-center text-sm text-gray-500">Friends Invited</Text>
                <View className="h-2" />
                <Text className="text-center text-2xl font-semibold text-gray-900">
                  {inviteLoading ? '...' : String(inviteSnapshot.friendsInvited)}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl border border-gray-100 bg-white p-4">
                <Text className="text-center text-sm text-gray-500">Money Earned</Text>
                <View className="h-2" />
                <Text className="text-center text-2xl font-semibold text-gray-900">
                  {inviteLoading ? '...' : `GHS ${inviteSnapshot.moneyEarned}`}
                </Text>
              </View>
            </View>

            <View className="h-5" />

            <View className="rounded-2xl border border-gray-100 bg-white p-5">
              <Text className="text-base font-semibold text-gray-900">How it Works</Text>
              <View className="h-4" />

              <View className="gap-3">
                <View className="flex-row gap-3">
                  <View className="h-7 w-7 items-center justify-center rounded-full bg-gray-100">
                    <Text className="font-semibold text-gray-700">1</Text>
                  </View>
                  <Text className="flex-1 text-gray-700">Invite your friend by sharing your referral code with them</Text>
                </View>
                <View className="flex-row gap-3">
                  <View className="h-7 w-7 items-center justify-center rounded-full bg-gray-100">
                    <Text className="font-semibold text-gray-700">2</Text>
                  </View>
                  <Text className="flex-1 text-gray-700">They register and take their first loan on MONaD Financing</Text>
                </View>
                <View className="flex-row gap-3">
                  <View className="h-7 w-7 items-center justify-center rounded-full bg-gray-100">
                    <Text className="font-semibold text-gray-700">3</Text>
                  </View>
                  <Text className="flex-1 text-gray-700">You earn rewards after they repay and admin confirms payout</Text>
                </View>
              </View>
            </View>

            <View className="h-5" />

            <View className="flex-row items-center justify-between rounded-full border border-gray-200 bg-white px-4 py-3">
              <Text className="font-semibold text-gray-900">{inviteSnapshot.referralCode ?? '—'}</Text>
              <Pressable
                onPress={() => {
                  void (async () => {
                    if (!inviteSnapshot.referralCode) return;
                    try {
                      await Clipboard.setStringAsync(inviteSnapshot.referralCode);
                      Alert.alert('Referral code copied');
                    } catch {
                      Alert.alert('Copy failed');
                    }
                  })();
                }}
                accessibilityRole="button"
                className="flex-row items-center gap-2 rounded-full bg-purple-600 px-4 py-2"
              >
                <Ionicons name="copy-outline" size={16} color="#FFFFFF" />
                <Text className="font-semibold text-white">Copy</Text>
              </Pressable>
            </View>

            <View className="h-6" />

            <Pressable
              onPress={() => {
                void (async () => {
                  const code = inviteSnapshot.referralCode;
                  if (!code) return;
                  const message = `Use my MONaD Financing referral code: ${code}`;
                  try {
                    await Share.share({ message });
                  } catch {
                    // ignore
                  }
                })();
              }}
              accessibilityRole="button"
              className="rounded-full bg-purple-600 py-4"
            >
              <Text className="text-center text-base font-semibold text-white">Share Referral Code</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>
  );
}
