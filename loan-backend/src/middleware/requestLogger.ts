import type { RequestHandler } from 'express';

import logger from '../common/logger/logger';

const requestLogger: RequestHandler = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip,
    });
  });

  next();
};

export default requestLogger;
