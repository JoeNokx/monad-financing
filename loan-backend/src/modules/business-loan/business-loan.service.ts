import type { ApplyLoanInput } from '../loans/types';
import { applyLoan } from '../loans/service';

export async function applyBusinessLoan(userId: string, input: Omit<ApplyLoanInput, 'loanType'>) {
  return applyLoan(userId, {
    ...input,
    loanType: 'BUSINESS',
  });
}
