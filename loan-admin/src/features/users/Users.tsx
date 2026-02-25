import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Spinner } from '../../components/common/Spinner';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import api from '../../lib/api';
import type { ApiEnvelope } from '../../types/api';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

type AdminUser = {
  id: string;
  email: string;
  phone?: string | null;
  fullName?: string | null;
  isBlocked: boolean;
  creditScore: number;
  createdAt: string;
  roles?: Array<{ role: { name: string } }>;
};

type AdminKyc = {
  userId: string;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
};

export default function Users() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<AdminUser[]>>('/admin/users');
      return res.data.data;
    },
  });

  const kycQuery = useQuery({
    queryKey: ['admin', 'kyc'],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<Array<AdminKyc & { user: { id: string } }>>>('/admin/kyc');
      return res.data.data;
    },
  });

  const blockMutation = useMutation({
    mutationFn: async (args: { userId: string; isBlocked: boolean }) => {
      await api.patch(`/admin/users/${args.userId}/block`, { isBlocked: args.isBlocked });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const kycByUserId = useMemo(() => {
    const map = new Map<string, AdminKyc>();
    for (const k of kycQuery.data ?? []) {
      map.set(k.userId, k);
    }
    return map;
  }, [kycQuery.data]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = usersQuery.data ?? [];
    if (!q) return list;

    return list.filter((u) => {
      const name = (u.fullName ?? '').toLowerCase();
      const email = (u.email ?? '').toLowerCase();
      const phone = (u.phone ?? '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [search, usersQuery.data]);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold text-slate-900">Users</div>
        <div className="mt-1 text-sm text-slate-600">Manage your users.</div>
      </div>
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <div className="w-full max-w-md">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, phone..." />
          </div>
        </div>

        {usersQuery.isLoading || kycQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Spinner />
            Loading users...
          </div>
        ) : usersQuery.isError || kycQuery.isError ? (
          <div className="text-sm text-slate-600">Failed to load users.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Name</th>
                  <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Email</th>
                  <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Phone</th>
                  <th className="py-2 pr-4 text-xs font-semibold text-slate-500">KYC</th>
                  <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Score</th>
                  <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Status</th>
                  <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const kyc = kycByUserId.get(u.id);
                  const kycStatus = kyc?.verificationStatus ?? '—';
                  return (
                    <tr key={u.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4 text-sm text-slate-700">
                        <Link to={`/users/${u.id}`} className="font-medium text-slate-900 hover:underline">
                          {u.fullName ?? '—'}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-sm text-slate-700">{u.email}</td>
                      <td className="py-3 pr-4 text-sm text-slate-700">{u.phone ?? '—'}</td>
                      <td className="py-3 pr-4 text-sm text-slate-700">
                        <Badge>{kycStatus}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-sm text-slate-700">{u.creditScore}</td>
                      <td className="py-3 pr-4 text-sm text-slate-700">
                        {u.isBlocked ? <Badge className="bg-rose-50 text-rose-700">Blocked</Badge> : <Badge className="bg-emerald-50 text-emerald-700">Active</Badge>}
                      </td>
                      <td className="py-3 pr-4 text-sm text-slate-700">
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={blockMutation.isPending}
                          onClick={() => blockMutation.mutate({ userId: u.id, isBlocked: !u.isBlocked })}
                        >
                          {u.isBlocked ? 'Unblock' : 'Block'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
