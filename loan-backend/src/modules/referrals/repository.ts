import prisma from '../../config/database';

export async function getUserReferralInfo(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: { id: true, referralCode: true, referredByUserId: true } });
}

export async function countReferredUsers(referrerUserId: string) {
  return prisma.user.count({ where: { referredByUserId: referrerUserId } });
}

export async function sumPaidRewards(referrerUserId: string) {
  const agg = await prisma.referralReward.aggregate({
    where: { referrerUserId, status: 'PAID' },
    _sum: { rewardAmount: true },
  });

  const sum = agg._sum.rewardAmount;
  return sum ? sum.toNumber() : 0;
}

export async function countPendingRewards(referrerUserId: string) {
  return prisma.referralReward.count({ where: { referrerUserId, status: 'PENDING' } });
}

export async function findReferrerByCode(code: string) {
  return prisma.user.findFirst({ where: { referralCode: code }, select: { id: true, referralCode: true } });
}

export async function setUserReferredBy(args: { userId: string; referrerUserId: string }) {
  return prisma.user.update({ where: { id: args.userId }, data: { referredByUserId: args.referrerUserId } });
}

export async function countUserLoans(userId: string) {
  return prisma.loan.count({ where: { userId } });
}

export async function findRewardByReferredUserId(referredUserId: string) {
  return prisma.referralReward.findUnique({ where: { referredUserId } });
}

export async function createPendingReward(args: {
  referrerUserId: string;
  referredUserId: string;
  loanId: string;
  loanType: string;
  rewardAmount: number;
}) {
  return prisma.referralReward.create({
    data: {
      referrerUserId: args.referrerUserId,
      referredUserId: args.referredUserId,
      loanId: args.loanId,
      loanType: args.loanType,
      rewardAmount: args.rewardAmount,
      status: 'PENDING',
    },
  });
}
