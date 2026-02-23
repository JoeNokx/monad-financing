import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { clerkMiddleware } from '@clerk/express';

import ApiError from './common/errors/ApiError';
import errorHandler from './common/errors/errorHandler';
import { clerkConfig } from './config/clerk';
import { env } from './config/env';
import apiRateLimit from './middleware/rateLimit';
import requestLogger from './middleware/requestLogger';
import routes from './routes';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

app.use(apiRateLimit);
app.use(requestLogger);

if (env.NODE_ENV !== 'test') {
  // Clerk middleware validates auth on incoming requests.
  // CLERK_AUTHORIZED_PARTIES is optional and can be used to restrict which frontend origins are accepted.
  const authorizedParties =
    env.NODE_ENV === 'production'
      ? env.CLERK_AUTHORIZED_PARTIES?.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

  const clerkOptions: any = {
    publishableKey: clerkConfig.publishableKey,
    secretKey: clerkConfig.secretKey,
    enableHandshake: false,
  };

  if (authorizedParties && authorizedParties.length > 0) {
    clerkOptions.authorizedParties = authorizedParties;
  }

  app.use('/api', clerkMiddleware(clerkOptions));
}

app.use('/api', routes);

app.use((_req, _res, next) => {
  next(
    new ApiError('Not found', {
      statusCode: 404,
      code: 'NOT_FOUND',
    }),
  );
});

app.use(errorHandler);

export default app;
