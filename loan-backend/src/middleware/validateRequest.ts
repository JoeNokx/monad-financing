import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

import ApiError from '../common/errors/ApiError';

type RequestSchema = ZodTypeAny;

export default function validateRequest(schema: RequestSchema): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      return next(
        new ApiError('Validation error', {
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          details: result.error.flatten(),
        }),
      );
    }

    next();
  };
}
