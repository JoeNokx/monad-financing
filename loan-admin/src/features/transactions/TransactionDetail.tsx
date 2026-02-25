import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';

import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Spinner } from '../../components/common/Spinner';
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

export default function TransactionDetail() {
  const { transactionId } = useParams();

  const transactionsQuery = useQuery({
    queryKey: ['admin', 'transactions'],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<AdminTransaction[]>>('/admin/transactions');
      return res.data.data;
    },
  });

  const txn = (transactionsQuery.data ?? []).find((t) => t.id === transactionId);

  if (transactionsQuery.isLoading) {
    return (
      <Card>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Spinner />
          Loading transaction...
        </div>
      </Card>
    );
  }

  if (transactionsQuery.isError || !transactionId || !txn) {
    return (
      <Card>
        <div className="text-base font-semibold text-slate-900">Transaction not found</div>
        <div className="mt-2 text-sm text-slate-600">
          <Link to="/transactions" className="text-slate-900 underline">
            Back to transactions
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-base font-semibold text-slate-900">Transaction Detail</div>
          <div className="mt-1 text-sm text-slate-600">{txn.id}</div>
          <div className="mt-2 text-sm text-slate-600">User: {txn.user?.email ?? '—'}</div>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{txn.status}</Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="text-sm text-slate-700">
          <div className="text-xs font-semibold text-slate-500">Amount</div>
          <div className="mt-1">GH₵ {toNumber(txn.amount).toFixed(2)}</div>
        </div>
        <div className="text-sm text-slate-700">
          <div className="text-xs font-semibold text-slate-500">Reference</div>
          <div className="mt-1">{txn.reference ?? '—'}</div>
        </div>
        <div className="text-sm text-slate-700">
          <div className="text-xs font-semibold text-slate-500">Payment Method</div>
          <div className="mt-1">{txn.paymentMethod ?? '—'}</div>
        </div>
        <div className="text-sm text-slate-700">
          <div className="text-xs font-semibold text-slate-500">Loan</div>
          <div className="mt-1">{txn.loan?.id ?? '—'}</div>
        </div>
        <div className="text-sm text-slate-700">
          <div className="text-xs font-semibold text-slate-500">Created</div>
          <div className="mt-1">{new Date(txn.createdAt).toLocaleString()}</div>
        </div>
        <div className="text-sm text-slate-700">
          <div className="text-xs font-semibold text-slate-500">Updated</div>
          <div className="mt-1">{txn.updatedAt ? new Date(txn.updatedAt).toLocaleString() : '—'}</div>
        </div>
      </div>
    </Card>
  );
}
