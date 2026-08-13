# NODE.JS / EXPRESS.JS DEVELOPMENT RULES

You are an expert in Node.js, Express.js, TypeScript, and backend development for booking and ecommerce systems.

---

## Key Principles

- Use strict TypeScript — no `any`, explicit return types on all functions, `readonly` on immutable properties.
- Use async/await for all asynchronous operations — never raw Promises or callbacks.
- Follow SOLID principles: single responsibility, one router/service/repository per feature.
- Prioritize security, validation, and error handling on every endpoint.
- Structure code in feature modules — one folder per domain feature.

---

## Project Structure

```
server/
├── src/
│   ├── app.ts                    # Express app setup
│   ├── server.ts                 # HTTP server entry point
│   ├── config/
│   │   ├── env.ts                # Env validation (Joi)
│   │   └── database.ts           # DB connection
│   ├── common/
│   │   ├── middleware/           # Auth, logging, rate-limit
│   │   ├── errors/               # AppError class, error handler
│   │   ├── validators/           # Shared Zod/Joi schemas
│   │   └── utils/                # Pure helper functions
│   ├── modules/
│   │   └── <feature>/
│   │       ├── <feature>.router.ts
│   │       ├── <feature>.controller.ts
│   │       ├── <feature>.service.ts
│   │       ├── <feature>.repository.ts
│   │       ├── <feature>.schema.ts    # Zod validation schemas
│   │       └── <feature>.entity.ts
│   └── database/
│       ├── migrations/
│       └── seeders/
```

### File Naming
- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Constants / Enums: `SCREAMING_SNAKE_CASE`

---

## Environment Variables

Validate all required env vars on startup with Joi — fail fast if any are missing:

```typescript
// config/env.ts
import Joi from 'joi';
import dotenv from 'dotenv';

dotenv.config();

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').required(),
  PORT: Joi.number().default(3001),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASS: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRATION: Joi.string().default('1h'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  AWS_REGION: Joi.string().required(),
  AWS_S3_BUCKET: Joi.string().required(),
  AWS_SQS_QUEUE_URL: Joi.string().required(),
}).unknown(false);

const { error, value } = schema.validate(process.env);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = value as EnvConfig;
```

### Rules
- Never hardcode secrets — always read from `config`
- Use separate `.env` files per environment
- Never commit `.env` — commit `.env.example` only

---

## App Setup (app.ts)

```typescript
import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { morganMiddleware } from './common/middleware/morgan.middleware';
import { globalErrorHandler } from './common/errors/error-handler';
import { userRouter } from './modules/user/user.router';

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.CLIENT_URL, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morganMiddleware);

  // Routes
  app.use('/api/v1/users', userRouter);

  // Global error handler — must be last
  app.use(globalErrorHandler);

  return app;
}
```

---

## Routers

```typescript
// user.router.ts
import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authorize } from '../../common/middleware/roles.middleware';
import { UserController } from './user.controller';

const router = Router();
const controller = new UserController();

router.get('/:id', authenticate, controller.findOne);
router.post('/', controller.create);
router.patch('/:id', authenticate, controller.update);

export { router as userRouter };
```

### Rules
- One router file per feature
- Apply `authenticate` middleware per route or router-level
- Use `authorize(Role.ADMIN)` for role-protected routes
- Register all routers in `app.ts`

---

## Controllers

```typescript
// user.controller.ts
import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { createUserSchema } from './user.schema';

export class UserController {
  private readonly userService = new UserService();

  findOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.findById(req.params.id);
      res.status(200).json({ statusCode: 200, data: user, message: 'Success' });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = createUserSchema.parse(req.body);
      const user = await this.userService.create(dto);
      res.status(201).json({ statusCode: 201, data: user, message: 'Created' });
    } catch (error) {
      next(error);
    }
  };
}
```

### Rules
- Controllers handle HTTP only — parse input, call service, send response
- Always pass errors to `next(error)` — never handle in controller
- Use arrow functions for route handlers to preserve `this` context
- Validate request body in controller before passing to service

---

## Services

```typescript
// user.service.ts
import { ConflictError, NotFoundError } from '../../common/errors/app-error';
import { logger } from '../../common/utils/logger';
import { UserRepository } from './user.repository';
import { hashPassword } from '../../common/utils/hash';

export class UserService {
  private readonly userRepository = new UserRepository();

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError('Email already in use');
    }

    const hashedPassword = await hashPassword(dto.password);
    const user = await this.userRepository.create({ ...dto, password: hashedPassword });

    logger.info('User created', { userId: user.id });
    return sanitizeUser(user);
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundError(`User ${id} not found`);
    return sanitizeUser(user);
  }
}

function sanitizeUser(user: User): UserResponseDto {
  const { password, ...safe } = user;
  return safe;
}
```

### Rules
- Services contain all business logic
- Throw typed `AppError` subclasses — never raw `Error` or HTTP status codes
- Strip sensitive fields (password) before returning from service
- Log operations with structured objects — never interpolated strings

---

## Validation (Zod)

Use Zod for all input validation:

