import type { RequestHandler } from 'express';

import ApiError from '../../common/errors/ApiError';
import { getKycStatus, submitKyc } from './service';

export const submit: RequestHandler = async (req, res, next) => {
  try {
    if (!req.currentUser) {
      throw new ApiError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    const kyc = await submitKyc(req.currentUser.id, req.body);
    res.json({ success: true, data: kyc });
  } catch (err) {
    next(err);
  }
};

export const status: RequestHandler = async (req, res, next) => {
  try {
    if (!req.currentUser) {
      throw new ApiError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
    }
    const result = await getKycStatus(req.currentUser.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
