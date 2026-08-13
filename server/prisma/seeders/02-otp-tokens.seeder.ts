import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

export async function seedOtpTokens(
  prisma:  PrismaClient,
  userIds: Record<string, string>,
): Promise<void> {
  console.log('🌱 Seeding OTP tokens...');
  const codeHash = await bcrypt.hash('123456', 10);
  const expiry   = new Date(Date.now() - 60_000); // already expired

  for (const userId of Object.values(userIds)) {
    await prisma.otpToken.create({
      data: { userId, codeHash, expiresAt: expiry, used: true },
    });
  }
  console.log(`  ✅ ${Object.keys(userIds).length} OTP tokens seeded (all pre-used)`);
}
