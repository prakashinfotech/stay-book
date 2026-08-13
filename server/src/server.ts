import { createApp } from './app';
import { config } from './config/env';
import { prisma } from './config/database';
import { logger } from './common/utils/logger';

async function bootstrap(): Promise<void> {
  await prisma.$connect();
  logger.info('Database connected');

  const app = createApp();

  app.listen(config.PORT, () => {
    logger.info(`Server running on port ${config.PORT} [${config.NODE_ENV}]`);
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
