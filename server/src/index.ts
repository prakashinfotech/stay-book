import { createApp } from './app';
import { config } from './config/env';
import { prisma } from './config/prisma';
import { logger } from './common/utils/logger';
import { startHoldGcJob } from './jobs/hold-gc.job';

async function bootstrap(): Promise<void> {
  await prisma.$connect();
  logger.info('Database connected');

  startHoldGcJob();

  const app = createApp();

  app.listen(config.PORT, () => {
    logger.info(`Server running on http://localhost:${config.PORT} [${config.NODE_ENV}]`);
  });

  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});
