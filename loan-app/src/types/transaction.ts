export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export type Transaction = {
  id: string;
  loanId?: string | null;
  userId: string;
  paystackRef?: string | null;
  amount: string | number;
  status: TransactionStatus | string;
  createdAt: string;
};
