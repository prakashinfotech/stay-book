import { z } from 'zod';

export const partnerLegalSchema = z.object({
  entityType: z.enum(['INDIVIDUAL', 'BUSINESS'], {
    errorMap: () => ({ message: 'Please select either Individual or Business' }),
  }),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be 50 characters or less'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be 50 characters or less'),
  dateOfBirth: z.string()
    .min(1, 'Please select a valid date')
    .refine((date) => {
      const dob = new Date(date);
      const today = new Date();
      return dob < today;
    }, 'Date of birth must be in the past. You cannot use a future date.'),
  phone: z.string()
    .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits (no spaces, hyphens, or country codes)'),
  pan: z.string()
    .max(10, 'PAN must be in format: 5 letters + 4 numbers + 1 letter (e.g., ABCDE1234F)')
    .refine((val) => !val || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(val), 'PAN must be in format: 5 letters + 4 numbers + 1 letter (e.g., ABCDE1234F)')
    .optional()
    .or(z.literal('')),
  aadhaar: z.string()
    .max(12, 'Aadhaar must be exactly 12 digits (no spaces or letters)')
    .refine((val) => !val || /^\d{12}$/.test(val), 'Aadhaar must be exactly 12 digits (no spaces or letters)')
    .optional()
    .or(z.literal('')),
  gst: z.string()
    .max(15, 'GST number must be 15 characters or less')
    .optional()
    .or(z.literal('')),
}).refine(
  (data) => data.pan || data.aadhaar,
  { message: 'Please provide either PAN or Aadhaar number', path: ['pan'] }
);

export type PartnerLegalInput = z.infer<typeof partnerLegalSchema>;
