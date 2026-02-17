import http from 'http';

import app from './app';
import logger from './common/logger/logger';
import prisma from './config/database';
import { requireEnv, env } from './config/env';

let server: http.Server | undefined;

async function start() {
  requireEnv('DATABASE_URL');
  requireEnv('CLERK_SECRET_KEY');

  await prisma.$connect();

  server = http.createServer(app);

  server.listen(env.PORT, () => {
    logger.info('Server listening', { port: env.PORT, env: env.NODE_ENV });
  });
}

async function shutdown(signal: string) {
  try {
    logger.info('Shutdown started', { signal });

    await new Promise<void>((resolve) => {
      if (!server) return resolve();
      server.close(() => resolve());
    });

    await prisma.$disconnect();
    logger.info('Shutdown complete', { signal });
    process.exit(0);
  } catch (err) {
    logger.error('Shutdown failed', { signal, err });
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

start().catch((err) => {
  logger.error('Server failed to start', { err });
  process.exit(1);
});
