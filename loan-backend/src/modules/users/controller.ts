import type { RequestHandler } from 'express';

import ApiError from '../../common/errors/ApiError';
import { getMe, setPin, verifyPin } from './service';

export const me: RequestHandler = async (req, res, next) => {
  try {
    if (!req.currentUser) {
      throw new ApiError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
    }
    const user = await getMe(req.currentUser.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const setUserPin: RequestHandler = async (req, res, next) => {
  try {
    if (!req.currentUser) {
      throw new ApiError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
    }
    await setPin(req.currentUser.id, req.body.pin);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const verifyUserPin: RequestHandler = async (req, res, next) => {
  try {
    if (!req.currentUser) {
      throw new ApiError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
    }
    const ip = req.ip ?? 'unknown';
    await verifyPin(req.currentUser.id, req.body.pin, ip);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
