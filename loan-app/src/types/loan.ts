export type LoanStatus = 'ACTIVE' | 'COMPLETED' | 'DEFAULTED' | 'CANCELLED';

export type Loan = {
  id: string;
  userId: string;
  loanType: string;
  duration?: number | null;
  gracePeriodDays?: number | null;
  gracePeriodEnd?: string | null;
  penaltyPerDay?: string | number | null;
  maxPenalty?: string | number | null;
  currentPenalty: string | number;
  repaymentFrequency?: string | null;
  totalInstallments?: number | null;
  paidInstallments: number;
  originalAmount: string | number;
  interestAmount: string | number;
  totalRepayment: string | number;
  amountPaid: string | number;
  remainingBalance: string | number;
  status: LoanStatus;
  dueDate: string;
  completedAt?: string | null;
  createdAt: string;
};
