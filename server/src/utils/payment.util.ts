import crypto from 'crypto';
import { logger } from '../common/utils/logger';

interface PaymentInput {
  cardholderName: string;
  cardNumberLast4: string;
  simulateFailure?: boolean;
}

interface PaymentResult {
  success: boolean;
  transactionId: string;
  failureReason?: string;
}

export function simulatePayment(input: PaymentInput): PaymentResult {
  logger.info('simulatePayment called', {
    cardholderName: input.cardholderName,
    cardNumberLast4: input.cardNumberLast4,
    simulateFailure: input.simulateFailure ?? false,
  });

  if (input.simulateFailure === true) {
    return {
      success: false,
      transactionId: `FAIL-${crypto.randomUUID()}`,
      failureReason: 'Payment declined. Please check your card details.',
    };
  }

  return {
    success: true,
    transactionId: `TXN-${crypto.randomUUID()}`,
  };
}
