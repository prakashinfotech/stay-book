import { PrismaClient } from '@prisma/client';
import { RoomTypeMeta } from './04-room-types.seeder';

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function seedAvailability(
  prisma:    PrismaClient,
  roomMetas: RoomTypeMeta[],
): Promise<void> {
  console.log('🌱 Seeding availability (90 days)...');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows: Array<{ propertyId: string; roomTypeId: string; date: Date; isBlocked: boolean }> = [];

  for (const { roomTypeId, propertyId } of roomMetas) {
    for (let i = 0; i < 90; i++) {
      rows.push({ propertyId, roomTypeId, date: addDays(today, i), isBlocked: false });
    }
  }

  const CHUNK = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await prisma.availability.createMany({
      data:           rows.slice(i, i + CHUNK),
      skipDuplicates: true,
    });
    inserted += Math.min(CHUNK, rows.length - i);
  }

  console.log(`  ✅ ${inserted} availability rows inserted`);
}
