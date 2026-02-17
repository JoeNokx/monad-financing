import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import logger from '../logger/logger';
import ApiError from './ApiError';

function normalizeError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  if (err instanceof ZodError) {
    return new ApiError('Validation error', {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      details: err.flatten(),
    });
  }

  if (err instanceof Error) {
    return new ApiError(err.message || 'Internal server error', {
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      details: { name: err.name },
    });
  }

  return new ApiError('Internal server error', {
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
  });
}

const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const apiError = normalizeError(err);

  logger.error('Request error', {
    method: req.method,
    path: req.originalUrl,
    statusCode: apiError.statusCode,
    code: apiError.code,
    message: apiError.message,
    details: apiError.details,
  });

  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    code: apiError.code,
    details: apiError.details,
  });
};

export default errorHandler;