```typescript
// user.schema.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8),
  firstName: z.string().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
```

### Validation Middleware

```typescript
import { z, ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        statusCode: 400,
        message: result.error.errors.map((e) => e.message).join(', '),
      });
      return;
    }
    req.body = result.data;
    next();
  };

// Usage in router
router.post('/', validate(createUserSchema), controller.create);
```

### Rules
- Every route with a body must have a Zod schema
- Use `.transform()` to normalize input (lowercase, trim)
- Use `z.infer<typeof schema>` for TypeScript types — no duplicate type definitions
- Validate query params and route params with separate schemas

---

## Error Handling

### AppError Class

```typescript
// common/errors/app-error.ts
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly isOperational = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) { super(message, 400); }
}
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') { super(message, 401); }
}
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') { super(message, 403); }
}
export class NotFoundError extends AppError {
  constructor(message: string) { super(message, 404); }
}
export class ConflictError extends AppError {
  constructor(message: string) { super(message, 409); }
}
```

### Global Error Handler Middleware

```typescript
// common/errors/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from './app-error';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export function globalErrorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  logger.error(`${req.method} ${req.url}`, { error });

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      statusCode: error.statusCode,
      message: error.message,
      timestamp: new Date().toISOString(),
      path: req.url,
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      statusCode: 400,
      message: error.errors.map((e) => e.message).join(', '),
    });
    return;
  }

  res.status(500).json({
    statusCode: 500,
    message: 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.url,
  });
}
```

### Rules
- Register `globalErrorHandler` as the **last** middleware in `app.ts`
- Always call `next(error)` in route handlers — never handle in controller
- Never expose stack traces or internal details to clients
- Use `AppError` subclasses for all known error cases

---

## Authentication & Authorization

### JWT Middleware

```typescript
// common/middleware/auth.middleware.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors/app-error';
import { config } from '../../config/env';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new UnauthorizedError('No token provided');

  try {
    req.user = jwt.verify(token, config.JWT_SECRET) as AuthUser;
    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
```

### Roles Middleware

```typescript
export const authorize =
  (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!roles.includes(req.user?.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    next();
  };
```

### Refresh Token Pattern

```typescript
async login(dto: LoginDto): Promise<TokenPairDto> {
  const user = await this.validateCredentials(dto);
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRATION },
  );
  const refreshToken = jwt.sign(
    { sub: user.id },
    config.JWT_REFRESH_SECRET,
    { expiresIn: '7d' },
  );
  await this.userRepository.saveRefreshToken(user.id, refreshToken);
  return { accessToken, refreshToken };
}

async refresh(token: string): Promise<TokenPairDto> {
  const payload = jwt.verify(token, config.JWT_REFRESH_SECRET) as { sub: string };
  const user = await this.userRepository.findByRefreshToken(payload.sub, token);
  if (!user) throw new UnauthorizedError('Invalid refresh token');
  await this.userRepository.removeRefreshToken(user.id, token);
  return this.login({ id: user.id } as LoginDto);
}
```

### Rules
- Never trust client-supplied user IDs — always use `req.user` from verified JWT
- Store only `id`, `email`, `role` in JWT payload — nothing sensitive
- Access token: 1h expiry. Refresh token: 7d, rotate on every use
- Hash passwords with `bcrypt` (min 10 rounds)

---

## Database / ORM (TypeORM)

### Entity Pattern

```typescript
// user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })  // excluded from all find() queries
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
```

### Repository Pattern

```typescript
// user.repository.ts
import { AppDataSource } from '../../config/database';

export class UserRepository {
  private readonly repo = AppDataSource.getRepository(User);

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findPaginated(page: number, limit: number): Promise<[User[], number]> {
    return this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }
}
```

### Transaction Management

> **Critical:** Repositories initialized outside a transaction are not transaction-aware.
> Always use the transactional `EntityManager` for every operation inside the callback.

```typescript
async transferBooking(fromId: string, toId: string): Promise<void> {
  await AppDataSource.transaction(async (manager) => {
    // Use manager.findOne / manager.save — NOT this.repo
    const booking = await manager.findOneOrFail(Booking, { where: { id: fromId } });
    await manager.update(Booking, fromId, { status: BookingStatus.CANCELLED });
    await manager.save(Booking, { ...booking, id: toId, status: BookingStatus.ACTIVE });
  });
}
```

### Soft Delete Query Patterns

```typescript
// Default find() excludes soft-deleted rows automatically

// Include soft-deleted rows
await this.repo.find({ withDeleted: true });

// Restore a soft-deleted record
await this.repo.restore(id);
```

### Rules
- Use soft deletes (`@DeleteDateColumn`) — never hard delete user, booking, or order data
- `select: false` protects columns in `find()` — **not** in `QueryBuilder` (add `.addSelect()` explicitly)
- Wrap multi-step operations in transactions; use the transactional `EntityManager` inside
- Never `synchronize: true` in production — use migrations
- Add `@Index()` on columns used in `WHERE`, `ORDER BY`, `JOIN`
- Avoid N+1: use `relations` option or `QueryBuilder` with joins

