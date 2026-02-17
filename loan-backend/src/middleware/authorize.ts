import type { RequestHandler } from 'express';

import ApiError from '../common/errors/ApiError';
import type { RoleName } from '../constants/roles';

export default function authorize(allowedRoles: RoleName[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.currentUser) {
      return next(
        new ApiError('Unauthorized', {
          statusCode: 401,
          code: 'UNAUTHORIZED',
        }),
      );
    }

    const roles = req.currentUserRoles ?? [];
    const ok = allowedRoles.some((r) => roles.includes(r));

    if (!ok) {
      return next(
        new ApiError('Forbidden', {
          statusCode: 403,
          code: 'FORBIDDEN',
        }),
      );
    }

    next();
  };
}
