import type { RequestHandler } from 'express';

import ApiError from '../../common/errors/ApiError';
import { listMyNotifications, markMyNotificationsRead } from './service';

export const list: RequestHandler = async (req, res, next) => {
  try {
    if (!req.currentUser) throw new ApiError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
    const data = await listMyNotifications(req.currentUser.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const markRead: RequestHandler = async (req, res, next) => {
  try {
    if (!req.currentUser) throw new ApiError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
    const data = await markMyNotificationsRead(req.currentUser.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};
