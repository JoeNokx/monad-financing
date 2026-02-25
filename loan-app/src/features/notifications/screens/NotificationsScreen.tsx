import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useApiClient } from '../../../hooks/useApiClient';
import type { ApiEnvelope } from '../../../types/api';
import type { Loan } from '../../../types/loan';
import type { Notification } from '../../../types/notification';
import type { Transaction } from '../../../types/transaction';
import { getSecureItem, setSecureItem } from '../../../services/secure.storage';
import { useSecurity } from '../../security/security.session';
import { daysUntil, formatGhs, toNumber } from '../../../utils/format';

type UiNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isUnread: boolean;
  iconName: any;
  iconBg: string;
  iconColor: string;
  loanId?: string;
};

function timeAgo(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const ms = now.getTime() - d.getTime();
  if (!Number.isFinite(ms)) return '';

  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  const wk = Math.floor(day / 7);

  if (wk > 0) return `${wk} week${wk === 1 ? '' : 's'} ago`;
  if (day > 0) return `${day} day${day === 1 ? '' : 's'} ago`;
  if (hr > 0) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  if (min > 0) return `${min} min${min === 1 ? '' : 's'} ago`;
  return 'Just now';
}

function loanTypeLabel(loanType: string) {
  const lower = loanType.toLowerCase();
  if (lower.includes('personal')) return 'personal';
  if (lower.includes('business')) return 'business';
  return 'loan';
}

function normalizeApiNotif(n: Notification): UiNotification {
  const type = String(n.type ?? '').toUpperCase();
  const title =
    type.includes('KYC') ? 'KYC Update' :
    type.includes('PAYMENT') ? 'Payment Update' :
    type.includes('LOAN') ? 'Loan Update' :
    type.replace(/_/g, ' ').trim() || 'Notification';

  return {
    id: `api_${n.id}`,
    title,
    message: n.message,
    createdAt: n.createdAt,
    isUnread: !n.isRead,
    iconName: type.includes('KYC') ? 'notifications-outline' : type.includes('PAYMENT') ? 'checkmark-circle' : 'checkmark-circle',
    iconBg: type.includes('KYC') ? 'bg-blue-50' : type.includes('PAYMENT') ? 'bg-emerald-50' : 'bg-emerald-50',
    iconColor: type.includes('KYC') ? '#2563EB' : type.includes('PAYMENT') ? '#16A34A' : '#16A34A',
  };
}

