import prisma from '../../config/database';

export async function listTransactionsByUser(userId: string) {
  return prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findTransactionByPaystackRef(paystackRef: string) {
  return prisma.transaction.findFirst({
    where: { paystackRef },
    orderBy: { createdAt: 'desc' },
  });
}
