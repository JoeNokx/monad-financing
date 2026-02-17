import prisma from '../../config/database';

export async function getUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({ where: { clerkId } });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function upsertUserPin(userId: string, hashedPin: string) {
  return prisma.userPin.upsert({
    where: { userId },
    update: { hashedPin },
    create: { userId, hashedPin },
  });
}

export async function getUserPin(userId: string) {
  return prisma.userPin.findUnique({ where: { userId } });
}

export async function recordFailedPinAttempt(userId: string, ipAddress: string) {
  return prisma.failedPinAttempt.create({
    data: { userId, ipAddress },
  });
}

export async function countRecentFailedAttempts(userId: string, since: Date) {
  return prisma.failedPinAttempt.count({
    where: { userId, createdAt: { gte: since } },
  });
}
