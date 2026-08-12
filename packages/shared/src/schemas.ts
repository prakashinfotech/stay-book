import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one digit'),
  firstName: z.string().min(1).trim().optional(),
  lastName: z.string().min(1).trim().optional(),
});

export const searchSchema = z.object({
  destination: z.string().min(1),
  checkin: z.string(),
  checkout: z.string(),
  adults: z.coerce.number().int().min(1).default(1),
  children: z.coerce.number().int().min(0).default(0),
  rooms: z.coerce.number().int().min(1).default(1),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const guestDetailsSchema = z.object({
  firstName: z.string().min(1).trim(),
  lastName: z.string().min(1).trim(),
  email: z.string().email(),
  phone: z.string().min(5),
  country: z.string().min(2),
  specialRequests: z.string().max(500).optional(),
  arrivalTime: z.string().optional(),
  isMainGuest: z.boolean().default(true),
});

export const paymentSchema = z.object({
  cardholderName: z.string().min(2),
  cardNumber: z.string().regex(/^\d{16}$/, 'Enter 16 digits'),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/, 'Format: MM/YY'),
  cvc: z.string().regex(/^\d{3}$/, '3-digit CVC required'),
  simulateFailure: z.boolean().optional(),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
export type SearchDto = z.infer<typeof searchSchema>;
export type GuestDetailsDto = z.infer<typeof guestDetailsSchema>;
export type PaymentDto = z.infer<typeof paymentSchema>;
