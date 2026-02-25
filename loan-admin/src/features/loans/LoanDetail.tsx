import { Card } from '../../components/common/Card';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';

import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { LOAN_STATUS } from '../../constants/loanStatus';
import api from '../../lib/api';
import type { ApiEnvelope } from '../../types/api';

type AdminLoan = {
  id: string;
  loanType: string;
  status: 'ACTIVE' | 'COMPLETED' | 'DEFAULTED' | 'CANCELLED' | string;
  originalAmount: string | number;
  interestAmount: string | number;
  totalRepayment: string | number;
  amountPaid: string | number;
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

export default function LoanDetail() {
  const { loanId } = useParams();
  const queryClient = useQueryClient();

  const loansQuery = useQuery({
    queryKey: ['admin', 'loans'],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<AdminLoan[]>>('/admin/loans');
      return res.data.data;
    },
  });

  const loan = (loansQuery.data ?? []).find((l) => l.id === loanId);

  const updateStatus = useMutation({
    mutationFn: async (status: 'ACTIVE' | 'COMPLETED' | 'DEFAULTED' | 'CANCELLED') => {
      if (!loanId) return;
      await api.patch(`/admin/loans/${loanId}/status`, { status });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'loans'] });
    },
  });

  if (loansQuery.isLoading) {
    return (
      <Card>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Spinner />
          Loading loan...
        </div>
      </Card>
    );
  }

  if (loansQuery.isError || !loanId || !loan) {
    return (
      <Card>
        <div className="text-base font-semibold text-slate-900">Loan not found</div>
        <div className="mt-2 text-sm text-slate-600">
          <Link to="/loans" className="text-slate-900 underline">
            Back to loans
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-base font-semibold text-slate-900">Loan Detail</div>
          <div className="mt-1 text-sm text-slate-600">{loan.id}</div>
          <div className="mt-2 text-sm text-slate-600">Borrower: {loan.user?.email ?? '—'}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge>{loan.status}</Badge>
          <Button type="button" variant="secondary" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate(LOAN_STATUS.ACTIVE)}>
            Mark Active
          </Button>
          <Button type="button" variant="secondary" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate(LOAN_STATUS.COMPLETED)}>
            Mark Completed
          </Button>
          <Button type="button" variant="secondary" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate(LOAN_STATUS.DEFAULTED)}>
            Mark Defaulted
          </Button>
          <Button type="button" variant="secondary" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate(LOAN_STATUS.CANCELLED)}>
            Mark Cancelled
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="text-sm text-slate-700">
          <div className="text-xs font-semibold text-slate-500">Loan Type</div>
          <div className="mt-1">{loan.loanType}</div>
        </div>
        <div className="text-sm text-slate-700">
          <div className="text-xs font-semibold text-slate-500">Due Date</div>
          <div className="mt-1">{new Date(loan.dueDate).toLocaleString()}</div>
        </div>
        <div className="text-sm text-slate-700">
          <div className="text-xs font-semibold text-slate-500">Original Amount</div>
          <div className="mt-1">GH₵ {toNumber(loan.originalAmount).toFixed(2)}</div>
        </div>
        <div className="text-sm text-slate-700">
          <div className="text-xs font-semibold text-slate-500">Total Repayment</div>
          <div className="mt-1">GH₵ {toNumber(loan.totalRepayment).toFixed(2)}</div>
        </div>
        <div className="text-sm text-slate-700">
          <div className="text-xs font-semibold text-slate-500">Amount Paid</div>
          <div className="mt-1">GH₵ {toNumber(loan.amountPaid).toFixed(2)}</div>
        </div>
        <div className="text-sm text-slate-700">
          <div className="text-xs font-semibold text-slate-500">Remaining Balance</div>
          <div className="mt-1">GH₵ {toNumber(loan.remainingBalance).toFixed(2)}</div>
        </div>
      </div>
    </Card>
  );
}
