import { Card } from '../../components/common/Card';
import { Spinner } from '../../components/common/Spinner';
import { BarChart } from '../../components/charts/BarChart';
import api from '../../lib/api';
import type { ApiEnvelope } from '../../types/api';
import { MetricCard } from './MetricCard';
import { RecentActivity } from './RecentActivity';
import { useQuery } from '@tanstack/react-query';

const demoData = [
  { name: 'Mon', value: 2 },
  { name: 'Tue', value: 5 },
  { name: 'Wed', value: 3 },
  { name: 'Thu', value: 7 },
  { name: 'Fri', value: 4 },
];

type AdminUser = {
  id: string;
  email: string;
  phone?: string | null;
  fullName?: string | null;
  isBlocked: boolean;
  creditScore: number;
  createdAt: string;
};

type AdminLoan = {
  id: string;
  status: 'ACTIVE' | 'COMPLETED' | 'DEFAULTED' | 'CANCELLED' | string;
  originalAmount: string | number;
  createdAt: string;
  dueDate: string;
};

type AdminKyc = {
  id: string;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  createdAt: string;
};

type AdminTransaction = {
  id: string;
  amount: string | number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | string;
  createdAt: string;
};

function toNumber(value: string | number) {
  if (typeof value === 'number') return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function Dashboard() {
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
  const error = usersQuery.error || loansQuery.error || kycQuery.error || transactionsQuery.error;

  const users = usersQuery.data ?? [];
  const loans = loansQuery.data ?? [];
  const kycs = kycQuery.data ?? [];
  const transactions = transactionsQuery.data ?? [];

  const totalUsers = users.length;
  const activeLoans = loans.filter((l) => l.status === 'ACTIVE').length;
  const defaultedLoans = loans.filter((l) => l.status === 'DEFAULTED').length;
  const loanVolume = loans.reduce((sum, l) => sum + toNumber(l.originalAmount), 0);
  const defaultRate = loans.length > 0 ? (defaultedLoans / loans.length) * 100 : 0;
  const pendingKyc = kycs.filter((k) => k.verificationStatus === 'PENDING').length;

  const today = new Date();
  const paymentsToday = transactions
    .filter((t) => t.status === 'SUCCESS' && isSameDay(new Date(t.createdAt), today))
    .reduce((sum, t) => sum + toNumber(t.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xl font-semibold text-slate-900">Dashboard</div>
        <div className="mt-1 text-sm text-slate-600">Overview of loans, users, and payments.</div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Spinner />
          Loading metrics...
        </div>
      ) : error ? (
        <Card>
          <div className="text-base font-semibold text-slate-900">Unable to load metrics</div>
          <div className="mt-2 text-sm text-slate-600">Please confirm your Clerk session and admin role.</div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Active Loans" value={String(activeLoans)} />
          <MetricCard label="Pending KYC" value={String(pendingKyc)} />
          <MetricCard label="Payments Today" value={`GH₵ ${paymentsToday.toFixed(2)}`} />
        </div>
      )}

      {!isLoading && !error ? (
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Total Users" value={String(totalUsers)} />
          <MetricCard label="Loan Volume" value={`GH₵ ${loanVolume.toFixed(2)}`} />
          <MetricCard label="Default Rate" value={`${defaultRate.toFixed(1)}%`} />
        </div>
      ) : null}

      <Card>
        <div className="mb-3 text-base font-semibold text-slate-900">Weekly Loans</div>
        <BarChart data={demoData} />
      </Card>

      <RecentActivity />
    </div>
  );
}
