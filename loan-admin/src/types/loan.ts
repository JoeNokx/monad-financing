import type { LoanStatus } from '../constants/loanStatus';

export type Loan = {
  id: string;
  userId: string;
  status: LoanStatus | string;
  originalAmount?: number;
  totalRepayment?: number;
  remainingBalance?: number;
  dueDate?: string;
  createdAt?: string;
};
