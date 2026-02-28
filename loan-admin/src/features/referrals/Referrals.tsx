import { useMemo, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Spinner } from '../../components/common/Spinner';
import { Table } from '../../components/common/Table';
import api from '../../lib/api';
import type { ApiEnvelope } from '../../types/api';

type ReferralReward = {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  loanId: string;
  loanType: string;
  rewardAmount: string | number;
  status: 'PENDING' | 'PAID' | string;
  paidAt?: string | null;
  createdAt: string;
  referrer?: {
    id: string;
    email: string;
    referralCode?: string | null;
  };
  referred?: {
    id: string;
    email: string;
  };
  loan?: {
    id: string;
    status: string;
    loanType: string;
    createdAt: string;
    completedAt?: string | null;
  };
};

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function Referrals() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const rewardsQuery = useQuery({
    queryKey: ['admin', 'referrals', 'rewards'],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<ReferralReward[]>>('/admin/referrals/rewards');
      return res.data.data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (args: { rewardId: string; status: 'PENDING' | 'PAID' }) => {
      await api.patch(`/admin/referrals/rewards/${args.rewardId}/status`, { status: args.status });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'referrals', 'rewards'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'referrals'] });
    },
  });

  const list = useMemo(() => {
    const items = rewardsQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) => {
      const referrerEmail = (r.referrer?.email ?? '').toLowerCase();
      const referredEmail = (r.referred?.email ?? '').toLowerCase();
      const status = (r.status ?? '').toLowerCase();
      return referrerEmail.includes(q) || referredEmail.includes(q) || status.includes(q) || r.loanId.toLowerCase().includes(q);
    });
  }, [rewardsQuery.data, search]);

  const groupedByReferrer = useMemo(() => {
    const map = new Map<string, { referrer: ReferralReward['referrer']; pending: number; paid: number; countPending: number; countPaid: number }>();
    for (const r of list) {
      const referrerId = r.referrerUserId;
      const entry = map.get(referrerId) ?? { referrer: r.referrer, pending: 0, paid: 0, countPending: 0, countPaid: 0 };
      if (r.status === 'PAID') {
        entry.paid += toNumber(r.rewardAmount);
        entry.countPaid += 1;
      } else {
        entry.pending += toNumber(r.rewardAmount);
        entry.countPending += 1;
      }
      entry.referrer = entry.referrer ?? r.referrer;
      map.set(referrerId, entry);
    }
    return Array.from(map.entries()).map(([referrerUserId, v]) => ({ referrerUserId, ...v }));
  }, [list]);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold text-slate-900">Referrals</div>
        <div className="mt-1 text-sm text-slate-600">Track referral rewards and mark payouts as paid.</div>
      </div>

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:max-w-md">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by referrer email, referred email, status, or loan id..." />
          </div>
        </div>

        <div className="mt-4">
          {rewardsQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Spinner />
              Loading referrals...
            </div>
          ) : rewardsQuery.isError ? (
            <div className="text-sm text-slate-600">Failed to load referral rewards.</div>
          ) : list.length === 0 ? (
            <div className="text-sm text-slate-600">No referral rewards yet.</div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="mb-2 text-sm font-semibold text-slate-900">Referrers to pay</div>
                <div className="overflow-x-auto">
                  <Table>
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Referrer</th>
                        <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Referral Code</th>
                        <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Pending (GH₵)</th>
                        <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Paid (GH₵)</th>
                        <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Pending Rewards</th>
                        <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Paid Rewards</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedByReferrer.map((r) => (
                        <tr key={r.referrerUserId} className="border-b border-slate-100">
                          <td className="py-3 pr-4 text-sm text-slate-700">{r.referrer?.email ?? r.referrerUserId}</td>
                          <td className="py-3 pr-4 text-sm text-slate-700">{r.referrer?.referralCode ?? '—'}</td>
                          <td className="py-3 pr-4 text-sm text-slate-700">{r.pending.toFixed(2)}</td>
                          <td className="py-3 pr-4 text-sm text-slate-700">{r.paid.toFixed(2)}</td>
                          <td className="py-3 pr-4 text-sm text-slate-700">
                            <Badge>{r.countPending}</Badge>
                          </td>
                          <td className="py-3 pr-4 text-sm text-slate-700">
                            <Badge>{r.countPaid}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-semibold text-slate-900">Rewards</div>
                <div className="overflow-x-auto">
                  <Table>
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Referrer</th>
                        <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Referred</th>
                        <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Loan</th>
                        <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Amount (GH₵)</th>
                        <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Status</th>
                        <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Created</th>
                        <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.slice(0, 200).map((r) => {
                        const canMarkPaid = r.status !== 'PAID' && (r.loan?.status === 'COMPLETED' || !r.loan);
                        const canMarkPending = r.status === 'PAID';
                        return (
                          <tr key={r.id} className="border-b border-slate-100">
                            <td className="py-3 pr-4 text-sm text-slate-700">{r.referrer?.email ?? r.referrerUserId}</td>
                            <td className="py-3 pr-4 text-sm text-slate-700">{r.referred?.email ?? r.referredUserId}</td>
                            <td className="py-3 pr-4 text-sm text-slate-700">
                              <Link to={`/loans/${r.loanId}`} className="font-medium text-slate-900 hover:underline">
                                {r.loanId.slice(0, 8)}…
                              </Link>
                            </td>
                            <td className="py-3 pr-4 text-sm text-slate-700">{toNumber(r.rewardAmount).toFixed(2)}</td>
                            <td className="py-3 pr-4 text-sm text-slate-700">
                              <Badge>{r.status}</Badge>
                            </td>
                            <td className="py-3 pr-4 text-sm text-slate-700">{new Date(r.createdAt).toLocaleString()}</td>
                            <td className="py-3 pr-4 text-sm text-slate-700">
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  disabled={updateStatus.isPending || !canMarkPending}
                                  onClick={() => updateStatus.mutate({ rewardId: r.id, status: 'PENDING' })}
                                >
                                  Mark Pending
                                </Button>
                                <Button type="button" disabled={updateStatus.isPending || !canMarkPaid} onClick={() => updateStatus.mutate({ rewardId: r.id, status: 'PAID' })}>
                                  Mark Paid
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>

                {updateStatus.isError ? <div className="mt-3 text-sm text-rose-600">Failed to update reward status.</div> : null}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
