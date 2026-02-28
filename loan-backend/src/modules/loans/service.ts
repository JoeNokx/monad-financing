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

  const s = settings as any;

  if (!user) throw new ApiError('User not found', { statusCode: 404, code: 'USER_NOT_FOUND' });

  const defaultInterest = settings.defaultInterestRatePercent.toNumber();

  const personalMinAmount = settings.personalMinLoanAmount ? settings.personalMinLoanAmount.toNumber() : 100;
  const personalMaxSetting = s.personalMaxLoanAmount ? s.personalMaxLoanAmount.toNumber() : null;
  const personalMaxAmount = personalMaxSetting ? Math.min(personalMaxSetting, user.loanLimit.toNumber()) : user.loanLimit.toNumber();
  const personalInterestRatePercent = settings.personalInterestRatePercent ? settings.personalInterestRatePercent.toNumber() : 15;
  const personalServiceChargePercent = settings.personalServiceChargePercent ? settings.personalServiceChargePercent.toNumber() : 2.5;
  const personalDurationOptionsDays = Array.isArray(settings.personalDurationOptionsDays)
    ? ((settings.personalDurationOptionsDays as unknown[]).filter((v) => typeof v === 'number') as number[])
    : [];

  const businessMinAmount = s.businessMinLoanAmount ? s.businessMinLoanAmount.toNumber() : 0;
  const businessMaxSetting = s.businessMaxLoanAmount ? s.businessMaxLoanAmount.toNumber() : null;
  const businessMaxAmount = businessMaxSetting ? Math.min(businessMaxSetting, user.loanLimit.toNumber()) : user.loanLimit.toNumber();
  const businessInterestRatePercent = s.businessInterestRatePercent ? s.businessInterestRatePercent.toNumber() : defaultInterest;
  const businessServiceChargePercent = s.businessServiceChargePercent ? s.businessServiceChargePercent.toNumber() : 0;
  const businessDurationOptionsDays = Array.isArray(s.businessDurationOptionsDays)
    ? ((s.businessDurationOptionsDays as unknown[]).filter((v) => typeof v === 'number') as number[])
    : [];

  return {
    user,
    settings,
    personal: {
      minAmount: personalMinAmount,
      maxAmount: personalMaxAmount,
      availableAmount: personalMaxAmount,
      durationOptionsDays: personalDurationOptionsDays.length > 0 ? personalDurationOptionsDays : [7, 14, 30],
      interestRatePercent: personalInterestRatePercent,
      serviceChargePercent: personalServiceChargePercent,
      repaymentFrequency: settings.personalDefaultRepaymentFrequency ?? null,
      totalInstallments: settings.personalDefaultTotalInstallments ?? null,
    },
    business: {
      minAmount: businessMinAmount,
      maxAmount: businessMaxAmount,
      availableAmount: businessMaxAmount,
      durationOptionsDays: businessDurationOptionsDays,
      interestRatePercent: businessInterestRatePercent,
      serviceChargePercent: businessServiceChargePercent,
      repaymentFrequency: settings.businessDefaultRepaymentFrequency ?? null,
      totalInstallments: settings.businessDefaultTotalInstallments ?? null,
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
      repaymentFrequency: cfg.personal.repaymentFrequency ?? null,
      totalInstallments: cfg.personal.totalInstallments ?? null,
    },
    {
      id: 'BUSINESS',
      displayName: 'Business Loan',
      minAmount: cfg.business.minAmount,
      maxAmount: cfg.business.maxAmount,
      availableAmount: cfg.business.availableAmount,
      durationOptionsDays: cfg.business.durationOptionsDays,
      interestRatePercent: cfg.business.interestRatePercent,
      serviceChargePercent: cfg.business.serviceChargePercent,
      repaymentFrequency: cfg.business.repaymentFrequency ?? null,
      totalInstallments: cfg.business.totalInstallments ?? null,
    },
  ];
}

