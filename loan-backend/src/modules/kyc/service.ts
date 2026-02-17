import ApiError from '../../common/errors/ApiError';

import { getKycByUserId, upsertKyc } from './repository';
import type { SubmitKycInput } from './types';

export async function submitKyc(userId: string, input: SubmitKycInput) {
  const existing = await getKycByUserId(userId);
  if (existing && existing.verificationStatus === 'APPROVED') {
    throw new ApiError('KYC already approved', { statusCode: 400, code: 'KYC_APPROVED' });
  }

  return upsertKyc(userId, input);
}

export async function getKycStatus(userId: string) {
  const kyc = await getKycByUserId(userId);
  if (!kyc) return { status: 'PENDING', hasSubmission: false };
  return { status: kyc.verificationStatus, hasSubmission: true, data: kyc };
}
