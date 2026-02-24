import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Input } from '../../../components/ui/Input';
import { useApiClient } from '../../../hooks/useApiClient';
import type { ApiEnvelope } from '../../../types/api';
import type { ProfileMeResponse, ProfileUpsertPatch } from '../../../types/profile';
import { getSecureItem, setSecureItem } from '../../../services/secure.storage';
import { useSecurity } from '../../security/security.session';

type Network = 'MTN' | 'Telecel' | 'AirtelTigo';

type MoMoAccount = {
  id: string;
  network: Network;
  number: string;
  name: string;
  isPrimary: boolean;
};

function pillClasses(network: Network) {
  if (network === 'MTN') return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
  if (network === 'Telecel') return { bg: 'bg-red-100', text: 'text-red-700' };
  return { bg: 'bg-blue-100', text: 'text-blue-700' };
}

export default function MobileMoneyScreen() {
  const router = useRouter();
  const api = useApiClient();
  const { appData, setAppData } = useSecurity();

  const userId = appData?.me?.id ?? 'anonymous';
  const storageKey = `momo_accounts_v1_${userId}`;

  const [accounts, setAccounts] = useState<MoMoAccount[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [network, setNetwork] = useState<Network | ''>('');
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const primary = useMemo(() => accounts.find((a) => a.isPrimary) ?? null, [accounts]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const raw = await getSecureItem(storageKey);
        const parsed = raw ? (JSON.parse(raw) as MoMoAccount[]) : [];

        const profile = appData?.profileMe.profile;
        const profilePrimary: MoMoAccount | null =
          profile?.mobileNetwork && profile?.mobileNumber && profile?.mobileName
            ? {
                id: 'profile_primary',
                network: profile.mobileNetwork,
                number: profile.mobileNumber,
                name: profile.mobileName,
                isPrimary: true,
              }
            : null;

        const normalized = Array.isArray(parsed) ? parsed.filter((a) => a && typeof a.id === 'string') : [];

        let next = normalized;

        if (profilePrimary) {
          const idx = next.findIndex((a) => a.id === 'profile_primary');
          if (idx >= 0) {
            next = next.map((a) => (a.id === 'profile_primary' ? profilePrimary : a));
          } else {
            next = [profilePrimary, ...next];
          }

          next = next.map((a) => ({ ...a, isPrimary: a.id === 'profile_primary' }));
        } else if (next.length > 0 && !next.some((a) => a.isPrimary)) {
          next = next.map((a, i) => ({ ...a, isPrimary: i === 0 }));
        }

        if (!cancelled) {
          setAccounts(next);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setAccounts([]);
          setLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [appData?.profileMe.profile?.mobileName, appData?.profileMe.profile?.mobileNetwork, appData?.profileMe.profile?.mobileNumber, storageKey]);

  const persist = async (next: MoMoAccount[]) => {
    setAccounts(next);
    await setSecureItem(storageKey, JSON.stringify(next));
  };

  const openAdd = () => {
    setEditingId(null);
    setNetwork('');
    setNumber('');
    setName('');
    setEditorOpen(true);
  };

  const openEdit = (acc: MoMoAccount) => {
    setEditingId(acc.id);
    setNetwork(acc.network);
    setNumber(acc.number);
    setName(acc.name);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
  };

  const syncPrimaryToProfile = async (acc: MoMoAccount) => {
    const patch: ProfileUpsertPatch = {
      mobileNetwork: acc.network,
      mobileNumber: acc.number,
      mobileName: acc.name,
    };

    const res = await api.request<ApiEnvelope<ProfileMeResponse>>({ method: 'PUT', path: '/api/profile/me', body: patch });
    setAppData((prev) => {
      if (!prev) return prev;
      return { ...prev, profileMe: res.data };
    });
  };

  const setPrimary = (id: string) => {
    void (async () => {
      const acc = accounts.find((a) => a.id === id);
      if (!acc) return;

      const next = accounts.map((a) => ({ ...a, isPrimary: a.id === id }));
      try {
        await persist(next);
        await syncPrimaryToProfile({ ...acc, isPrimary: true });
      } catch (e: any) {
        Alert.alert('Mobile Money', e?.message ?? 'Failed to update primary account');
      }
    })();
  };

  const removeAccount = (id: string) => {
    void (async () => {
      const acc = accounts.find((a) => a.id === id);
      if (!acc) return;

      if (accounts.length <= 1) {
        Alert.alert('Mobile Money', 'You must keep at least one mobile money account.');
        return;
      }

      const remaining = accounts.filter((a) => a.id !== id);
      let next = remaining;

      if (acc.isPrimary) {
        next = remaining.map((a, idx) => ({ ...a, isPrimary: idx === 0 }));
      }

      try {
        await persist(next);

        const newPrimary = next.find((a) => a.isPrimary);
        if (newPrimary) {
          await syncPrimaryToProfile(newPrimary);
        }
      } catch (e: any) {
        Alert.alert('Mobile Money', e?.message ?? 'Failed to delete account');
      }
    })();
  };

  const saveEditor = () => {
    void (async () => {
      if (network === '' || number.trim().length < 7 || name.trim().length < 2) {
        Alert.alert('Mobile Money', 'Please complete all fields');
        return;
      }

      try {
        setSaving(true);

        const isNew = !editingId;
        const id = editingId ?? `acc_${Date.now()}`;

        const base: MoMoAccount = {
          id,
          network: network as Network,
          number: number.trim(),
          name: name.trim(),
          isPrimary: isNew ? accounts.length === 0 : Boolean(accounts.find((a) => a.id === id)?.isPrimary),
        };

        let next = accounts;
        const existingIdx = next.findIndex((a) => a.id === id);
        if (existingIdx >= 0) {
          next = next.map((a) => (a.id === id ? { ...a, ...base } : a));
        } else {
          next = [...next, base];
        }

        if (!next.some((a) => a.isPrimary)) {
          next = next.map((a, idx) => ({ ...a, isPrimary: idx === 0 }));
        }

        await persist(next);

        const nextPrimary = next.find((a) => a.isPrimary);
        if (nextPrimary) {
          await syncPrimaryToProfile(nextPrimary);
        }

        setEditorOpen(false);
      } catch (e: any) {
        Alert.alert('Mobile Money', e?.message ?? 'Failed to save');
      } finally {
        setSaving(false);
      }
    })();
  };

  return (
    <View className="flex-1 bg-white">
      <View className="px-5 pt-12">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <Ionicons name="arrow-back" size={20} color="#111827" />
            </Pressable>
            <Text className="text-xl font-semibold text-gray-900">Mobile Money</Text>
          </View>

          <Pressable onPress={openAdd} accessibilityRole="button" className="flex-row items-center gap-2">
            <Ionicons name="add" size={20} color="#7C3AED" />
            <Text className="font-semibold text-purple-700">Add</Text>
          </Pressable>
        </View>

        <View className="h-5" />

        <View className="rounded-2xl bg-purple-50 p-5">
          <Text className="text-base font-semibold text-gray-900">Mobile Money Accounts</Text>
          <View className="h-1" />
          <Text className="text-gray-600">Add your mobile money accounts for loan disbursement and repayment. Your primary account will be used by default.</Text>
        </View>

        <View className="h-5" />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-10">
        <View className="gap-4">
          {loaded && accounts.length === 0 ? (
            <View className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <Text className="font-semibold text-gray-900">No accounts yet</Text>
              <View className="h-1" />
              <Text className="text-gray-600">Tap Add to link a mobile money account.</Text>
            </View>
          ) : null}

          {accounts.map((acc) => {
            const pill = pillClasses(acc.network);

            return (
              <Pressable key={acc.id} onPress={() => openEdit(acc)} accessibilityRole="button" className="rounded-2xl border border-gray-100 bg-white p-5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View className={`rounded-full px-3 py-1 ${pill.bg}`}>
                      <Text className={`text-xs font-semibold ${pill.text}`}>{acc.network}</Text>
                    </View>
                    {acc.isPrimary ? (
                      <View className="flex-row items-center gap-1 rounded-full bg-purple-100 px-3 py-1">
                        <Ionicons name="checkmark" size={14} color="#7C3AED" />
                        <Text className="text-xs font-semibold text-purple-700">Primary</Text>
                      </View>
                    ) : null}
                  </View>

                  <Pressable onPress={() => removeAccount(acc.id)} accessibilityRole="button" hitSlop={10}>
                    <Ionicons name="trash-outline" size={20} color="#DC2626" />
                  </Pressable>
                </View>

                <View className="h-3" />
                <Text className="text-2xl font-semibold text-gray-900">{acc.number}</Text>

                {!acc.isPrimary ? (
                  <>
                    <View className="h-4" />
                    <Pressable
                      onPress={() => setPrimary(acc.id)}
                      accessibilityRole="button"
                      className="items-center rounded-xl border border-purple-200 bg-white py-3"
                    >
                      <Text className="font-semibold text-purple-700">Set as Primary</Text>
                    </Pressable>
                  </>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={editorOpen} transparent animationType="fade" onRequestClose={closeEditor}>
        <View className="flex-1 items-center justify-center bg-black/40 px-5">
          <View className="w-full rounded-2xl bg-white p-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-gray-900">{editingId ? 'Edit Account' : 'Add Account'}</Text>
              <Pressable onPress={closeEditor} accessibilityRole="button" className="h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                <Ionicons name="close" size={18} color="#111827" />
              </Pressable>
            </View>

            <View className="h-5" />

            <View>
              <Text className="mb-2 text-sm font-semibold text-gray-700">Network</Text>
              <View className="flex-row gap-2">
                {(['MTN', 'Telecel', 'AirtelTigo'] as const).map((n) => {
                  const active = network === n;
                  return (
                    <Pressable
                      key={n}
                      onPress={() => setNetwork(n)}
                      accessibilityRole="button"
                      className={`rounded-full px-4 py-2 ${active ? 'bg-purple-600' : 'bg-gray-100'}`}
                    >
                      <Text className={`font-semibold ${active ? 'text-white' : 'text-gray-700'}`}>{n}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="h-4" />

            <View className="gap-3">
              <Input value={number} placeholder="Mobile money number" onChangeText={setNumber} />
              <Input value={name} placeholder="Account name" onChangeText={setName} />
            </View>

            <View className="h-6" />

            <Pressable
              onPress={saveEditor}
              accessibilityRole="button"
              disabled={saving}
              className={`rounded-full py-4 ${saving ? 'bg-gray-300' : 'bg-purple-600'}`}
            >
              <Text className="text-center text-base font-semibold text-white">{saving ? 'Saving...' : 'Save'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