export default function NotificationsScreen() {
  const router = useRouter();
  const api = useApiClient();
  const { appData, refreshAppData } = useSecurity();

  const userId = appData?.me?.id ?? 'anonymous';
  const readKey = `notifications_read_v1_${userId}`;

  const [apiNotifs, setApiNotifs] = useState<Notification[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [readIds, setReadIds] = useState<Record<string, true>>({});
  const [markingAll, setMarkingAll] = useState(false);

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
  }, [readKey]);

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
  }, [api]);

  const derived = useMemo(() => {
    const items: UiNotification[] = [];

    const loans: Loan[] = appData?.loans ?? [];
    const kyc = appData?.kyc;

    for (const loan of loans) {
      if (loan.status === 'ACTIVE') {
        const createdAt = (loan as any).disbursedAt ?? (loan as any).approvedAt ?? loan.createdAt;
        items.push({
          id: `loan_approved_${loan.id}`,
          title: 'Loan Approved',
          message: `Your ${loanTypeLabel(loan.loanType)} loan of ${formatGhs(loan.originalAmount)} has been approved and disbursed`,
          createdAt,
          isUnread: true,
          iconName: 'checkmark',
          iconBg: 'bg-emerald-50',
          iconColor: '#16A34A',
          loanId: String(loan.id),
        });

        const days = daysUntil(loan.dueDate);
        if (days === 3) {
          const created = new Date(new Date(loan.dueDate).getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
          items.push({
            id: `payment_due_soon_${loan.id}`,
            title: 'Payment Due Soon',
            message: `Your loan payment of ${formatGhs(loan.remainingBalance)} is due in 3 days`,
            createdAt: created,
            isUnread: true,
            iconName: 'time-outline',
            iconBg: 'bg-blue-50',
            iconColor: '#2563EB',
            loanId: String(loan.id),
          });
        }

        if (days < 0 && toNumber(loan.remainingBalance) > 0) {
          items.push({
            id: `payment_overdue_${loan.id}`,
            title: 'Payment Overdue',
            message: `Your loan payment is overdue. Outstanding balance: ${formatGhs(loan.remainingBalance)}`,
            createdAt: loan.dueDate,
            isUnread: true,
            iconName: 'alert-circle-outline',
            iconBg: 'bg-orange-50',
            iconColor: '#EA580C',
            loanId: String(loan.id),
          });
        }
      }

      if (loan.status === 'COMPLETED') {
        const createdAt = loan.completedAt ?? loan.createdAt;
        items.push({
          id: `loan_repaid_${loan.id}`,
          title: 'Loan Repaid',
          message: `Your loan has been fully repaid. Thank you!`,
          createdAt,
          isUnread: true,
          iconName: 'checkmark',
          iconBg: 'bg-emerald-50',
          iconColor: '#16A34A',
          loanId: String(loan.id),
        });
      }
    }

    for (const t of txs) {
      const status = String((t as any).status ?? '').toUpperCase();
      if (status !== 'SUCCESS') continue;
      const loanId = (t as any).loanId ? String((t as any).loanId) : undefined;
      items.push({
        id: `payment_received_${t.id}`,
        title: 'Payment Received',
        message: `We received your payment of ${formatGhs(t.amount)}. Thank you!`,
        createdAt: (t as any).createdAt,
        isUnread: true,
        iconName: 'checkmark',
        iconBg: 'bg-emerald-50',
        iconColor: '#16A34A',
        loanId,
      });
    }

    if (kyc) {
      if (kyc.status === 'APPROVED') {
        items.push({
          id: `kyc_verified`,
          title: 'KYC Verified',
          message: 'Your account has been successfully verified',
          createdAt: kyc.data?.createdAt ?? new Date().toISOString(),
          isUnread: true,
          iconName: 'notifications-outline',
          iconBg: 'bg-blue-50',
          iconColor: '#2563EB',
        });
      }
      if (kyc.status === 'PENDING' && kyc.hasSubmission) {
        items.push({
          id: `kyc_under_review`,
          title: 'KYC Under Review',
          message: 'Your verification documents are under review',
          createdAt: kyc.data?.createdAt ?? new Date().toISOString(),
          isUnread: true,
          iconName: 'time-outline',
          iconBg: 'bg-blue-50',
          iconColor: '#2563EB',
        });
      }
      if (kyc.status === 'REJECTED') {
        items.push({
          id: `kyc_rejected`,
          title: 'KYC Verification Failed',
          message: 'Your verification was rejected. Please resubmit your documents.',
          createdAt: kyc.data?.createdAt ?? new Date().toISOString(),
          isUnread: true,
          iconName: 'alert-circle-outline',
          iconBg: 'bg-orange-50',
          iconColor: '#EA580C',
        });
      }
    }

    return items;
  }, [appData?.kyc, appData?.loans, txs]);

  const combined = useMemo(() => {
    const items: UiNotification[] = [];

    for (const n of apiNotifs) {
      items.push(normalizeApiNotif(n));
    }

    items.push(...derived);

    const uniq = new Map<string, UiNotification>();
    for (const i of items) {
      if (!uniq.has(i.id)) uniq.set(i.id, i);
    }

    const list = Array.from(uniq.values()).map((i) => {
      const isUnread = i.isUnread && !readIds[i.id];
      return { ...i, isUnread };
    });

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return list;
  }, [apiNotifs, derived, readIds]);

  const markRead = (id: string) => {
    const next = { ...readIds, [id]: true };
    setReadIds(next);
    void setSecureItem(readKey, JSON.stringify(Object.keys(next)));
    refreshAppData();
  };

  const markAllRead = () => {
    void (async () => {
      try {
        if (markingAll) return;
        setMarkingAll(true);

        const next: Record<string, true> = { ...readIds };
        for (const n of combined) next[n.id] = true;
        setReadIds(next);
        await setSecureItem(readKey, JSON.stringify(Object.keys(next)));
        refreshAppData();

        try {
          await api.request<ApiEnvelope<unknown>>({ method: 'POST', path: '/api/notifications/read' });
        } catch {
          // ignore
        }

        setApiNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } finally {
        setMarkingAll(false);
      }
    })();
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-5 pb-10 pt-12">
      <View className="flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>

        <Text className="text-base font-semibold text-gray-900">Notifications</Text>

        <View className="w-28 items-end">
          <Pressable onPress={markAllRead} accessibilityRole="button" disabled={markingAll || combined.length === 0} hitSlop={10}>
            <Text className={`text-sm font-semibold ${markingAll || combined.length === 0 ? 'text-gray-300' : 'text-purple-700'}`}>Mark all</Text>
          </Pressable>
        </View>
      </View>

      <View className="h-6" />

      <View className="gap-4">
        {combined.length === 0 ? (
          <View className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
            <Text className="text-base font-semibold text-gray-900">No notifications</Text>
            <View className="h-1" />
            <Text className="text-gray-600">Updates about your loans and verification will appear here.</Text>
          </View>
        ) : null}

        {combined.map((n) => (
          <Pressable
            key={n.id}
            accessibilityRole="button"
            onPress={() => {
              markRead(n.id);
            }}
            className={`rounded-2xl border px-4 py-4 ${n.isUnread ? 'border-blue-600 bg-white' : 'border-gray-100 bg-white'}`}
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-row items-start gap-3">
                <View className={`h-10 w-10 items-center justify-center rounded-full ${n.iconBg}`}>
                  <Ionicons name={n.iconName} size={20} color={n.iconColor} />
                </View>

                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">{n.title}</Text>
                  <View className="h-1" />
                  <Text className="text-gray-500">{n.message}</Text>
                  <View className="h-2" />
                  <Text className="text-xs text-gray-400">{timeAgo(n.createdAt)}</Text>
                </View>
              </View>

              {n.isUnread ? <View className="mt-1 h-2 w-2 rounded-full bg-blue-700" /> : null}
            </View>
          </Pressable>
        ))}
      </View>

    </ScrollView>
  );
}
