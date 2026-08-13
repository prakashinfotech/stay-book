import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { morganMiddleware } from './common/middleware/morgan.middleware';
import { globalErrorHandler } from './common/errors/error-handler';
import { authRouter } from './modules/auth/auth.router';
import { usersRouter } from './modules/users/users.router';
import { searchRouter } from './modules/search/search.router';
import { propertiesRouter } from './modules/properties/properties.router';
import { bookingsRouter } from './modules/bookings/bookings.router';
import { paymentsRouter } from './modules/payments/payments.router';
import { partnerRouter } from './modules/partner/partner.router';
import { adminRouter } from './modules/admin/admin.router';
import { mediaRouter } from './modules/media/media.router';
import { chatRouter } from './modules/chat/chat.router';

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: config.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morganMiddleware);

  const globalLimiter = rateLimit({ windowMs: 60_000, max: 100 });
  app.use('/api', globalLimiter);

  app.get('/health', (_req, res) => res.json({ status: 'ok', env: config.NODE_ENV }));

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/search', searchRouter);
  app.use('/api/v1/properties', propertiesRouter);
  app.use('/api/v1/bookings', bookingsRouter);
  app.use('/api/v1/payments', paymentsRouter);
  app.use('/api/v1/partner', partnerRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/media', mediaRouter);
  app.use('/api/v1/chat', chatRouter);

  app.use(globalErrorHandler);

  return app;
}
