import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';

import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Spinner } from '../../components/common/Spinner';
import { Table } from '../../components/common/Table';
import api from '../../lib/api';
import type { ApiEnvelope } from '../../types/api';

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

type AdminLoan = {
  id: string;
  status: 'ACTIVE' | 'COMPLETED' | 'DEFAULTED' | 'CANCELLED' | string;
  originalAmount: string | number;
  remainingBalance: string | number;
  createdAt: string;
  dueDate: string;
  userId?: string;
  user?: { id: string };
};

type AdminKyc = {
  id: string;
  userId: string;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  createdAt: string;
};

type AdminTransaction = {
  id: string;
  amount: string | number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | string;
  createdAt: string;
  userId?: string;
  user?: { id: string };
};

function toNumber(value: string | number) {
  if (typeof value === 'number') return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function UserDetail() {
  const { userId } = useParams();

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<AdminUser[]>>('/admin/users');
      return res.data.data;
    },
  });

  const loansQuery = useQuery({
    queryKey: ['admin', 'loans'],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<AdminLoan[]>>('/admin/loans');
      return res.data.data;
    },
  });

  const kycQuery = useQuery({
    queryKey: ['admin', 'kyc'],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<AdminKyc[]>>('/admin/kyc');
      return res.data.data;
    },
  });

  const transactionsQuery = useQuery({
    queryKey: ['admin', 'transactions'],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<AdminTransaction[]>>('/admin/transactions');
      return res.data.data;
    },
  });

  const isLoading = usersQuery.isLoading || loansQuery.isLoading || kycQuery.isLoading || transactionsQuery.isLoading;
  const isError = usersQuery.isError || loansQuery.isError || kycQuery.isError || transactionsQuery.isError;

  const user = (usersQuery.data ?? []).find((u) => u.id === userId);

  const userLoans = useMemo(() => {
    if (!userId) return [];
    return (loansQuery.data ?? []).filter((l) => (l.user?.id ?? l.userId) === userId);
  }, [loansQuery.data, userId]);

  const userKyc = useMemo(() => {
    if (!userId) return undefined;
    return (kycQuery.data ?? []).find((k) => k.userId === userId);
  }, [kycQuery.data, userId]);

  const userTransactions = useMemo(() => {
    if (!userId) return [];
    return (transactionsQuery.data ?? []).filter((t) => (t.user?.id ?? t.userId) === userId);
  }, [transactionsQuery.data, userId]);

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Spinner />
          Loading user...
        </div>
      </Card>
    );
  }

  if (isError || !userId || !user) {
    return (
      <Card>
        <div className="text-base font-semibold text-slate-900">User not found</div>
        <div className="mt-2 text-sm text-slate-600">
          <Link to="/users" className="text-slate-900 underline">
            Back to users
          </Link>
        </div>
      </Card>
    );
  }

  const roles = (user.roles ?? []).map((r) => r.role.name).join(', ');
  const totalLoanAmount = userLoans.reduce((sum, l) => sum + toNumber(l.originalAmount), 0);
  const activeLoans = userLoans.filter((l) => l.status === 'ACTIVE').length;
  const successfulPayments = userTransactions.filter((t) => t.status === 'SUCCESS').reduce((sum, t) => sum + toNumber(t.amount), 0);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-base font-semibold text-slate-900">User Detail</div>
            <div className="mt-1 text-sm text-slate-600">{user.id}</div>
            <div className="mt-2 text-sm text-slate-700">{user.fullName ?? '—'}</div>
            <div className="mt-1 text-sm text-slate-700">{user.email}</div>
            <div className="mt-1 text-sm text-slate-700">{user.phone ?? '—'}</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {user.isBlocked ? <Badge className="bg-rose-50 text-rose-700">Blocked</Badge> : <Badge className="bg-emerald-50 text-emerald-700">Active</Badge>}
            <Badge>Score: {user.creditScore}</Badge>
            <Badge>KYC: {userKyc?.verificationStatus ?? '—'}</Badge>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="text-sm text-slate-700">
            <div className="text-xs font-semibold text-slate-500">Roles</div>
            <div className="mt-1">{roles || '—'}</div>
          </div>
          <div className="text-sm text-slate-700">
            <div className="text-xs font-semibold text-slate-500">Loans</div>
            <div className="mt-1">{userLoans.length} (Active: {activeLoans})</div>
          </div>
          <div className="text-sm text-slate-700">
            <div className="text-xs font-semibold text-slate-500">Successful Payments</div>
            <div className="mt-1">GH₵ {successfulPayments.toFixed(2)}</div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-base font-semibold text-slate-900">Loans</div>
        <div className="mt-3 overflow-x-auto">
          {userLoans.length === 0 ? (
            <div className="text-sm text-slate-600">No loans for this user.</div>
          ) : (
            <Table>
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Loan</th>
                  <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Status</th>
                  <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Amount</th>
                  <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Balance</th>
                  <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Due</th>
                </tr>
              </thead>
              <tbody>
                {userLoans.map((l) => (
                  <tr key={l.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 text-sm text-slate-700">
                      <Link to={`/loans/${l.id}`} className="font-medium text-slate-900 hover:underline">
                        {l.id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-sm text-slate-700">
                      <Badge>{l.status}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-sm text-slate-700">GH₵ {toNumber(l.originalAmount).toFixed(2)}</td>
                    <td className="py-3 pr-4 text-sm text-slate-700">GH₵ {toNumber(l.remainingBalance).toFixed(2)}</td>
                    <td className="py-3 pr-4 text-sm text-slate-700">{new Date(l.dueDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
        <div className="mt-4 text-sm text-slate-600">Total loaned: GH₵ {totalLoanAmount.toFixed(2)}</div>
      </Card>

      <Card>
        <div className="text-base font-semibold text-slate-900">Transactions</div>
        <div className="mt-3 overflow-x-auto">
          {userTransactions.length === 0 ? (
            <div className="text-sm text-slate-600">No transactions for this user.</div>
          ) : (
            <Table>
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Transaction</th>
                  <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Status</th>
                  <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Amount</th>
                  <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Created</th>
                </tr>
              </thead>
              <tbody>
                {userTransactions.slice(0, 20).map((t) => (
                  <tr key={t.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 text-sm text-slate-700">
                      <Link to={`/transactions/${t.id}`} className="font-medium text-slate-900 hover:underline">
                        {t.id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-sm text-slate-700">
                      <Badge>{t.status}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-sm text-slate-700">GH₵ {toNumber(t.amount).toFixed(2)}</td>
                    <td className="py-3 pr-4 text-sm text-slate-700">{new Date(t.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
