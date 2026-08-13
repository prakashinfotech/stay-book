import { PrismaClient, BookingStatus } from '@prisma/client';
import { RoomTypeMeta } from './04-room-types.seeder';
import { randomBytes } from 'crypto';

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function subDays(date: Date, days: number): Date {
  return addDays(date, -days);
}
function confirmationNumber(): string {
  return `STB-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`;
}
function pin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// rtIdx matches the order rooms are created: 3 per property × 12 properties
// [0-2] Grand Palace, [3-5] Heritage Haveli, [6-8] Business Suite, [9-11] Budget Inn
// [12-14] Mountain View Resort, [15-17] Snow Peak, [18-20] Valley Camp, [21-23] Pine Wood
// [24-26] Coastal Breeze, [27-29] Beachfront Villa, [30-32] Sunset Shack, [33-35] Goa Boutique
const BOOKING_DEFS = [
  // Past confirmed
  { userKey: 'amit.verma@gmail.com',   rtIdx: 1,  status: BookingStatus.CONFIRMED, checkin: -20, checkout: -18, adults: 2, total: 17000, guestName: 'Amit Verma',   guestEmail: 'amit.verma@gmail.com',   phone: '+91 98765 43210' },
  { userKey: 'vikram.nair@gmail.com',  rtIdx: 25, status: BookingStatus.CONFIRMED, checkin: -35, checkout: -32, adults: 2, total: 36000, guestName: 'Vikram Nair',  guestEmail: 'vikram.nair@gmail.com',  phone: '+91 97654 32109' },
  { userKey: 'pooja.singh@gmail.com',  rtIdx: 4,  status: BookingStatus.CONFIRMED, checkin: -25, checkout: -23, adults: 1, total: 13000, guestName: 'Pooja Singh',  guestEmail: 'pooja.singh@gmail.com',  phone: '+91 96543 21098' },
  { userKey: 'karan.shah@gmail.com',   rtIdx: 9,  status: BookingStatus.CONFIRMED, checkin: -10, checkout: -9,  adults: 1, total: 1800,  guestName: 'Karan Shah',   guestEmail: 'karan.shah@gmail.com',   phone: '+91 95432 10987' },
  { userKey: 'rohan.kapoor@gmail.com', rtIdx: 2,  status: BookingStatus.CONFIRMED, checkin: -15, checkout: -13, adults: 2, total: 11000, guestName: 'Rohan Kapoor', guestEmail: 'rohan.kapoor@gmail.com', phone: '+91 94321 09876' },
  { userKey: 'divya.pillai@gmail.com', rtIdx: 26, status: BookingStatus.CONFIRMED, checkin: -8,  checkout: -6,  adults: 2, total: 15000, guestName: 'Divya Pillai', guestEmail: 'divya.pillai@gmail.com', phone: '+91 93210 98765' },
  { userKey: 'vikram.nair@gmail.com',  rtIdx: 6,  status: BookingStatus.CONFIRMED, checkin: -5,  checkout: -4,  adults: 1, total: 9500,  guestName: 'Vikram Nair',  guestEmail: 'vikram.nair@gmail.com',  phone: '+91 97654 32109' },
  { userKey: 'rahul.gupta@gmail.com',  rtIdx: 34, status: BookingStatus.CONFIRMED, checkin: -3,  checkout: -2,  adults: 2, total: 5500,  guestName: 'Rahul Gupta',  guestEmail: 'rahul.gupta@gmail.com',  phone: '+91 91234 56789' },
  // Past cancelled
  { userKey: 'rahul.gupta@gmail.com',  rtIdx: 33, status: BookingStatus.CANCELLED, checkin: -45, checkout: -43, adults: 2, total: 11000, guestName: 'Rahul Gupta',  guestEmail: 'rahul.gupta@gmail.com',  phone: '+91 91234 56789' },
  { userKey: 'sneha.joshi@gmail.com',  rtIdx: 30, status: BookingStatus.CANCELLED, checkin: -30, checkout: -29, adults: 1, total: 1800,  guestName: 'Sneha Joshi',  guestEmail: 'sneha.joshi@gmail.com',  phone: '+91 99876 54321' },
  // Upcoming confirmed
  { userKey: 'sneha.joshi@gmail.com',  rtIdx: 13, status: BookingStatus.CONFIRMED, checkin: 7,   checkout: 10,  adults: 2, total: 36000, guestName: 'Sneha Joshi',  guestEmail: 'sneha.joshi@gmail.com',  phone: '+91 99876 54321' },
  { userKey: 'ananya.das@gmail.com',   rtIdx: 16, status: BookingStatus.CONFIRMED, checkin: 10,  checkout: 13,  adults: 2, total: 21000, guestName: 'Ananya Das',   guestEmail: 'ananya.das@gmail.com',   phone: '+91 92345 67890' },
  { userKey: 'meera.iyer@gmail.com',   rtIdx: 27, status: BookingStatus.CONFIRMED, checkin: 14,  checkout: 17,  adults: 4, total: 54000, guestName: 'Meera Iyer',   guestEmail: 'meera.iyer@gmail.com',   phone: '+91 90123 45678' },
  { userKey: 'amit.verma@gmail.com',   rtIdx: 21, status: BookingStatus.CONFIRMED, checkin: 20,  checkout: 22,  adults: 2, total: 9000,  guestName: 'Amit Verma',   guestEmail: 'amit.verma@gmail.com',   phone: '+91 98765 43210' },
  { userKey: 'pooja.singh@gmail.com',  rtIdx: 18, status: BookingStatus.CONFIRMED, checkin: 5,   checkout: 7,   adults: 2, total: 3600,  guestName: 'Pooja Singh',  guestEmail: 'pooja.singh@gmail.com',  phone: '+91 96543 21098' },
];

export async function seedBookings(
  prisma:    PrismaClient,
  userIds:   Record<string, string>,
  roomMetas: RoomTypeMeta[],
): Promise<string[]> {
  console.log('🌱 Seeding bookings...');
  const now = new Date();
  const bookingIds: string[] = [];

  for (const b of BOOKING_DEFS) {
    const meta = roomMetas[b.rtIdx];
    if (!meta) { console.warn(`  ⚠️  No room meta at index ${b.rtIdx}, skipping`); continue; }

    const booking = await prisma.booking.create({
      data: {
        userId:             userIds[b.userKey],
        propertyId:         meta.propertyId,
        roomTypeId:         meta.roomTypeId,
        ratePlanId:         meta.ratePlanId,
        status:             b.status,
        checkin:            subDays(now, -b.checkin),  // negative checkin = future, positive = past
        checkout:           subDays(now, -b.checkout),
        adults:             b.adults,
        children:           0,
        totalPrice:         b.total,
        confirmationNumber: confirmationNumber(),
        pin:                pin(),
        guestName:          b.guestName,
        guestEmail:         b.guestEmail,
        guestPhone:         b.phone,
        guestCountry:       'India',
      },
    });
    bookingIds.push(booking.id);
  }

  console.log(`  ✅ ${bookingIds.length} bookings seeded`);
  return bookingIds;
}
