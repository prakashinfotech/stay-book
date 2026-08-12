import { z } from 'zod';

export const createOrderSchema = z.object({
  bookingId: z.string().uuid(),
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        quantity: z.number().int().min(1),
        unitPrice: z.number().positive(),
      }),
    )
    .min(1),
  notes: z.string().max(500).optional(),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
