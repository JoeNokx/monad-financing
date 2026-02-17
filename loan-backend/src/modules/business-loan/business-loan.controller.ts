import type { RequestHandler } from 'express';

import ApiError from '../../common/errors/ApiError';
import { applyBusinessLoan } from './business-loan.service';

export const apply: RequestHandler = async (req, res, next) => {
  try {
    if (!req.currentUser) throw new ApiError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
    const loan = await applyBusinessLoan(req.currentUser.id, req.body);
    res.status(201).json({ success: true, data: loan });
  } catch (err) {
    next(err);
  }
};
