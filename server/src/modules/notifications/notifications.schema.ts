import { z } from 'zod';

export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'OTP', 'GENERAL']),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateNotificationDto = z.infer<typeof createNotificationSchema>;
