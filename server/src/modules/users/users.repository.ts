import { prisma } from '../../config/prisma';
import { User } from '@prisma/client';

export class UsersRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id, deletedAt: null } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async create(data: { email: string; passwordHash: string; firstName?: string; lastName?: string }): Promise<User> {
    return prisma.user.create({ data });
  }

  async update(id: string, data: Partial<Pick<User, 'firstName' | 'lastName' | 'refreshToken' | 'emailVerified'>>): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async findPaginated(page: number, limit: number): Promise<[User[], number]> {
    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where: { deletedAt: null },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: { deletedAt: null } }),
    ]);
    return [data, total];
  }

  async saveRefreshToken(id: string, token: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { refreshToken: token } });
  }

  async findByRefreshToken(id: string, token: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { id, refreshToken: token } });
  }

  async removeRefreshToken(id: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { refreshToken: null } });
  }
}
