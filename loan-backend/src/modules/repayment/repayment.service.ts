import { Prisma } from '@prisma/client';

import ApiError from '../../common/errors/ApiError';
import prisma from '../../config/database';
import generateReference from '../../utils/generateReference';

export async function recordRepayment(args: {
  userId: string;
  loanId: string;
  amount: Prisma.Decimal | number | string;
  paystackRef?: string;
}) {
  const amount = new Prisma.Decimal(args.amount);
  if (amount.lte(0)) throw new ApiError('Invalid amount', { statusCode: 400, code: 'INVALID_AMOUNT' });

  return prisma.$transaction(async (tx) => {
    const loan = await tx.loan.findUnique({
      where: { id: args.loanId },
      include: { installments: { orderBy: { dueDate: 'asc' } } },
    });

    if (!loan || loan.userId !== args.userId) {
      throw new ApiError('Loan not found', { statusCode: 404, code: 'LOAN_NOT_FOUND' });
    }
    if (loan.status !== 'ACTIVE') {
      throw new ApiError('Loan is not active', { statusCode: 400, code: 'LOAN_NOT_ACTIVE' });
    }

    const currentPenalty = new Prisma.Decimal(loan.currentPenalty ?? 0);
    const remainingBalance = new Prisma.Decimal(loan.remainingBalance);

    let remainingPayment = amount;

    const penaltyPaid = remainingPayment.greaterThan(currentPenalty) ? currentPenalty : remainingPayment;
    remainingPayment = remainingPayment.minus(penaltyPaid);

    const balancePaid = remainingPayment.greaterThan(remainingBalance) ? remainingBalance : remainingPayment;
    remainingPayment = remainingPayment.minus(balancePaid);

    const newPenalty = currentPenalty.minus(penaltyPaid);
    const newRemainingBalance = remainingBalance.minus(balancePaid);
    const newAmountPaid = new Prisma.Decimal(loan.amountPaid).plus(penaltyPaid).plus(balancePaid);

    const reference = args.paystackRef ?? generateReference('repay');

    const existingTx = args.paystackRef
      ? await tx.transaction.findFirst({ where: { paystackRef: args.paystackRef } })
      : null;

    if (existingTx?.status === 'SUCCESS') {
      return { success: true, alreadyProcessed: true };
    }

    if (existingTx) {
      await tx.transaction.update({
        where: { id: existingTx.id },
        data: { status: 'SUCCESS' },
      });
    } else {
      await tx.transaction.create({
        data: {
          userId: args.userId,
          loanId: loan.id,
          paystackRef: args.paystackRef ?? null,
          amount,
          status: 'SUCCESS',
        },
      });
    }

    const existingLedger = await tx.ledgerEntry.findFirst({ where: { reference } });
    if (!existingLedger) {
      await tx.ledgerEntry.create({
        data: {
          userId: args.userId,
          loanId: loan.id,
          type: 'REPAYMENT',
          amount,
          direction: 'DEBIT',
          reference,
        },
      });
    }

    const isComplete = newRemainingBalance.lte(0) && newPenalty.lte(0);

    await tx.loan.update({
      where: { id: loan.id },
      data: {
        currentPenalty: newPenalty,
        amountPaid: newAmountPaid,
        remainingBalance: newRemainingBalance,
        status: isComplete ? 'COMPLETED' : loan.status,
        completedAt: isComplete ? new Date() : null,
      },
    });

    if (loan.totalInstallments && loan.totalInstallments > 0) {
      let remainingToApply = balancePaid;
      const unpaid = loan.installments.filter((i) => !i.isPaid);
      const toPayIds: string[] = [];
      for (const inst of unpaid) {
        if (remainingToApply.lte(0)) break;
        if (remainingToApply.greaterThanOrEqualTo(inst.amount)) {
          toPayIds.push(inst.id);
          remainingToApply = remainingToApply.minus(inst.amount);
        } else {
          break;
        }
      }

      if (toPayIds.length > 0) {
        await tx.loanInstallment.updateMany({
          where: { id: { in: toPayIds } },
          data: { isPaid: true, paidAt: new Date() },
        });

        await tx.loan.update({
          where: { id: loan.id },
          data: { paidInstallments: { increment: toPayIds.length } },
        });
      }
    }

    return { success: true };
  });
}
