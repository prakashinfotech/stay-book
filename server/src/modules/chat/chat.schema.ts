import { z } from 'zod';

const apiContentSchema = z.object({
  role: z.enum(['user', 'model']),
  parts: z.array(z.object({ text: z.string() })),
});

export const askSchema = z.object({
  history: z.array(apiContentSchema).max(50),
  userText: z.string().min(1).max(500),
});

export type AskDto = z.infer<typeof askSchema>;
