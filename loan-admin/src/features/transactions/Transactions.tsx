import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Spinner } from '../../components/common/Spinner';
import { Table } from '../../components/common/Table';
import api from '../../lib/api';
import type { ApiEnvelope } from '../../types/api';

type AdminTransaction = {
  id: string;
  amount: string | number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | string;
  paymentMethod?: string | null;
  reference?: string | null;
  createdAt: string;
  updatedAt?: string;
  user?: {
    id: string;
    email: string;
    clerkId: string;
  };
  loan?: {
    id: string;
  };
};

function toNumber(value: string | number) {
  if (typeof value === 'number') return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function Transactions() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');

  const transactionsQuery = useQuery({
    queryKey: ['admin', 'transactions'],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<AdminTransaction[]>>('/admin/transactions');
      return res.data.data;
    },
  });

  const filtered = useMemo(() => {
    const list = transactionsQuery.data ?? [];
    const q = search.trim().toLowerCase();
    return list
      .filter((t) => (status === 'ALL' ? true : t.status === status))
      .filter((t) => {
        if (!q) return true;
        const id = (t.id ?? '').toLowerCase();
        const email = (t.user?.email ?? '').toLowerCase();
        const ref = (t.reference ?? '').toLowerCase();
        return id.includes(q) || email.includes(q) || ref.includes(q);
      });
  }, [transactionsQuery.data, search, status]);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold text-slate-900">Transactions</div>
        <div className="mt-1 text-sm text-slate-600">View repayments and payment activity.</div>
      </div>

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="w-full max-w-md">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by transaction id, user email, or reference..." />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={status === 'ALL' ? 'text-sm font-semibold text-slate-900' : 'text-sm text-slate-600'}
              onClick={() => setStatus('ALL')}
            >
              All
            </button>
            <button
              type="button"
              className={status === 'SUCCESS' ? 'text-sm font-semibold text-slate-900' : 'text-sm text-slate-600'}
              onClick={() => setStatus('SUCCESS')}
            >
              Success
            </button>
            <button
              type="button"
              className={status === 'PENDING' ? 'text-sm font-semibold text-slate-900' : 'text-sm text-slate-600'}
              onClick={() => setStatus('PENDING')}
            >
              Pending
            </button>
            <button
              type="button"
              className={status === 'FAILED' ? 'text-sm font-semibold text-slate-900' : 'text-sm text-slate-600'}
              onClick={() => setStatus('FAILED')}
            >
              Failed
            </button>
          </div>
        </div>

        <div className="mt-4">
          {transactionsQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Spinner />
              Loading transactions...
            </div>
          ) : transactionsQuery.isError ? (
            <div className="text-sm text-slate-600">Failed to load transactions.</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-slate-600">No transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Transaction</th>
                    <th className="py-2 pr-4 text-xs font-semibold text-slate-500">User</th>
                    <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Amount</th>
                    <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Status</th>
                    <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Reference</th>
                    <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4 text-sm text-slate-700">
                        <Link to={`/transactions/${t.id}`} className="font-medium text-slate-900 hover:underline">
                          {t.id.slice(0, 8)}…
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-sm text-slate-700">{t.user?.email ?? '—'}</td>
                      <td className="py-3 pr-4 text-sm text-slate-700">GH₵ {toNumber(t.amount).toFixed(2)}</td>
                      <td className="py-3 pr-4 text-sm text-slate-700">
                        <Badge>{t.status}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-sm text-slate-700">{t.reference ?? '—'}</td>
                      <td className="py-3 pr-4 text-sm text-slate-700">{new Date(t.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
