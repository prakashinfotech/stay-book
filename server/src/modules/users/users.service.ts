import { User } from '@prisma/client';
import { ConflictError, NotFoundError } from '../../common/errors/app-error';
import { logger } from '../../common/utils/logger';
import { hashPassword } from '../../common/utils/hash';
import { UsersRepository } from './users.repository';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './users.schema';

export class UsersService {
  private readonly usersRepository = new UsersRepository();

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) throw new ConflictError('Email already in use');

    const passwordHash = await hashPassword(dto.password);
    const user = await this.usersRepository.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    logger.info('User created', { userId: user.id });
    return this.sanitize(user);
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundError(`User ${id} not found`);
    return this.sanitize(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    await this.findById(id);
    const updated = await this.usersRepository.update(id, dto);
    logger.info('User updated', { userId: id });
    return this.sanitize(updated);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.usersRepository.softDelete(id);
    logger.info('User soft-deleted', { userId: id });
  }

  private sanitize(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };
  }
}
