import { Prisma } from '@prisma/client';

import ApiError from '../../common/errors/ApiError';
import prisma from '../../config/database';
import calculateInterest from '../../utils/calculateInterest';
import { addDays } from '../../utils/dateHelpers';

import { createLoanTx, getLoanById, listLoansByUserId } from './repository';
import type { ApplyLoanInput, LoanProduct, LoanQuote, LoanQuoteInput } from './types';
import { maybeCreateReferralRewardOnLoan } from '../referrals/service';

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
    create: {
      id: 'default',
      personalMinLoanAmount: new Prisma.Decimal(100),
      personalDurationOptionsDays: [7, 14, 30],
      personalInterestRatePercent: new Prisma.Decimal(15),
      personalServiceChargePercent: new Prisma.Decimal(2.5),
    },
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

async function getLoanProductsConfigForUser(userId: string) {
  const [user, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.systemSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        personalMinLoanAmount: new Prisma.Decimal(100),
        personalDurationOptionsDays: [7, 14, 30],
        personalInterestRatePercent: new Prisma.Decimal(15),
        personalServiceChargePercent: new Prisma.Decimal(2.5),
      },
    }),
  ]);

  if (!user) throw new ApiError('User not found', { statusCode: 404, code: 'USER_NOT_FOUND' });

  const defaultInterest = settings.defaultInterestRatePercent.toNumber();

  const personalMinAmount = settings.personalMinLoanAmount ? settings.personalMinLoanAmount.toNumber() : 100;
  const personalInterestRatePercent = settings.personalInterestRatePercent
    ? settings.personalInterestRatePercent.toNumber()
    : 15;
  const personalServiceChargePercent = settings.personalServiceChargePercent
    ? settings.personalServiceChargePercent.toNumber()
    : 2.5;
  const personalDurationOptionsDays = Array.isArray(settings.personalDurationOptionsDays)
    ? (settings.personalDurationOptionsDays as unknown[]).filter((v) => typeof v === 'number') as number[]
    : [];

  return {
    user,
    settings,
    personal: {
      minAmount: personalMinAmount,
      maxAmount: user.loanLimit.toNumber(),
      availableAmount: user.loanLimit.toNumber(),
      durationOptionsDays: personalDurationOptionsDays.length > 0 ? personalDurationOptionsDays : [7, 14, 30],
      interestRatePercent: personalInterestRatePercent,
      serviceChargePercent: personalServiceChargePercent,
    },
    business: {
      maxAmount: user.loanLimit.toNumber(),
      availableAmount: user.loanLimit.toNumber(),
      interestRatePercent: defaultInterest,
    },
  };
}

export async function getLoanProducts(userId: string): Promise<LoanProduct[]> {
  const cfg = await getLoanProductsConfigForUser(userId);

  return [
    {
      id: 'PERSONAL',
      displayName: 'Personal Loan',
      minAmount: cfg.personal.minAmount,
      maxAmount: cfg.personal.maxAmount,
      availableAmount: cfg.personal.availableAmount,
      durationOptionsDays: cfg.personal.durationOptionsDays,
      interestRatePercent: cfg.personal.interestRatePercent,
      serviceChargePercent: cfg.personal.serviceChargePercent,
    },
    {
      id: 'BUSINESS',
      displayName: 'Business Loan',
      minAmount: 0,
      maxAmount: cfg.business.maxAmount,
      availableAmount: cfg.business.availableAmount,
      durationOptionsDays: [],
      interestRatePercent: cfg.business.interestRatePercent,
      serviceChargePercent: 0,
    },
  ];
}

