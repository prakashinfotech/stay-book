import { PrismaClient } from '@prisma/client';
import { seedUsers }                from './seeders/01-users.seeder';
import { seedOtpTokens }            from './seeders/02-otp-tokens.seeder';
import { seedProperties }           from './seeders/03-properties.seeder';
import { seedRoomTypes }            from './seeders/04-room-types.seeder';
import { seedAvailability }         from './seeders/05-availability.seeder';
import { seedAvailabilityHolds }    from './seeders/06-availability-holds.seeder';
import { seedBookings }             from './seeders/07-bookings.seeder';
import { seedPaymentSimulations }   from './seeders/08-payment-simulations.seeder';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('\n🚀 Starting database seed...\n');

  // ── Clear existing data (reverse dependency order) ──────────────────────
  console.log('🧹 Clearing existing data...');
  await prisma.paymentSimulation.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.availabilityHold.deleteMany({});
  await prisma.availability.deleteMany({});
  await prisma.ratePlan.deleteMany({});
  await prisma.roomType.deleteMany({});
  await prisma.propertyImage.deleteMany({});
  await prisma.property.deleteMany({});
  await prisma.otpToken.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('  ✅ Cleared\n');

  // ── Seed in dependency order ─────────────────────────────────────────────
  const userIds = await seedUsers(prisma);
  console.log('');

  await seedOtpTokens(prisma, userIds);
  console.log('');

  const propertyIds = await seedProperties(prisma, userIds);
  console.log('');

  const properties = await prisma.property.findMany({
    where:  { id: { in: propertyIds } },
    select: { id: true, name: true },
    orderBy: { createdAt: 'asc' },
  });

  const roomMetas = await seedRoomTypes(prisma, properties);
  console.log('');

  await seedAvailability(prisma, roomMetas);
  console.log('');

  await seedAvailabilityHolds(prisma, userIds, roomMetas);
  console.log('');

  const bookingIds = await seedBookings(prisma, userIds, roomMetas);
  console.log('');

  await seedPaymentSimulations(prisma, bookingIds);

  console.log('\n─────────────────────────────────────────────────────');
  console.log('✅ Seed complete!\n');
  console.log('Login accounts:');
  console.log('  ADMIN    → admin@staybook.com          / Admin@123');
  console.log('  PARTNER  → rajesh@grandpalace.com      / Partner@123');
  console.log('  PARTNER  → priya@mountainview.com      / Partner@123');
  console.log('  PARTNER  → arjun@coastalresort.com     / Partner@123');
  console.log('  CUSTOMER → amit.verma@gmail.com        / Customer@123');
  console.log('  CUSTOMER → sneha.joshi@gmail.com       / Customer@123');
  console.log('  CUSTOMER → vikram.nair@gmail.com       / Customer@123');
  console.log('  CUSTOMER → pooja.singh@gmail.com       / Customer@123');
  console.log('  CUSTOMER → rahul.gupta@gmail.com       / Customer@123');
  console.log('  CUSTOMER → ananya.das@gmail.com        / Customer@123');
  console.log('  CUSTOMER → karan.shah@gmail.com        / Customer@123');
  console.log('  CUSTOMER → meera.iyer@gmail.com        / Customer@123');
  console.log('  CUSTOMER → rohan.kapoor@gmail.com      / Customer@123');
  console.log('  CUSTOMER → divya.pillai@gmail.com      / Customer@123');
  console.log('─────────────────────────────────────────────────────\n');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
