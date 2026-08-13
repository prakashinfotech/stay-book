import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV:                 z.enum(['development', 'production', 'test']).default('development'),
  PORT:                     z.coerce.number().default(3001),
  CLIENT_URL:               z.string().url(),
  DATABASE_URL:             z.string().min(1),
  JWT_SECRET:               z.string().min(20),
  JWT_EXPIRATION:           z.string().default('1h'),
  JWT_REFRESH_SECRET:       z.string().min(20),
  RAZORPAY_KEY_ID:          z.string().min(1),
  RAZORPAY_KEY_SECRET:      z.string().min(1),
  DEV_BYPASS_PAYMENT:       z.coerce.boolean().default(false),
  AWS_REGION:               z.string().optional(),
  AWS_ACCESS_KEY_ID:        z.string().optional(),
  AWS_SECRET_ACCESS_KEY:    z.string().optional(),
  AWS_S3_BUCKET:            z.string().optional(),
  AWS_SQS_QUEUE_URL:        z.string().optional(),
  GEMINI_API_KEY:           z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
