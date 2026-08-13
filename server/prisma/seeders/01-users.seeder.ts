import bcrypt from 'bcrypt';
import { PrismaClient, Role } from '@prisma/client';

const USERS = [
  { firstName: 'Super',  lastName: 'Admin',   email: 'admin@staybook.com',          password: 'Admin@123',    role: Role.ADMIN    },
  { firstName: 'Rajesh', lastName: 'Patel',   email: 'rajesh@grandpalace.com',      password: 'Partner@123',  role: Role.PARTNER  },
  { firstName: 'Priya',  lastName: 'Sharma',  email: 'priya@mountainview.com',      password: 'Partner@123',  role: Role.PARTNER  },
  { firstName: 'Arjun',  lastName: 'Mehta',   email: 'arjun@coastalresort.com',     password: 'Partner@123',  role: Role.PARTNER  },
  { firstName: 'Amit',   lastName: 'Verma',   email: 'amit.verma@gmail.com',        password: 'Customer@123', role: Role.CUSTOMER },
  { firstName: 'Sneha',  lastName: 'Joshi',   email: 'sneha.joshi@gmail.com',       password: 'Customer@123', role: Role.CUSTOMER },
  { firstName: 'Vikram', lastName: 'Nair',    email: 'vikram.nair@gmail.com',       password: 'Customer@123', role: Role.CUSTOMER },
  { firstName: 'Pooja',  lastName: 'Singh',   email: 'pooja.singh@gmail.com',       password: 'Customer@123', role: Role.CUSTOMER },
  { firstName: 'Rahul',  lastName: 'Gupta',   email: 'rahul.gupta@gmail.com',       password: 'Customer@123', role: Role.CUSTOMER },
  { firstName: 'Ananya', lastName: 'Das',     email: 'ananya.das@gmail.com',        password: 'Customer@123', role: Role.CUSTOMER },
  { firstName: 'Karan',  lastName: 'Shah',    email: 'karan.shah@gmail.com',        password: 'Customer@123', role: Role.CUSTOMER },
  { firstName: 'Meera',  lastName: 'Iyer',    email: 'meera.iyer@gmail.com',        password: 'Customer@123', role: Role.CUSTOMER },
  { firstName: 'Rohan',  lastName: 'Kapoor',  email: 'rohan.kapoor@gmail.com',      password: 'Customer@123', role: Role.CUSTOMER },
  { firstName: 'Divya',  lastName: 'Pillai',  email: 'divya.pillai@gmail.com',      password: 'Customer@123', role: Role.CUSTOMER },
];

export async function seedUsers(prisma: PrismaClient): Promise<Record<string, string>> {
  console.log('🌱 Seeding users...');
  const userIds: Record<string, string> = {};

  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where:  { email: u.email },
      update: {},
      create: { email: u.email, passwordHash, firstName: u.firstName, lastName: u.lastName, role: u.role, emailVerified: true },
    });
    userIds[u.email] = user.id;
    console.log(`  ✅ ${u.role}: ${u.email}`);
  }

  return userIds;
}
