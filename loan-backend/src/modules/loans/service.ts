import { Prisma } from '@prisma/client';

import ApiError from '../../common/errors/ApiError';
import prisma from '../../config/database';
import calculateInterest from '../../utils/calculateInterest';
import { addDays } from '../../utils/dateHelpers';

import { createLoanTx, getLoanById, listLoansByUserId } from './repository';
import type { ApplyLoanInput } from './types';

function isPersonal(loanType: string) {
  return loanType.toLowerCase().includes('personal');
}

function isBusiness(loanType: string) {
  return loanType.toLowerCase().includes('business');
}

export async function listMyLoans(userId: string) {
  return listLoansByUserId(userId);
}

export async function getMyLoan(userId: string, loanId: string) {
  const loan = await getLoanById(loanId);
  if (!loan || loan.userId !== userId) {
    throw new ApiError('Loan not found', { statusCode: 404, code: 'LOAN_NOT_FOUND' });
  }
  return loan;
}

export async function applyLoan(userId: string, input: ApplyLoanInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError('User not found', { statusCode: 404, code: 'USER_NOT_FOUND' });
  if (user.isBlocked) throw new ApiError('User is blocked', { statusCode: 403, code: 'USER_BLOCKED' });

  const principal = new Prisma.Decimal(input.amount);
  if (principal.lte(0)) throw new ApiError('Invalid amount', { statusCode: 400, code: 'INVALID_AMOUNT' });
  if (principal.greaterThan(user.loanLimit)) {
    throw new ApiError('Loan amount exceeds your limit', { statusCode: 400, code: 'LIMIT_EXCEEDED' });
  }

  if (isPersonal(input.loanType) && user.currentPersonalLoans >= user.maxPersonalLoans) {
    throw new ApiError('Personal loan limit reached', { statusCode: 400, code: 'PERSONAL_LOAN_LIMIT' });
  }
  if (isBusiness(input.loanType) && user.currentBusinessLoans >= user.maxBusinessLoans) {
    throw new ApiError('Business loan limit reached', { statusCode: 400, code: 'BUSINESS_LOAN_LIMIT' });
  }

  const interestAmount = calculateInterest(principal, input.interestRatePercent);
  const totalRepayment = principal.plus(interestAmount);

  const now = new Date();
  const dueDate = addDays(now, input.durationDays);
  const gracePeriodDays = input.gracePeriodDays ?? 3;
  const gracePeriodEnd = addDays(dueDate, gracePeriodDays);

  const loan = await createLoanTx({
    userId,
    loanType: input.loanType,
    durationDays: input.durationDays,
    gracePeriodDays,
    penaltyPerDay: input.penaltyPerDay === undefined ? null : new Prisma.Decimal(input.penaltyPerDay),
    maxPenalty: input.maxPenalty === undefined ? null : new Prisma.Decimal(input.maxPenalty),
    repaymentFrequency: input.repaymentFrequency ?? null,
    totalInstallments: input.totalInstallments ?? null,
    principal,
    interestAmount,
    totalRepayment,
    dueDate,
    gracePeriodEnd,
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentPersonalLoans: isPersonal(input.loanType) ? { increment: 1 } : undefined,
      currentBusinessLoans: isBusiness(input.loanType) ? { increment: 1 } : undefined,
    },
  });

  return loan;
}
