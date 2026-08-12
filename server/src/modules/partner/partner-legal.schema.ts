import { z } from 'zod';

export const upsertLegalSchema = z.object({
  entityType: z.enum(['INDIVIDUAL', 'BUSINESS'], {
    errorMap: () => ({ message: 'Please select either Individual or Business' })
  }),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be 50 characters or less'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be 50 characters or less'),
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid date')
    .refine((date) => {
      const dob = new Date(date);
      const today = new Date();
      return dob < today;
    }, 'Date of birth must be in the past. You cannot use a future date.'),
  pan: z.string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'PAN must be in format: 5 letters + 4 numbers + 1 letter (e.g., ABCDE1234F)')
    .optional()
    .or(z.literal('')),
  aadhaar: z.string()
    .regex(/^\d{12}$/, 'Aadhaar must be exactly 12 digits (no spaces or letters)')
    .optional()
    .or(z.literal('')),
  gst: z.string()
    .max(15, 'GST number must be 15 characters or less')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits (no spaces, hyphens, or country codes)'),
}).refine((data) => {
  // At least one optional ID should be provided
  if (data.pan || data.aadhaar) return true;
  return false;
}, {
  message: 'Please provide either PAN or Aadhaar number',
  path: ['pan'],
});

export const declineBookingSchema = z.object({
  reason: z.string().min(5, 'Please provide a reason (at least 5 characters)').max(500),
});

export type UpsertLegalDto = z.infer<typeof upsertLegalSchema>;
export type DeclineBookingDto = z.infer<typeof declineBookingSchema>;
