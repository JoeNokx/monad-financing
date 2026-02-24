import { Prisma } from '@prisma/client';

import ApiError from '../../common/errors/ApiError';
import prisma from '../../config/database';
import {
  countPendingRewards,
  countReferredUsers,
  countUserLoans,
  createPendingReward,
  findReferrerByCode,
  findRewardByReferredUserId,
  getUserReferralInfo,
  setUserReferredBy,
  sumPaidRewards,
} from './repository';

function isPersonal(loanType: string) {
  return loanType.toLowerCase().includes('personal');
}

function isBusiness(loanType: string) {
  return loanType.toLowerCase().includes('business');
}

export async function getReferralSummary(userId: string) {
  const info = await getUserReferralInfo(userId);
  if (!info) throw new ApiError('User not found', { statusCode: 404, code: 'USER_NOT_FOUND' });

  const [friendsInvited, moneyEarned, pendingRewards] = await Promise.all([
    countReferredUsers(userId),
    sumPaidRewards(userId),
    countPendingRewards(userId),
  ]);

  return {
    referralCode: info.referralCode ?? null,
    friendsInvited,
    moneyEarned,
    pendingRewards,
  };
}

export async function applyReferralCodeToUser(args: { userId: string; referralCode: string }) {
  const code = args.referralCode.trim().toUpperCase();
  if (!code) throw new ApiError('Invalid referral code', { statusCode: 400, code: 'INVALID_REFERRAL_CODE' });

  const user = await getUserReferralInfo(args.userId);
  if (!user) throw new ApiError('User not found', { statusCode: 404, code: 'USER_NOT_FOUND' });

  if (user.referredByUserId) {
    return { success: true, alreadyApplied: true };
  }

  if (user.referralCode && user.referralCode.toUpperCase() === code) {
    throw new ApiError('You cannot use your own referral code', { statusCode: 400, code: 'SELF_REFERRAL' });
  }

  const referrer = await findReferrerByCode(code);
  if (!referrer) throw new ApiError('Referral code not found', { statusCode: 404, code: 'REFERRAL_NOT_FOUND' });

  if (referrer.id === args.userId) {
    throw new ApiError('You cannot use your own referral code', { statusCode: 400, code: 'SELF_REFERRAL' });
  }

  const loansCount = await countUserLoans(args.userId);
  if (loansCount > 0) {
    throw new ApiError('Referral code must be applied before taking a loan', {
      statusCode: 400,
      code: 'REFERRAL_TOO_LATE',
    });
  }

  await setUserReferredBy({ userId: args.userId, referrerUserId: referrer.id });

  return { success: true };
}

export async function maybeCreateReferralRewardOnLoan(args: { userId: string; loanId: string; loanType: string }) {
  const user = await prisma.user.findUnique({ where: { id: args.userId }, select: { id: true, referredByUserId: true } });
  if (!user || !user.referredByUserId) return;

  const existing = await findRewardByReferredUserId(args.userId);
  if (existing) return;

  const rewardAmount = isBusiness(args.loanType) ? 50 : isPersonal(args.loanType) ? 20 : 0;
  if (rewardAmount <= 0) return;

  try {
    await createPendingReward({
      referrerUserId: user.referredByUserId,
      referredUserId: user.id,
      loanId: args.loanId,
      loanType: args.loanType,
      rewardAmount,
    });
  } catch (e: any) {
    if (e?.code === 'P2002') return;
    throw e;
  }
}

export async function adminListReferralRewards() {
  return prisma.referralReward.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      referrer: { select: { id: true, email: true, referralCode: true } },
      referred: { select: { id: true, email: true } },
      loan: { select: { id: true, status: true, loanType: true, createdAt: true, completedAt: true } },
    },
  });
}

export async function adminSetReferralRewardStatus(args: { rewardId: string; status: 'PENDING' | 'PAID' }) {
  const reward = await prisma.referralReward.findUnique({ where: { id: args.rewardId }, include: { loan: true } });
  if (!reward) throw new ApiError('Referral reward not found', { statusCode: 404, code: 'REFERRAL_REWARD_NOT_FOUND' });

  if (args.status === 'PAID') {
    if (reward.loan.status !== 'COMPLETED') {
      throw new ApiError('Loan must be completed before marking referral as paid', {
        statusCode: 400,
        code: 'REFERRAL_LOAN_NOT_COMPLETED',
      });
    }

    return prisma.referralReward.update({
      where: { id: reward.id },
      data: { status: 'PAID', paidAt: reward.paidAt ?? new Date() },
    });
  }

  return prisma.referralReward.update({ where: { id: reward.id }, data: { status: 'PENDING', paidAt: null } });
}
