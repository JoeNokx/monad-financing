
import { Prisma } from '@prisma/client';

import prisma from '../../config/database';

export async function getSystemSettings() {
  return prisma.systemSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  });
}

export async function updateSystemSettings(input: {
  defaultInterestRatePercent?: number;
  defaultGracePeriodDays?: number;
  defaultPenaltyPerDay?: number;
  defaultMaxPenalty?: number;

  personalDefaultRepaymentFrequency?: string | null;
  personalDefaultTotalInstallments?: number | null;

  businessDefaultRepaymentFrequency?: string | null;
  businessDefaultTotalInstallments?: number | null;
}) {
  return prisma.systemSettings.upsert({
    where: { id: 'default' },
    update: {
      defaultInterestRatePercent:
        input.defaultInterestRatePercent === undefined
          ? undefined
          : new Prisma.Decimal(input.defaultInterestRatePercent),
      defaultGracePeriodDays: input.defaultGracePeriodDays,
      defaultPenaltyPerDay:
        input.defaultPenaltyPerDay === undefined ? undefined : new Prisma.Decimal(input.defaultPenaltyPerDay),
      defaultMaxPenalty: input.defaultMaxPenalty === undefined ? undefined : new Prisma.Decimal(input.defaultMaxPenalty),

      personalDefaultRepaymentFrequency: input.personalDefaultRepaymentFrequency,
      personalDefaultTotalInstallments: input.personalDefaultTotalInstallments,

      businessDefaultRepaymentFrequency: input.businessDefaultRepaymentFrequency,
      businessDefaultTotalInstallments: input.businessDefaultTotalInstallments,
    },
    create: {
      id: 'default',
      defaultInterestRatePercent:
        input.defaultInterestRatePercent === undefined
          ? new Prisma.Decimal(10)
          : new Prisma.Decimal(input.defaultInterestRatePercent),
      defaultGracePeriodDays: input.defaultGracePeriodDays ?? 3,
      defaultPenaltyPerDay:
        input.defaultPenaltyPerDay === undefined ? new Prisma.Decimal(0) : new Prisma.Decimal(input.defaultPenaltyPerDay),
      defaultMaxPenalty:
        input.defaultMaxPenalty === undefined ? new Prisma.Decimal(0) : new Prisma.Decimal(input.defaultMaxPenalty),

      personalDefaultRepaymentFrequency: input.personalDefaultRepaymentFrequency ?? 'MONTHLY',
      personalDefaultTotalInstallments: input.personalDefaultTotalInstallments ?? null,

      businessDefaultRepaymentFrequency: input.businessDefaultRepaymentFrequency ?? 'WEEKLY',
      businessDefaultTotalInstallments: input.businessDefaultTotalInstallments ?? null,
    },
  });
}

export async function setRolesForUser(args: { userId: string; roles: string[] }) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: args.userId }, select: { id: true } });
    if (!user) return null;

    await tx.userRole.deleteMany({ where: { userId: args.userId } });

    const roleIds: string[] = [];
    for (const name of args.roles) {
      const role = await tx.role.upsert({
        where: { name },
        update: {},
        create: { name },
        select: { id: true },
      });
      roleIds.push(role.id);
    }

    for (const roleId of roleIds) {
      await tx.userRole.create({
        data: {
          userId: args.userId,
          roleId,
        },
      });
    }

    const roles = await tx.userRole.findMany({
      where: { userId: args.userId },
      select: { role: { select: { name: true } } },
    });

    return roles.map((r) => r.role.name);
  });
}

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { roles: { select: { role: { select: { name: true } } } } },
  });
}

export async function setUserBlocked(args: { userId: string; isBlocked: boolean }) {
  return prisma.user.update({
    where: { id: args.userId },
    data: { isBlocked: args.isBlocked },
  });
}

export async function listAllLoans() {
  return prisma.loan.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, email: true, clerkId: true } },
      installments: true,
    },
  });
}

export async function setLoanStatus(args: { loanId: string; status: 'ACTIVE' | 'COMPLETED' | 'DEFAULTED' | 'CANCELLED' }) {
  return prisma.loan.update({
    where: { id: args.loanId },
    data: { status: args.status },
  });
}

export async function listKycSubmissions() {
  return prisma.kYCVerification.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, email: true, clerkId: true } } },
  });
}

export async function setKycStatus(args: { userId: string; status: 'PENDING' | 'APPROVED' | 'REJECTED' }) {
  return prisma.kYCVerification.update({
    where: { userId: args.userId },
    data: { verificationStatus: args.status },
  });
}

export async function listAllTransactions() {
  return prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, email: true, clerkId: true } },
      loan: { select: { id: true, loanType: true, status: true } },
    },
  });
}

export async function listNotifications(args: { userId?: string }) {
  return prisma.notification.findMany({
    where: args.userId ? { userId: args.userId } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, email: true, clerkId: true } } },
  });
}

export async function createNotification(args: { userId: string; type: string; message: string }) {
  return prisma.notification.create({
    data: {
      userId: args.userId,
      type: args.type,
      message: args.message,
    },
  });
}

export async function broadcastNotification(args: { type: string; message: string }) {
  const users = await prisma.user.findMany({ select: { id: true } });
  if (users.length === 0) return { success: true, created: 0 };

  const data = users.map((u) => ({
    userId: u.id,
    type: args.type,
    message: args.message,
  }));

  const result = await prisma.notification.createMany({ data });
  return { success: true, created: result.count };
}
