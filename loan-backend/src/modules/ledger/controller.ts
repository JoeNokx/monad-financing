import type { RequestHandler } from 'express';

import ApiError from '../../common/errors/ApiError';
import { listMyLedger } from './service';

export const list: RequestHandler = async (req, res, next) => {
  try {
    if (!req.currentUser) throw new ApiError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
    const entries = await listMyLedger(req.currentUser.id);
    res.json({ success: true, data: entries });
  } catch (err) {
    next(err);
  }
};
