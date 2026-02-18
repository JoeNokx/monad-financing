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

async function getSettingsDefaultsForLoanType(loanType: string) {
  const settings = await prisma.systemSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  });

  const interestRatePercent = settings.defaultInterestRatePercent.toNumber();
  const gracePeriodDays = settings.defaultGracePeriodDays;
  const penaltyPerDay = settings.defaultPenaltyPerDay.toNumber();
  const maxPenalty = settings.defaultMaxPenalty.toNumber();

  const repaymentFrequency = isBusiness(loanType)
    ? settings.businessDefaultRepaymentFrequency
    : settings.personalDefaultRepaymentFrequency;
  const totalInstallments = isBusiness(loanType)
    ? settings.businessDefaultTotalInstallments
    : settings.personalDefaultTotalInstallments;

  return {
    interestRatePercent,
    gracePeriodDays,
    penaltyPerDay,
    maxPenalty,
    repaymentFrequency,
    totalInstallments,
  };
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

  const defaults = await getSettingsDefaultsForLoanType(input.loanType);
  const interestRatePercent = input.interestRatePercent ?? defaults.interestRatePercent;
  const gracePeriodDays = input.gracePeriodDays ?? defaults.gracePeriodDays;
  const repaymentFrequency = input.repaymentFrequency ?? defaults.repaymentFrequency ?? undefined;
  const totalInstallments = input.totalInstallments ?? defaults.totalInstallments ?? undefined;
  const penaltyPerDay = input.penaltyPerDay ?? defaults.penaltyPerDay;
  const maxPenalty = input.maxPenalty ?? defaults.maxPenalty;

  const interestAmount = calculateInterest(principal, interestRatePercent);
  const totalRepayment = principal.plus(interestAmount);

  const now = new Date();
  const dueDate = addDays(now, input.durationDays);
  const gracePeriodEnd = addDays(dueDate, gracePeriodDays);

  const loan = await createLoanTx({
    userId,
    loanType: input.loanType,
    durationDays: input.durationDays,
    gracePeriodDays,
    penaltyPerDay: penaltyPerDay === undefined ? null : new Prisma.Decimal(penaltyPerDay),
    maxPenalty: maxPenalty === undefined ? null : new Prisma.Decimal(maxPenalty),
    repaymentFrequency: repaymentFrequency ?? null,
    totalInstallments: totalInstallments ?? null,
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
