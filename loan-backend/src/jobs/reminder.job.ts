
import logger from '../common/logger/logger';
import prisma from '../config/database';

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(start: Date) {
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return end;
}

function reminderTypeForInstallment(installmentId: string) {
  return `REPAYMENT_REMINDER:${installmentId}`;
}

async function findDueInstallments(args: { start: Date; end: Date }) {
  return prisma.loanInstallment.findMany({
    where: {
      isPaid: false,
      dueDate: { gte: args.start, lt: args.end },
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
}

async function findExistingReminderTypes(types: string[]) {
  if (types.length === 0) return new Set<string>();

  const existing = await prisma.notification.findMany({
    where: { type: { in: types } },
    select: { type: true },
  });

  return new Set(existing.map((e) => e.type));
}

function buildNotificationData(installment: {
  id: string;
  dueDate: Date;
  amount: any;
  loanId: string;
  loan: { userId: string };
}) {
  return {
    userId: installment.loan.userId,
    type: reminderTypeForInstallment(installment.id),
    message: `Installment due ${installment.dueDate.toISOString().slice(0, 10)} for loan ${installment.loanId}. Amount: ${String(installment.amount)}`,
  };
}

export async function runDailyRemindersJob(now = new Date()) {
  try {
    const start = startOfDay(now);
    const end = endOfDay(start);

    const installments = await findDueInstallments({ start, end });

    if (installments.length === 0) {
      return { success: true, created: 0 };
    }

    const types = installments.map((i) => reminderTypeForInstallment(i.id));
    const existingTypes = await findExistingReminderTypes(types);

    const data = installments
      .filter((i) => !existingTypes.has(reminderTypeForInstallment(i.id)))
      .map(buildNotificationData);

    if (data.length > 0) {
      await prisma.notification.createMany({ data });
    }

    return { success: true, created: data.length };
  } catch (err) {
    logger.error('Daily reminders job failed', { err });
    throw err;
  }
}
