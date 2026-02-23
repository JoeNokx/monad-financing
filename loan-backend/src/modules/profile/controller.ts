import type { RequestHandler } from 'express';

import ApiError from '../../common/errors/ApiError';
import { getProfileForUser, upsertProfileForUser } from './service';

export const getMyProfile: RequestHandler = async (req, res, next) => {
  try {
    if (!req.currentUser) {
      throw new ApiError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    const result = await getProfileForUser({
      clerkUserId: req.currentUser.clerkId,
      userId: req.currentUser.id,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const upsertMyProfile: RequestHandler = async (req, res, next) => {
  try {
    if (!req.currentUser) {
      throw new ApiError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    const result = await upsertProfileForUser({
      clerkUserId: req.currentUser.clerkId,
      userId: req.currentUser.id,
      patch: req.body,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
