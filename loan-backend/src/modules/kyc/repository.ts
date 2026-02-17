import prisma from '../../config/database';

export async function getKycByUserId(userId: string) {
  return prisma.kYCVerification.findUnique({ where: { userId } });
}

export async function upsertKyc(userId: string, data: { idType: string; idNumber: string; idImageUrl: string; selfieUrl: string }) {
  return prisma.kYCVerification.upsert({
    where: { userId },
    update: {
      idType: data.idType,
      idNumber: data.idNumber,
      idImageUrl: data.idImageUrl,
      selfieUrl: data.selfieUrl,
      verificationStatus: 'PENDING',
    },
    create: {
      userId,
      idType: data.idType,
      idNumber: data.idNumber,
      idImageUrl: data.idImageUrl,
      selfieUrl: data.selfieUrl,
      verificationStatus: 'PENDING',
    },
  });
}
