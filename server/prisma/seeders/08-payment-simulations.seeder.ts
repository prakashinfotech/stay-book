import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

export async function seedPaymentSimulations(
  prisma:     PrismaClient,
  bookingIds: string[],
): Promise<void> {
  console.log('🌱 Seeding payment simulations...');

  for (const bookingId of bookingIds) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) continue;

    const success = booking.status !== 'CANCELLED';

    await prisma.paymentSimulation.create({
      data: {
        bookingId,
        transactionId:   `TXN-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`,
        cardholderName:  booking.guestName,
        cardLastFour:    String(Math.floor(1000 + Math.random() * 9000)),
        success,
        simulatedFailure: false,
        failureReason:   success ? null : 'Cancelled by customer',
      },
    });
  }

  console.log(`  ✅ ${bookingIds.length} payment simulations seeded`);
}
