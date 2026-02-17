import ApiError from '../../common/errors/ApiError';
import comparePin from '../../utils/comparePin';
import hashPin from '../../utils/hashPin';

import {
  countRecentFailedAttempts,
  getUserById,
  getUserPin,
  recordFailedPinAttempt,
  upsertUserPin,
} from './repository';

export async function getMe(userId: string) {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError('User not found', { statusCode: 404, code: 'USER_NOT_FOUND' });
  }
  return user;
}

export async function setPin(userId: string, pin: string) {
  const hashed = await hashPin(pin);
  await upsertUserPin(userId, hashed);
  return { success: true };
}

export async function verifyPin(userId: string, pin: string, ipAddress: string) {
  const lockWindowMs = 15 * 60 * 1000;
  const maxAttempts = 5;
  const since = new Date(Date.now() - lockWindowMs);
  const recent = await countRecentFailedAttempts(userId, since);
  if (recent >= maxAttempts) {
    throw new ApiError('Too many failed PIN attempts', {
      statusCode: 429,
      code: 'PIN_LOCKED',
    });
  }

  const userPin = await getUserPin(userId);
  if (!userPin) {
    throw new ApiError('PIN not set', { statusCode: 400, code: 'PIN_NOT_SET' });
  }

  const ok = await comparePin(pin, userPin.hashedPin);
  if (!ok) {
    await recordFailedPinAttempt(userId, ipAddress);
    throw new ApiError('Invalid PIN', { statusCode: 400, code: 'INVALID_PIN' });
  }

  return { success: true };
}
