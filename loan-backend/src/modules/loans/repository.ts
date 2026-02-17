import { Prisma } from '@prisma/client';

import prisma from '../../config/database';

export async function listLoansByUserId(userId: string) {
  return prisma.loan.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { installments: true },
  });
}

export async function getLoanById(id: string) {
  return prisma.loan.findUnique({
    where: { id },
    include: { installments: true, penaltyHistory: true },
  });
}

export async function createLoanTx(args: {
  userId: string;
  loanType: string;
  durationDays: number;
  gracePeriodDays: number;
  penaltyPerDay?: Prisma.Decimal | null;
  maxPenalty?: Prisma.Decimal | null;
  repaymentFrequency?: string | null;
  totalInstallments?: number | null;
  principal: Prisma.Decimal;
  interestAmount: Prisma.Decimal;
  totalRepayment: Prisma.Decimal;
  dueDate: Date;
  gracePeriodEnd: Date;
}) {
  return prisma.$transaction(async (tx) => {
    const loan = await tx.loan.create({
      data: {
        userId: args.userId,
        loanType: args.loanType,
        duration: args.durationDays,
        gracePeriodDays: args.gracePeriodDays,
        gracePeriodEnd: args.gracePeriodEnd,
        penaltyPerDay: args.penaltyPerDay ?? null,
        maxPenalty: args.maxPenalty ?? null,
        repaymentFrequency: args.repaymentFrequency ?? null,
        totalInstallments: args.totalInstallments ?? null,
        originalAmount: args.principal,
        interestAmount: args.interestAmount,
        totalRepayment: args.totalRepayment,
        remainingBalance: args.totalRepayment,
        status: 'ACTIVE',
        dueDate: args.dueDate,
      },
    });

    if (args.totalInstallments && args.totalInstallments > 0) {
      const installmentAmount = args.totalRepayment.div(args.totalInstallments);
      const perInstallmentDays = Math.floor(args.durationDays / args.totalInstallments) || 1;
      const installments = Array.from({ length: args.totalInstallments }).map((_, idx) => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + perInstallmentDays * (idx + 1));
        return {
          loanId: loan.id,
          amount: installmentAmount,
          dueDate,
        };
      });
      await tx.loanInstallment.createMany({ data: installments });
    }

    await tx.ledgerEntry.create({
      data: {
        userId: args.userId,
        loanId: loan.id,
        type: 'LOAN_DISBURSEMENT',
        amount: args.principal,
        direction: 'CREDIT',
        reference: `loan_${loan.id}`,
      },
    });

    return loan;
  });
}
