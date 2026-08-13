import { z } from 'zod';

export const createOrderSchema = z.object({
  amount: z
    .number({ required_error: 'amount is required' })
    .positive('amount must be positive')
    .finite(),
  currency: z.string().length(3).default('INR'),
  holdId: z.string().uuid('holdId must be a valid UUID'),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
