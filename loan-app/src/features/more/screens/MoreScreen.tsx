import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useMemo, useRef, useState } from 'react';
import { Alert, Animated, Linking, Modal, Pressable, ScrollView, Share, Text, View } from 'react-native';

import { useApiClient } from '../../../hooks/useApiClient';
import type { ApiEnvelope } from '../../../types/api';

type ReferralSummary = {
  referralCode: string | null;
  friendsInvited: number;
  moneyEarned: number;
  pendingRewards: number;
};

function Bullet({ text }: { text: string }) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-orange-50">
        <Ionicons name="checkmark" size={16} color="#F97316" />
      </View>
      <Text className="flex-1 text-gray-700">{text}</Text>
    </View>
  );
}

function InfoCard(props: { title: string; subtitle: string; icon: any; iconBg: string; iconColor: string }) {
  return (
    <View className="flex-row items-center justify-between rounded-2xl border border-gray-100 bg-white p-5">
      <View className="flex-1 pr-4">
        <Text className="text-lg font-semibold text-gray-900">{props.title}</Text>
        <View className="h-1" />
        <Text className="text-gray-600">{props.subtitle}</Text>
      </View>
      <View className={`h-12 w-12 items-center justify-center rounded-full ${props.iconBg}`}>
        <Ionicons name={props.icon} size={22} color={props.iconColor} />
      </View>
    </View>
  );
}

export default function MoreScreen() {
  const router = useRouter();
  const api = useApiClient();

  const [inviteMounted, setInviteMounted] = useState(false);
  const translateY = useRef(new Animated.Value(700)).current;

  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteData, setInviteData] = useState<ReferralSummary | null>(null);

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

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-5 pb-10 pt-8">
      <Text className="text-3xl font-semibold text-gray-900">More</Text>
      <View className="h-5" />

      <View className="rounded-2xl bg-purple-600 p-5">
        <Text className="text-lg font-semibold text-white">Invite friends, earn cash!</Text>
        <View className="h-2" />
        <Text className="text-white/90">Earn GHS 20 for personal loans and GHS 50 for business loans when friends use your code.</Text>
        <View className="h-4" />
        <Pressable onPress={openInvite} className="rounded-full bg-white py-3" accessibilityRole="button">
          <Text className="text-center font-semibold text-purple-700">Invite Now</Text>
        </Pressable>
      </View>

      <View className="h-5" />

      <View className="rounded-2xl border border-gray-100 bg-white p-5">
        <Text className="text-lg font-semibold text-gray-900">Why borrow from Us?</Text>
        <View className="h-4" />
        <View className="gap-3">
          <Bullet text="Low interest rates and flexible repayment." />
          <Bullet text="Instant approval and quick cash out." />
          <Bullet text="Secure and transparent process." />
        </View>
      </View>

      <View className="h-5" />

      <Pressable onPress={() => router.push('/(app)/about')} accessibilityRole="button">
        <InfoCard
          title="About MONaD FINANCING"
          subtitle="Learn more about our mission and values"
          icon="information"
          iconBg="bg-blue-50"
          iconColor="#2563EB"
        />
      </Pressable>

      <View className="h-4" />

      <Pressable onPress={() => void openWhatsApp()} accessibilityRole="button">
        <InfoCard
          title="Need Help?"
          subtitle="Chat with our support team on WhatsApp"
          icon="logo-whatsapp"
          iconBg="bg-green-50"
          iconColor="#22C55E"
        />
      </Pressable>

      <View className="h-4" />

      <Pressable onPress={() => router.push('/(app)/faqs')} accessibilityRole="button">
        <InfoCard
          title="FAQs"
          subtitle="Find answers to commonly asked questions"
          icon="help"
          iconBg="bg-gray-100"
          iconColor="#6B7280"
        />
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
