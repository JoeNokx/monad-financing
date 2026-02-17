import prisma from '../../config/database';

export async function listLedgerEntriesByUser(userId: string) {
  return prisma.ledgerEntry.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}
