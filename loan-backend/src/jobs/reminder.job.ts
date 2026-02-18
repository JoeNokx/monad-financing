
import logger from '../common/logger/logger';
import prisma from '../config/database';

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function runDailyRemindersJob(now = new Date()) {
  try {
    const start = startOfDay(now);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const installments = await prisma.loanInstallment.findMany({
      where: {
        isPaid: false,
        dueDate: { gte: start, lt: end },
        loan: { status: 'ACTIVE' },
      },
      select: {
        id: true,
        dueDate: true,
        amount: true,
        loanId: true,
        loan: { select: { userId: true } },
      },
    });

    if (installments.length === 0) {
      return { success: true, created: 0 };
    }

    const types = installments.map((i) => `REPAYMENT_REMINDER:${i.id}`);
    const existing = await prisma.notification.findMany({
      where: { type: { in: types } },
      select: { type: true },
    });
    const existingTypes = new Set(existing.map((e) => e.type));

    const data = installments
      .filter((i) => !existingTypes.has(`REPAYMENT_REMINDER:${i.id}`))
      .map((i) => ({
        userId: i.loan.userId,
        type: `REPAYMENT_REMINDER:${i.id}`,
        message: `Installment due ${i.dueDate.toISOString().slice(0, 10)} for loan ${i.loanId}. Amount: ${String(i.amount)}`,
      }));

    if (data.length > 0) {
      await prisma.notification.createMany({ data });
    }

    return { success: true, created: data.length };
  } catch (err) {
    logger.error('Daily reminders job failed', { err });
    throw err;
  }
}
