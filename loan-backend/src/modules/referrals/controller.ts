import type { RequestHandler } from 'express';

import ApiError from '../../common/errors/ApiError';
import { getReferralSummary } from './service';

export const getSummary: RequestHandler = async (req, res, next) => {
  try {
    if (!req.currentUser) throw new ApiError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
    const data = await getReferralSummary(req.currentUser.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
