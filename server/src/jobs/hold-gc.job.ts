import { prisma } from '../config/prisma';
import { logger } from '../common/utils/logger';

export function startHoldGcJob(): void {
  setInterval(async () => {
    try {
      const result = await prisma.availabilityHold.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      if (result.count > 0) {
        logger.info('Hold GC: removed expired holds', { count: result.count });
      }
    } catch (error) {
      logger.error('Hold GC job failed', { error });
    }
  }, 5 * 60 * 1000);

  logger.info('Hold GC job started (runs every 5 min)');
}