export async function quoteLoan(userId: string, input: LoanQuoteInput): Promise<LoanQuote> {
  const cfg = await getLoanProductsConfigForUser(userId);

  const loanType = input.loanType;
  const principal = new Prisma.Decimal(input.amount);
  if (principal.lte(0)) throw new ApiError('Invalid amount', { statusCode: 400, code: 'INVALID_AMOUNT' });

  if (principal.greaterThan(cfg.user.loanLimit)) {
    throw new ApiError('Loan amount exceeds your limit', { statusCode: 400, code: 'LIMIT_EXCEEDED' });
  }

  const durationDays = input.durationDays;

  const isPersonalLoan = isPersonal(loanType);
  if (isPersonalLoan) {
    const min = new Prisma.Decimal(cfg.personal.minAmount);
    if (min.gt(0) && principal.lessThan(min)) {
      throw new ApiError('Loan amount below minimum', { statusCode: 400, code: 'MIN_AMOUNT' });
    }

    const allowed = cfg.personal.durationOptionsDays;
    if (allowed.length > 0 && !allowed.includes(durationDays)) {
      throw new ApiError('Invalid duration', { statusCode: 400, code: 'INVALID_DURATION' });
    }
  }

  const interestRatePercent = isPersonalLoan ? cfg.personal.interestRatePercent : cfg.business.interestRatePercent;
  const serviceChargePercent = isPersonalLoan ? cfg.personal.serviceChargePercent : 0;

  const interestAmount = calculateInterest(principal, interestRatePercent);
  const serviceChargeAmount = principal.mul(new Prisma.Decimal(serviceChargePercent).div(100));
  const totalRepayment = principal.plus(interestAmount).plus(serviceChargeAmount);

  return {
    loanType,
    amount: input.amount,
    durationDays,
    interestRatePercent,
    serviceChargePercent,
    principalAmount: principal.toNumber(),
    interestAmount: interestAmount.toNumber(),
    serviceChargeAmount: serviceChargeAmount.toNumber(),
    totalRepayment: totalRepayment.toNumber(),
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
  const settings = await prisma.systemSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      personalMinLoanAmount: new Prisma.Decimal(100),
      personalDurationOptionsDays: [7, 14, 30],
      personalInterestRatePercent: new Prisma.Decimal(15),
      personalServiceChargePercent: new Prisma.Decimal(2.5),
    },
  });

  const personalDurationOptionsDays = Array.isArray(settings.personalDurationOptionsDays)
    ? (settings.personalDurationOptionsDays as unknown[]).filter((v) => typeof v === 'number') as number[]
    : [];

  if (isPersonal(input.loanType)) {
    const minAmount = settings.personalMinLoanAmount ?? new Prisma.Decimal(100);
    if (principal.lessThan(minAmount)) {
      throw new ApiError('Loan amount below minimum', { statusCode: 400, code: 'MIN_AMOUNT' });
    }

    const allowedDurations = personalDurationOptionsDays.length > 0 ? personalDurationOptionsDays : [7, 14, 30];
    if (!allowedDurations.includes(input.durationDays)) {
      throw new ApiError('Invalid duration', { statusCode: 400, code: 'INVALID_DURATION' });
    }
  }

  const interestRatePercent =
    isPersonal(input.loanType) && settings.personalInterestRatePercent
      ? settings.personalInterestRatePercent.toNumber()
      : (input.interestRatePercent ?? defaults.interestRatePercent);

  const serviceChargePercent =
    isPersonal(input.loanType) && settings.personalServiceChargePercent
      ? settings.personalServiceChargePercent.toNumber()
      : 0;

  const gracePeriodDays = input.gracePeriodDays ?? defaults.gracePeriodDays;
  const repaymentFrequency = input.repaymentFrequency ?? defaults.repaymentFrequency ?? undefined;
  const totalInstallments = input.totalInstallments ?? defaults.totalInstallments ?? undefined;
  const penaltyPerDay = input.penaltyPerDay ?? defaults.penaltyPerDay;
  const maxPenalty = input.maxPenalty ?? defaults.maxPenalty;

  const interestAmount = calculateInterest(principal, interestRatePercent);
  const serviceChargeAmount = principal.mul(new Prisma.Decimal(serviceChargePercent).div(100));
  const totalRepayment = principal.plus(interestAmount).plus(serviceChargeAmount);

  const now = new Date();
  const dueDate = addDays(now, input.durationDays);
  const gracePeriodEnd = addDays(dueDate, gracePeriodDays);

  const loan = await createLoanTx({
    userId,
    loanType: input.loanType,
    interestRatePercent: new Prisma.Decimal(interestRatePercent),
    serviceChargePercent: new Prisma.Decimal(serviceChargePercent),
    serviceChargeAmount,
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

  try {
    await maybeCreateReferralRewardOnLoan({ userId, loanId: loan.id, loanType: loan.loanType });
  } catch {
    // Do not block loan creation on referral tracking.
  }

  return loan;
}
