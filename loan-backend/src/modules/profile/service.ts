import ApiError from '../../common/errors/ApiError';
import prisma from '../../config/database';

import { getProfileByClerkUserId, ProfilePatch, upsertProfileByClerkUserId } from './repository';
import { applyReferralCodeToUser } from '../referrals/service';

function isCompleteProfile(input: {
  profile: {
    fullName: string | null;
    phoneNumber: string | null;
    dateOfBirth: Date | null;
    gender: string | null;
    address: string | null;
    emergencyName: string | null;
    emergencyPhone: string | null;
    emergencyRelationship: string | null;
    mobileNetwork: string | null;
    mobileNumber: string | null;
    mobileName: string | null;
  };
  user: {
    fullName: string | null;
  };
}) {
  const fullNameOk = Boolean(input.profile.fullName ?? input.user.fullName);

  return (
    fullNameOk &&
    Boolean(input.profile.phoneNumber) &&
    Boolean(input.profile.dateOfBirth) &&
    Boolean(input.profile.gender) &&
    Boolean(input.profile.address) &&
    Boolean(input.profile.emergencyName) &&
    Boolean(input.profile.emergencyPhone) &&
    Boolean(input.profile.emergencyRelationship) &&
    Boolean(input.profile.mobileNetwork) &&
    Boolean(input.profile.mobileNumber) &&
    Boolean(input.profile.mobileName)
  );
}

async function getUserForCompletion(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, fullName: true } });
  if (!user) {
    throw new ApiError('User not found', { statusCode: 404, code: 'USER_NOT_FOUND' });
  }
  return user;
}

export async function getProfileForUser(args: { clerkUserId: string; userId: string }) {
  const [profile, user] = await Promise.all([getProfileByClerkUserId(args.clerkUserId), getUserForCompletion(args.userId)]);

  const complete =
    profile === null
      ? false
      : isCompleteProfile({
          profile: {
            fullName: profile.fullName,
            phoneNumber: profile.phoneNumber,
            dateOfBirth: profile.dateOfBirth,
            gender: profile.gender,
            address: profile.address,
            emergencyName: profile.emergencyName,
            emergencyPhone: profile.emergencyPhone,
            emergencyRelationship: profile.emergencyRelationship,
            mobileNetwork: profile.mobileNetwork,
            mobileNumber: profile.mobileNumber,
            mobileName: profile.mobileName,
          },
          user,
        });

  return {
    profile,
    isComplete: complete,
  };
}

export async function upsertProfileForUser(args: { clerkUserId: string; userId: string; patch: ProfilePatch }) {
  const existing = await getProfileByClerkUserId(args.clerkUserId);
  const user = await getUserForCompletion(args.userId);

  if (args.patch.referralCode && args.patch.referralCode.trim().length > 0) {
    await applyReferralCodeToUser({ userId: args.userId, referralCode: args.patch.referralCode });
  }

  const merged = {
    fullName: args.patch.fullName ?? existing?.fullName ?? null,
    phoneNumber: args.patch.phoneNumber ?? existing?.phoneNumber ?? null,
    dateOfBirth: args.patch.dateOfBirth ?? existing?.dateOfBirth ?? null,
    gender: args.patch.gender ?? existing?.gender ?? null,
    address: args.patch.address ?? existing?.address ?? null,
    emergencyName: args.patch.emergencyName ?? existing?.emergencyName ?? null,
    emergencyPhone: args.patch.emergencyPhone ?? existing?.emergencyPhone ?? null,
    emergencyRelationship: args.patch.emergencyRelationship ?? existing?.emergencyRelationship ?? null,
    mobileNetwork: args.patch.mobileNetwork ?? existing?.mobileNetwork ?? null,
    mobileNumber: args.patch.mobileNumber ?? existing?.mobileNumber ?? null,
    mobileName: args.patch.mobileName ?? existing?.mobileName ?? null,
  };

  const isComplete = isCompleteProfile({
    profile: merged,
    user,
  });

  const profile = await upsertProfileByClerkUserId({
    clerkUserId: args.clerkUserId,
    patch: args.patch,
    isComplete,
  });

  return {
    profile,
    isComplete,
  };
}
