import prisma from '../../config/database';

export type ProfilePatch = {
  fullName?: string | null;
  phoneNumber?: string | null;
  referralCode?: string | null;
  dateOfBirth?: Date | null;
  gender?: string | null;
  address?: string | null;
  emergencyName?: string | null;
  emergencyPhone?: string | null;
  emergencyRelationship?: string | null;
  mobileNetwork?: string | null;
  mobileNumber?: string | null;
  mobileName?: string | null;
};

export async function getProfileByClerkUserId(clerkUserId: string) {
  return prisma.profile.findUnique({ where: { clerkUserId } });
}

export async function upsertProfileByClerkUserId(args: {
  clerkUserId: string;
  patch: ProfilePatch;
  isComplete: boolean;
}) {
  const { clerkUserId, patch, isComplete } = args;

  return prisma.profile.upsert({
    where: { clerkUserId },
    update: {
      ...patch,
      isComplete,
    },
    create: {
      clerkUserId,
      ...patch,
      isComplete,
    },
  });
}
