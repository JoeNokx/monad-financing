import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { clerkMiddleware } from '@clerk/express';

import ApiError from './common/errors/ApiError';
import errorHandler from './common/errors/errorHandler';
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

app.use(clerkMiddleware());

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
