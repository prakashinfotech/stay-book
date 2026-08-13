/**
 * One-time script: backfills lat/lng for properties that have null values.
 * Run with: npx ts-node prisma/scripts/backfill-latlng.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const patched = await prisma.property.updateMany({
    where: { AND: [{ lat: null }, { lng: null }] },
    data: { lat: 23.0503, lng: 72.5311 },
  });
  console.log(`Backfilled lat/lng for ${patched.count} propert${patched.count === 1 ? 'y' : 'ies'}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
