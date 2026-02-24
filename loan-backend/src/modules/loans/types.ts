export type ApplyLoanInput = {
  loanType: string;
  amount: number;
  durationDays: number;
  interestRatePercent?: number;
  gracePeriodDays?: number;
  penaltyPerDay?: number;
  maxPenalty?: number;
  repaymentFrequency?: string;
  totalInstallments?: number;
};

export type LoanProduct = {
  id: string;
  displayName: string;
  minAmount: number;
  maxAmount: number;
  availableAmount: number;
  durationOptionsDays: number[];
  interestRatePercent: number;
  serviceChargePercent: number;
};

export type LoanQuoteInput = {
  loanType: string;
  amount: number;
  durationDays: number;
};

export type LoanQuote = {
  loanType: string;
  amount: number;
  durationDays: number;
  interestRatePercent: number;
  serviceChargePercent: number;
  principalAmount: number;
  interestAmount: number;
  serviceChargeAmount: number;
  totalRepayment: number;
};

export type RepayLoanInput = {
  amount: number;
};
