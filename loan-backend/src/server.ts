import 'dotenv/config';
import http from 'http';

import app from './app';
import logger from './common/logger/logger';
import prisma from './config/database';
import { requireEnv, env } from './config/env';
import { startScheduler, stopScheduler } from './jobs/scheduler';

let server: http.Server | undefined;

function getDatabaseTarget(databaseUrl: string) {
  try {
    const url = new URL(databaseUrl);
    const dbName = url.pathname?.replace(/^\//, '') || undefined;
    return {
      protocol: url.protocol.replace(/:$/, ''),
      host: url.hostname,
      port: url.port || undefined,
      database: dbName,
      username: url.username || undefined,
    };
  } catch {
    return { protocol: undefined, host: undefined, port: undefined, database: undefined, username: undefined };
  }
}

async function connectWithRetry() {
  const maxAttempts = env.NODE_ENV === 'production' ? 3 : 10;
  const baseDelayMs = 500;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await prisma.$connect();
      return;
    } catch (err: any) {
      const target = env.DATABASE_URL ? getDatabaseTarget(env.DATABASE_URL) : undefined;
      logger.error('Database connection failed', {
        attempt,
        maxAttempts,
        errorCode: err?.errorCode,
        name: err?.name,
        clientVersion: err?.clientVersion,
        target,
      });

      if (attempt === maxAttempts) throw err;

      const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function start() {
  requireEnv('DATABASE_URL');
  requireEnv('CLERK_SECRET_KEY');

  await connectWithRetry();

  server = http.createServer(app);

  server.listen(env.PORT, () => {
    logger.info('Server listening', { port: env.PORT, env: env.NODE_ENV });
  });

  if (env.NODE_ENV !== 'test') {
    startScheduler();
  }
}

async function shutdown(signal: string) {
  try {
    logger.info('Shutdown started', { signal });

    stopScheduler();

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
