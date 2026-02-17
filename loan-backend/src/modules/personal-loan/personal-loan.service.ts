import type { ApplyLoanInput } from '../loans/types';
import { applyLoan } from '../loans/service';

export async function applyPersonalLoan(userId: string, input: Omit<ApplyLoanInput, 'loanType'>) {
  return applyLoan(userId, {
    ...input,
    loanType: 'PERSONAL',
  });
}
