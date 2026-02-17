import { Prisma } from '@prisma/client';

import prisma from '../../config/database';
import { calculateDailyPenalty } from './penalty-calculator';

export async function accrueDailyPenalties(now = new Date()) {
  const overdueLoans = await prisma.loan.findMany({
    where: {
      status: 'ACTIVE',
      gracePeriodEnd: { not: null, lt: now },
      penaltyPerDay: { not: null },
    },
    select: {
      id: true,
      userId: true,
      penaltyPerDay: true,
      maxPenalty: true,
      currentPenalty: true,
    },
  });

  for (const loan of overdueLoans) {
    const toAdd = calculateDailyPenalty({
      penaltyPerDay: loan.penaltyPerDay as Prisma.Decimal,
      maxPenalty: loan.maxPenalty as Prisma.Decimal | null,
      currentPenalty: loan.currentPenalty as Prisma.Decimal,
    });
    if (toAdd.lte(0)) continue;

    await prisma.$transaction(async (tx) => {
      const updated = await tx.loan.update({
        where: { id: loan.id },
        data: { currentPenalty: { increment: toAdd } },
      });

      await tx.penaltyHistory.create({
        data: {
          loanId: loan.id,
          amount: toAdd,
          dayNumber: 1,
        },
      });

      await tx.ledgerEntry.create({
        data: {
          userId: loan.userId,
          loanId: loan.id,
          type: 'PENALTY',
          amount: toAdd,
          direction: 'DEBIT',
          reference: `penalty_${updated.id}_${Date.now()}`,
        },
      });
    });
  }

  return { success: true, processed: overdueLoans.length };
}
