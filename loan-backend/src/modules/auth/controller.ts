import type { RequestHandler } from 'express';

import ApiError from '../../common/errors/ApiError';

export const session: RequestHandler = async (req, res, next) => {
  try {
    if (!req.currentUser) throw new ApiError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
    res.json({
      success: true,
      data: {
        clerk: req.auth,
        user: req.currentUser,
        roles: req.currentUserRoles ?? [],
      },
    });
  } catch (err) {
    next(err);
  }
};
