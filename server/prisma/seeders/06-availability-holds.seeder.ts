import { PrismaClient } from '@prisma/client';
import { RoomTypeMeta } from './04-room-types.seeder';

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export async function seedAvailabilityHolds(
  prisma:    PrismaClient,
  userIds:   Record<string, string>,
  roomMetas: RoomTypeMeta[],
): Promise<void> {
  console.log('🌱 Seeding availability holds...');

  const now = new Date();
  const HOLDS = [
    { userKey: 'amit.verma@gmail.com',  metaIdx: 1,  checkinDays: 7,  checkoutDays: 9,  expiresInMin: 12 },
    { userKey: 'sneha.joshi@gmail.com', metaIdx: 12, checkinDays: 14, checkoutDays: 17, expiresInMin: 8  },
    { userKey: 'vikram.nair@gmail.com', metaIdx: 24, checkinDays: 21, checkoutDays: 24, expiresInMin: 5  },
  ];

  for (const h of HOLDS) {
    const meta = roomMetas[h.metaIdx];
    if (!meta) continue;
    await prisma.availabilityHold.create({
      data: {
        userId:     userIds[h.userKey],
        roomTypeId: meta.roomTypeId,
        propertyId: meta.propertyId,
        checkin:    addDays(now, h.checkinDays),
        checkout:   addDays(now, h.checkoutDays),
        expiresAt:  addMinutes(now, h.expiresInMin),
      },
    });
  }

  console.log('  ✅ 3 active holds created');
}
