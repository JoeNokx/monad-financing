export type User = {
  id: string;
  clerkId: string;
  email: string;
  phone: string;
  fullName?: string | null;
  isBlocked: boolean;
  creditScore: number;
  referralCode?: string | null;
  maxPersonalLoans: number;
  currentPersonalLoans: number;
  maxBusinessLoans: number;
  currentBusinessLoans: number;
  loanLimit: string | number;
  originalLoanLimit: string | number;
  createdAt: string;
  updatedAt: string;
};