export async function quoteLoan(userId: string, input: LoanQuoteInput): Promise<LoanQuote> {
  const cfg = await getLoanProductsConfigForUser(userId);

  const loanType = input.loanType;
  const principal = new Prisma.Decimal(input.amount);
  if (principal.lte(0)) throw new ApiError('Invalid amount', { statusCode: 400, code: 'INVALID_AMOUNT' });

  const isPersonalLoan = isPersonal(loanType);
  const cap = isPersonalLoan ? cfg.personal.maxAmount : cfg.business.maxAmount;
  if (principal.greaterThan(new Prisma.Decimal(cap))) {
    throw new ApiError('Loan amount exceeds your limit', { statusCode: 400, code: 'LIMIT_EXCEEDED' });
  }

  const durationDays = input.durationDays;

  if (isPersonalLoan) {
    const min = new Prisma.Decimal(cfg.personal.minAmount);
    if (min.gt(0) && principal.lessThan(min)) {
      throw new ApiError('Loan amount below minimum', { statusCode: 400, code: 'MIN_AMOUNT' });
    }

    const allowed = cfg.personal.durationOptionsDays;
    if (allowed.length > 0 && !allowed.includes(durationDays)) {
      throw new ApiError('Invalid duration', { statusCode: 400, code: 'INVALID_DURATION' });
    }
  } else {
    const min = new Prisma.Decimal(cfg.business.minAmount);
    if (min.gt(0) && principal.lessThan(min)) {
      throw new ApiError('Loan amount below minimum', { statusCode: 400, code: 'MIN_AMOUNT' });
    }

    const allowed = cfg.business.durationOptionsDays;
    if (allowed.length > 0 && !allowed.includes(durationDays)) {
      throw new ApiError('Invalid duration', { statusCode: 400, code: 'INVALID_DURATION' });
    }
  }

  const interestRatePercent = isPersonalLoan ? cfg.personal.interestRatePercent : cfg.business.interestRatePercent;
  const serviceChargePercent = isPersonalLoan ? cfg.personal.serviceChargePercent : cfg.business.serviceChargePercent;

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

  const s = settings as any;

  const personalDurationOptionsDays = Array.isArray(settings.personalDurationOptionsDays)
    ? (settings.personalDurationOptionsDays as unknown[]).filter((v) => typeof v === 'number') as number[]
    : [];

  const businessDurationOptionsDays = Array.isArray(s.businessDurationOptionsDays)
    ? (s.businessDurationOptionsDays as unknown[]).filter((v) => typeof v === 'number') as number[]
    : [];

  if (isPersonal(input.loanType)) {
    const minAmount = settings.personalMinLoanAmount ?? new Prisma.Decimal(100);
    if (principal.lessThan(minAmount)) {
      throw new ApiError('Loan amount below minimum', { statusCode: 400, code: 'MIN_AMOUNT' });
    }

    const cap = s.personalMaxLoanAmount ? s.personalMaxLoanAmount : user.loanLimit;
    if (principal.greaterThan(cap)) {
      throw new ApiError('Loan amount exceeds your limit', { statusCode: 400, code: 'LIMIT_EXCEEDED' });
    }

    const allowedDurations = personalDurationOptionsDays.length > 0 ? personalDurationOptionsDays : [7, 14, 30];
    if (!allowedDurations.includes(input.durationDays)) {
      throw new ApiError('Invalid duration', { statusCode: 400, code: 'INVALID_DURATION' });
    }
  } else {
    const minAmount = s.businessMinLoanAmount ?? new Prisma.Decimal(0);
    if (minAmount.gt(0) && principal.lessThan(minAmount)) {
      throw new ApiError('Loan amount below minimum', { statusCode: 400, code: 'MIN_AMOUNT' });
    }

    const cap = s.businessMaxLoanAmount ? s.businessMaxLoanAmount : user.loanLimit;
    if (principal.greaterThan(cap)) {
      throw new ApiError('Loan amount exceeds your limit', { statusCode: 400, code: 'LIMIT_EXCEEDED' });
    }

    const allowedDurations = businessDurationOptionsDays;
    if (allowedDurations.length > 0 && !allowedDurations.includes(input.durationDays)) {
      throw new ApiError('Invalid duration', { statusCode: 400, code: 'INVALID_DURATION' });
    }
  }

  const interestRatePercent = isPersonal(input.loanType)
    ? (settings.personalInterestRatePercent ? settings.personalInterestRatePercent.toNumber() : (input.interestRatePercent ?? defaults.interestRatePercent))
    : (s.businessInterestRatePercent ? s.businessInterestRatePercent.toNumber() : (input.interestRatePercent ?? defaults.interestRatePercent));

  const serviceChargePercent = isPersonal(input.loanType)
    ? (settings.personalServiceChargePercent ? settings.personalServiceChargePercent.toNumber() : 0)
    : (s.businessServiceChargePercent ? s.businessServiceChargePercent.toNumber() : 0);

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