---

## Migrations

```bash
# Generate migration from entity changes
npx typeorm migration:generate src/database/migrations/<Name> -d src/config/data-source.ts

# Run pending migrations
npm run migrate

# Revert last migration (ask user first)
npm run migrate:undo
```

### Rules
- One migration file per schema change — never edit an already-run migration
- Always review generated SQL before running
- Test on dev DB before applying to production

---

## Pagination

```typescript
export interface PaginationQuery {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function paginate<T>(data: T[], total: number, query: PaginationQuery): PaginatedResponse<T> {
  return {
    data,
    meta: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}
```

---

## Logging (Winston)

```typescript
// common/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) =>
          `${timestamp} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`,
        ),
      ),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

### Rules
- Import `logger` in every service and repository
- Log all create/update/delete operations with entity ID
- Log errors with context: `{ userId, action, entityId }` — never passwords, tokens, or card numbers
- Use structured objects, not string concatenation

---

## API Response Format

All endpoints return a consistent shape:

```typescript
// Success
{ "statusCode": 200, "data": { ... }, "message": "Success" }

// Paginated
{ "statusCode": 200, "data": [...], "meta": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 } }

// Error
{ "statusCode": 400, "message": "Validation failed", "timestamp": "...", "path": "/api/users" }
```

Use a response helper to keep it consistent:

```typescript
export const ok = <T>(res: Response, data: T, message = 'Success'): void => {
  res.status(200).json({ statusCode: 200, data, message });
};
export const created = <T>(res: Response, data: T): void => {
  res.status(201).json({ statusCode: 201, data, message: 'Created' });
};
```

---

## WebSocket (Socket.io)

```typescript
import { Server } from 'socket.io';
import { verifyToken } from '../common/utils/jwt';

export function initSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, { cors: { origin: config.CLIENT_URL } });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    try {
      socket.data.user = verifyToken(token);
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}
```

### Rules
- Authenticate WebSocket connections via JWT in handshake `auth.token`
- Use rooms for scoped broadcasts (booking ID, user ID)
- Emit typed events — define event/payload types in a shared types file

---

## Security

```typescript
// app.ts
app.use(helmet());
app.use(cors({ origin: config.CLIENT_URL, credentials: true }));

// Rate limiting
import rateLimit from 'express-rate-limit';

const globalLimiter = rateLimit({ windowMs: 60_000, max: 100 });
const authLimiter = rateLimit({ windowMs: 60_000, max: 5 });

app.use('/api', globalLimiter);
app.use('/api/v1/auth', authLimiter);
```

### Rules
- Enable `helmet()` and `cors` globally — never `origin: '*'` in production
- Apply stricter rate limits on auth endpoints (login, register, refresh)
- Parameterized queries only — no raw SQL string concatenation
- Validate and whitelist MIME types on file uploads
- Use `@IsUUID` / `z.string().uuid()` on all ID params

---

## Performance

- Fetch only required columns — avoid `SELECT *`
- Add `@Index()` on columns used in `WHERE`, `ORDER BY`, `JOIN`
- Use `QueryBuilder` for complex queries with joins
- Use connection pooling (TypeORM `extra: { max: 10 }`)
- Enable response compression with `compression` middleware
- Offload heavy tasks (email, PDF, image processing) to SQS workers
- Profile slow queries with `logging: ['query', 'slow']` in TypeORM config

---

## Key Commands

```bash
# Development
npm run dev                   # nodemon watch mode

# Build & Test
npm run build
npm run test
npm run test:cov
npm run test:integration

# Database Migrations
npx typeorm migration:generate src/database/migrations/<Name> -d src/config/data-source.ts
npm run migrate
npm run migrate:undo          # revert last (ask user first)
npm run db:seed:all

# Lint
npm run lint
npm run lint --fix
```

---

## Dependencies

```json
{
  "dependencies": {
    "express": "^4.18",
    "helmet": "^7",
    "cors": "^2",
    "compression": "^1",
    "jsonwebtoken": "^9",
    "bcrypt": "^5",
    "zod": "^3",
    "typeorm": "^0.3",
    "pg": "^8",
    "redis": "^4",
    "winston": "^3",
    "morgan": "^1",
    "express-rate-limit": "^7",
    "socket.io": "^4",
    "node-cron": "^3",
    "multer": "^1",
    "@aws-sdk/client-s3": "^3",
    "@aws-sdk/client-sqs": "^3",
    "uuid": "^9",
    "joi": "^17",
    "dotenv": "^16"
  },
  "devDependencies": {
    "nodemon": "^3",
    "ts-node": "^10",
    "jest": "^29",
    "supertest": "^6",
    "@types/express": "^4",
    "@types/jsonwebtoken": "^9",
    "@types/bcrypt": "^5",
    "@types/cors": "^2",
    "@types/compression": "^1",
    "@types/morgan": "^1",
    "@types/multer": "^1",
    "@types/node-cron": "^3",
    "@types/supertest": "^6",
    "@types/uuid": "^9"
  }
}
```
