import Razorpay from 'razorpay';
import { config } from '../../config/env';
import { logger } from '../../common/utils/logger';
import { AppError, NotFoundError, ForbiddenError } from '../../common/errors/app-error';
import { prisma } from '../../config/prisma';
import { CreateOrderDto } from './payments.schema';

const razorpay = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID,
  key_secret: config.RAZORPAY_KEY_SECRET,
});

export class PaymentsService {
  createOrder = async (userId: string, dto: CreateOrderDto) => {
    try {
      const hold = await prisma.availabilityHold.findUnique({
        where: { id: dto.holdId },
      });

      if (!hold) {
        throw new NotFoundError('Hold not found or expired');
      }
      if (hold.userId !== userId) {
        throw new ForbiddenError('Hold does not belong to you');
      }
      if (hold.expiresAt < new Date()) {
        throw new AppError(410, 'HOLD_EXPIRED', 'Hold has expired. Please search again');
      }

      const amountInPaise = Math.round(dto.amount * 100);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const order = await (razorpay.orders.create as any)({
        amount: amountInPaise,
        currency: dto.currency,
        receipt: `hold_${dto.holdId.slice(0, 20)}`,
        notes: { holdId: dto.holdId, userId },
      });

      logger.info('Razorpay order created', {
        orderId: order.id,
        amountInPaise,
        holdId: dto.holdId,
        userId,
      });

      return {
        orderId: order.id,
        amount: amountInPaise,
        currency: order.currency,
        keyId: config.RAZORPAY_KEY_ID,
      };
    } catch (error) {
      logger.error('Failed to create Razorpay order', { error, userId, holdId: dto.holdId });
      if (error instanceof AppError) throw error;
      throw new AppError(502, 'PAYMENT_GATEWAY_ERROR', 'Failed to create payment order');
    }
  };
}
