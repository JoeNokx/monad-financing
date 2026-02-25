import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Spinner } from '../../components/common/Spinner';
import { Table } from '../../components/common/Table';
import { LOAN_STATUS } from '../../constants/loanStatus';
import api from '../../lib/api';
import type { ApiEnvelope } from '../../types/api';

type AdminLoan = {
  id: string;
  loanType: string;
  status: 'ACTIVE' | 'COMPLETED' | 'DEFAULTED' | 'CANCELLED' | string;
  originalAmount: string | number;
  remainingBalance: string | number;
  dueDate: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    clerkId: string;
  };
};

function toNumber(value: string | number) {
  if (typeof value === 'number') return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function Loans() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');

  const loansQuery = useQuery({
    queryKey: ['admin', 'loans'],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<AdminLoan[]>>('/admin/loans');
      return res.data.data;
    },
  });

  const filtered = useMemo(() => {
    const list = loansQuery.data ?? [];
    const q = search.trim().toLowerCase();

    return list
      .filter((l) => (status === 'ALL' ? true : l.status === status))
      .filter((l) => {
        if (!q) return true;
        const id = (l.id ?? '').toLowerCase();
        const email = (l.user?.email ?? '').toLowerCase();
        return id.includes(q) || email.includes(q);
      });
  }, [loansQuery.data, search, status]);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold text-slate-900">Loans</div>
        <div className="mt-1 text-sm text-slate-600">Review and manage loans.</div>
      </div>

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="w-full max-w-md">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by loan id or user email..." />
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
              className={status === LOAN_STATUS.ACTIVE ? 'text-sm font-semibold text-slate-900' : 'text-sm text-slate-600'}
              onClick={() => setStatus(LOAN_STATUS.ACTIVE)}
            >
              Active
            </button>
            <button
              type="button"
              className={status === LOAN_STATUS.COMPLETED ? 'text-sm font-semibold text-slate-900' : 'text-sm text-slate-600'}
              onClick={() => setStatus(LOAN_STATUS.COMPLETED)}
            >
              Completed
            </button>
            <button
              type="button"
              className={status === LOAN_STATUS.DEFAULTED ? 'text-sm font-semibold text-slate-900' : 'text-sm text-slate-600'}
              onClick={() => setStatus(LOAN_STATUS.DEFAULTED)}
            >
              Defaulted
            </button>
            <button
              type="button"
              className={status === LOAN_STATUS.CANCELLED ? 'text-sm font-semibold text-slate-900' : 'text-sm text-slate-600'}
              onClick={() => setStatus(LOAN_STATUS.CANCELLED)}
            >
              Cancelled
            </button>
          </div>
        </div>

        <div className="mt-4">
          {loansQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Spinner />
              Loading loans...
            </div>
          ) : loansQuery.isError ? (
            <div className="text-sm text-slate-600">Failed to load loans.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Loan</th>
                    <th className="py-2 pr-4 text-xs font-semibold text-slate-500">User</th>
                    <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Type</th>
                    <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Amount</th>
                    <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Balance</th>
                    <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Status</th>
                    <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => (
                    <tr key={l.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4 text-sm text-slate-700">
                        <Link to={`/loans/${l.id}`} className="font-medium text-slate-900 hover:underline">
                          {l.id.slice(0, 8)}…
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-sm text-slate-700">{l.user?.email ?? '—'}</td>
                      <td className="py-3 pr-4 text-sm text-slate-700">{l.loanType}</td>
                      <td className="py-3 pr-4 text-sm text-slate-700">GH₵ {toNumber(l.originalAmount).toFixed(2)}</td>
                      <td className="py-3 pr-4 text-sm text-slate-700">GH₵ {toNumber(l.remainingBalance).toFixed(2)}</td>
                      <td className="py-3 pr-4 text-sm text-slate-700">
                        <Badge>{l.status}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-sm text-slate-700">{new Date(l.dueDate).toLocaleDateString()}</td>
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
