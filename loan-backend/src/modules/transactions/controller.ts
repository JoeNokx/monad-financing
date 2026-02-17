import type { RequestHandler } from 'express';

import ApiError from '../../common/errors/ApiError';
import { listMyTransactions } from './service';

export const list: RequestHandler = async (req, res, next) => {
  try {
    if (!req.currentUser) throw new ApiError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
    const txs = await listMyTransactions(req.currentUser.id);
    res.json({ success: true, data: txs });
  } catch (err) {
    next(err);
  }
};
