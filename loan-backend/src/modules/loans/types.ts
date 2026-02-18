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

export type RepayLoanInput = {
  amount: number;
};
