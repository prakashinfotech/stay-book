# Full-Stack Development Guide
## PostgreSQL 15 · Node.js (Express) · React 18
**Production-Ready — Platform-by-Platform**

> **Rules in effect:** This guide is aligned with `general-rules.md`.
> Every pattern, command, and code snippet follows those conventions.

---

## ⚠️ CRITICAL — Read Before Anything

```
NEVER execute without explicit user approval:
  git push           — under any circumstances
  rm / rm -rf        — any deletion
  DELETE (SQL)       — without confirmation
  DROP TABLE/DB      — ever
  migrate:undo:all   — without confirmation

ALWAYS ask before any git command:
  git commit / add / reset / rebase / merge /
  branch / checkout / pull / fetch / stash / tag
  → Suggest → Explain → Wait for approval → Execute
```

---

## Task Assignment — Load Rules First

| Task context | Run before starting |
|---|---|
| Working in `server/` (backend) | `/nestjs-rules` |
| Working in `client/` (frontend) | `/react-rules` |
| Project structure / tech stack / integrations | `/project-rules` |
| Task spans both client and server | Both `/react-rules` + `/nestjs-rules` |
| Monorepo / AWS / WebSocket / i18n / logging | `/project-rules` |

**Do not proceed with any task until the relevant rules are loaded.**

---

## Quick Reference

| Platform | Tech | Port |
|---|---|---|
| Database | PostgreSQL 15 | 5432 |
| Backend | Node.js + Express + TypeScript | 3001 |
| Frontend | React 18 + Vite + TypeScript | 5173 |
| DB Admin | pgAdmin 4 | 5050 |

---

## Monorepo Structure

```
booking-app/
├── client/                   ← React 18 frontend  (run /react-rules here)
│   ├── src/
│   ├── .env
│   └── package.json
├── server/                   ← Node.js backend    (run /nestjs-rules here)
│   ├── src/
│   ├── prisma/
│   ├── .env
│   └── package.json
├── packages/
│   └── shared/               ← Shared types + Zod schemas (never import across client↔server directly)
├── docker-compose.yml
├── .env.example
└── package.json              ← pnpm workspace root
```

> **Convention (general-rules):** Monorepo package boundaries are strict.
> Never import `client/` code in `server/` or vice versa — use `packages/shared` for shared contracts.

---

---

# PLATFORM 1: DATABASE (PostgreSQL 15)

---

## 1.1 Local Setup

**Option A — Docker (recommended)**

```yaml
# docker-compose.yml
version: "3.9"
services:
  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: apppassword
      POSTGRES_DB: appdb
    volumes:
      - pgdata:/var/lib/postgresql/data

  pgadmin:
    image: dpage/pgadmin4
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@app.com
      PGADMIN_DEFAULT_PASSWORD: admin

volumes:
  pgdata:
```

```bash
docker-compose up -d
```

**Option B — Local install**

```bash
# macOS
brew install postgresql@15 && brew services start postgresql@15

# Ubuntu
sudo apt install postgresql-15
```

---

## 1.2 Schema Design

> **Rule (general-rules):** Parameterized queries only — no raw SQL string building.
> Prisma ORM enforces this by default. All schema changes go through migrations — never edit DB manually.

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USERS
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            VARCHAR(20)  NOT NULL DEFAULT 'CUSTOMER'
                  CHECK (role IN ('CUSTOMER', 'PARTNER', 'ADMIN')),
  email_verified  BOOLEAN      NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- OTP TOKENS
CREATE TABLE otp_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash   VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PROPERTIES
CREATE TABLE properties (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  address       VARCHAR(500),
  city          VARCHAR(100),
  lat           NUMERIC(10, 7),
  lng           NUMERIC(10, 7),
  category      VARCHAR(50),
  status        VARCHAR(20)  NOT NULL DEFAULT 'DRAFT'
                CHECK (status IN ('ACTIVE', 'DRAFT', 'PAUSED')),
  star_rating   SMALLINT     CHECK (star_rating BETWEEN 1 AND 5),
  amenities     JSONB        NOT NULL DEFAULT '[]',
  search_vector TSVECTOR,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ROOM TYPES
CREATE TABLE room_types (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id         UUID        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name                VARCHAR(255) NOT NULL,
  max_occupancy       SMALLINT    NOT NULL,
  base_price          NUMERIC(10,2) NOT NULL,
  cancellation_policy VARCHAR(20) NOT NULL DEFAULT 'FLEXIBLE'
                      CHECK (cancellation_policy IN ('FLEXIBLE', 'NON_REFUNDABLE')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AVAILABILITY
CREATE TABLE availability (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID    NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_type_id  UUID    NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  date          DATE    NOT NULL,
  is_blocked    BOOLEAN NOT NULL DEFAULT false,
  booking_id    UUID,
  UNIQUE (room_type_id, date)
);

-- AVAILABILITY HOLDS  (TTL-based; cleaned up by cron job)
CREATE TABLE availability_holds (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id  UUID        NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
  checkin       DATE        NOT NULL,
  checkout      DATE        NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL
);

-- BOOKINGS
CREATE TABLE bookings (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES users(id)      ON DELETE RESTRICT,
  property_id         UUID        NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  room_type_id        UUID        NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
  checkin             DATE        NOT NULL,
  checkout            DATE        NOT NULL,
  adults              SMALLINT    NOT NULL DEFAULT 1,
  total_price         NUMERIC(10,2) NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED'
                      CHECK (status IN ('CONFIRMED','CANCELLED','COMPLETED','NO_SHOW')),
  confirmation_number VARCHAR(20) UNIQUE NOT NULL,
  pin                 CHAR(4)     NOT NULL,
  payment_tx_id       VARCHAR(100),
  guest_name          VARCHAR(255) NOT NULL,
  guest_email         VARCHAR(255) NOT NULL,
  guest_phone         VARCHAR(30),
  special_requests    TEXT,
  cancellation_reason TEXT,
  cancelled_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PAYMENT SIMULATIONS  (audit log — swap body for Stripe in Phase 2)
CREATE TABLE payment_simulations (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id        UUID        REFERENCES bookings(id) ON DELETE SET NULL,
  transaction_id    VARCHAR(100) NOT NULL,
  cardholder_name   VARCHAR(255) NOT NULL,
  card_last_four    CHAR(4)     NOT NULL,   -- NEVER store full card number
  simulated_failure BOOLEAN     NOT NULL DEFAULT false,
  success           BOOLEAN     NOT NULL,
  failure_reason    TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 1.3 Indexes

```sql
-- Full-text search
CREATE INDEX idx_properties_city      ON properties(city);
CREATE INDEX idx_properties_status    ON properties(status);
CREATE INDEX idx_properties_search    ON properties USING GIN(search_vector);
CREATE INDEX idx_properties_amenities ON properties USING GIN(amenities);

-- Availability
CREATE INDEX idx_availability_room_date ON availability(room_type_id, date);
CREATE INDEX idx_availability_property  ON availability(property_id);

-- Bookings
CREATE INDEX idx_bookings_user     ON bookings(user_id);
CREATE INDEX idx_bookings_property ON bookings(property_id);
CREATE INDEX idx_bookings_status   ON bookings(status);

-- Hold GC
CREATE INDEX idx_holds_expires ON availability_holds(expires_at);

-- Auto-update search vector on insert/update
CREATE OR REPLACE FUNCTION update_property_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector('english', COALESCE(NEW.name, '')) ||
    to_tsvector('english', COALESCE(NEW.city, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_property_search
BEFORE INSERT OR UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION update_property_search_vector();
```

---

## 1.4 Migrations & Seeding (Prisma)

```bash
cd server
npm install prisma @prisma/client
npx prisma init
```

**`prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email         String     @unique
  passwordHash  String     @map("password_hash")
  role          String     @default("CUSTOMER")
  emailVerified Boolean    @default(false) @map("email_verified")
  createdAt     DateTime   @default(now()) @map("created_at")
  updatedAt     DateTime   @updatedAt @map("updated_at")
  bookings      Booking[]
  properties    Property[]

  @@map("users")
}

model Booking {
  id                 String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId             String   @map("user_id") @db.Uuid
  propertyId         String   @map("property_id") @db.Uuid
  checkin            DateTime @db.Date
  checkout           DateTime @db.Date
  totalPrice         Decimal  @map("total_price") @db.Decimal(10, 2)
  status             String   @default("CONFIRMED")
  confirmationNumber String   @unique @map("confirmation_number")
  guestName          String   @map("guest_name")
  guestEmail         String   @map("guest_email")
  createdAt          DateTime @default(now()) @map("created_at")
  user               User     @relation(fields: [userId], references: [id])

  @@map("bookings")
}
```

```bash
# Create and apply first migration
npx prisma migrate dev --name init

# Regenerate client after schema changes
npx prisma generate

# Seed the database
npx prisma db seed
```

> **Rule (general-rules):** Run `npm run migrate` before committing any DB schema change.
> Never run `migrate:undo:all` without explicit user approval.

---

## 1.5 Seed File

```typescript
// server/prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  const adminHash = await bcrypt.hash('Admin@123', 12)

  await prisma.user.upsert({
    where:  { email: 'admin@app.com' },
    update: {},
    create: {
      email:         'admin@app.com',
      passwordHash:  adminHash,
      role:          'ADMIN',
      emailVerified: true,
    },
  })

  const partnerHash = await bcrypt.hash('Partner@123', 12)

  await prisma.user.upsert({
    where:  { email: 'partner@app.com' },
    update: {},
    create: {
      email:         'partner@app.com',
      passwordHash:  partnerHash,
      role:          'PARTNER',
      emailVerified: true,
    },
  })

  console.log('✅ Seed complete')
}

main()
  .catch((error: Error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
```

```json
// server/package.json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

---

---

# PLATFORM 2: BACKEND (Node.js + Express)

---

## 2.1 Project Setup

```bash
cd server
npm init -y
npm install express cors helmet morgan dotenv bcrypt jsonwebtoken zod express-rate-limit winston uuid
npm install @prisma/client
npm install -D typescript ts-node @types/express @types/node @types/bcrypt @types/jsonwebtoken nodemon
npx tsc --init
```

---

## 2.2 Folder Structure

```
server/
├── src/
│   ├── config/
│   │   ├── env.ts                    ← typed + validated env (fail-fast)
│   │   ├── prisma.ts                 ← Prisma singleton
│   │   └── logger.ts                 ← Winston logger
│   ├── middleware/
│   │   ├── auth.middleware.ts        ← JWT verification
│   │   ├── validate.middleware.ts    ← Zod request validation
│   │   ├── rate-limit.middleware.ts
│   │   └── error-handler.middleware.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.service.ts
│   │   ├── properties/
│   │   │   ├── properties.routes.ts
│   │   │   ├── properties.controller.ts
│   │   │   └── properties.service.ts
│   │   ├── bookings/
│   │   │   ├── bookings.routes.ts
│   │   │   ├── bookings.controller.ts
│   │   │   └── bookings.service.ts
│   │   └── search/
│   │       ├── search.routes.ts
│   │       └── search.service.ts
│   ├── utils/
│   │   ├── jwt.util.ts
│   │   ├── payment.util.ts           ← simulatePayment()
│   │   └── email.util.ts
│   └── index.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── .env                              ← local only, NEVER commit
├── .env.example                      ← ALWAYS commit with dummy values
├── tsconfig.json
└── package.json
```

> **Convention (general-rules):**
> - Files → `kebab-case`
> - Classes/Components → `PascalCase`
> - Imports → absolute paths (configure in `tsconfig.json` with `paths`)

---

## 2.3 Environment Configuration

### `.env.example` (always commit this)

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=
DB_NAME_DEVELOPMENT=appdb_dev
DB_NAME_TEST=appdb_test
DB_NAME_PRODUCTION=appdb_prod
DB_DIALECT=postgres
DB_POOL_MAX=5
DB_POOL_MIN=0
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000

# Derived full URL (used by Prisma)
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME_DEVELOPMENT}

# JWT
JWT_SECRET=
JWT_EXPIRATION=3600

# AWS (Phase 2)
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_SQS_QUEUE_URL=

# Application
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:3000

# Payment simulation
SIMULATE_PAYMENT_FAILURE=false
```

### `src/config/env.ts` — validated, fail-fast

> **Rule (general-rules):** Validate all required env vars on startup. Fail fast if any are missing.
> Use different values per environment (dev/test/prod).

```typescript
// src/config/env.ts
import { z } from 'zod'
import dotenv from 'dotenv'
dotenv.config()

const envSchema = z.object({
  DATABASE_URL:             z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET:               z.string().min(20, 'JWT_SECRET must be at least 20 chars'),
  JWT_EXPIRATION:           z.coerce.number().default(3600),
  PORT:                     z.coerce.number().default(3001),
  NODE_ENV:                 z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL:               z.string().url('CLIENT_URL must be a valid URL'),
  SIMULATE_PAYMENT_FAILURE: z.coerce.boolean().default(false),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
  process.exit(1)   // Fail fast — never start with broken config
}

export const env = parsed.data
```

---

## 2.4 Winston Logger

> **Rule (general-rules):** Winston logging for all operations.

```typescript
// src/config/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
})
```

---

## 2.5 Express Entry Point

```typescript
// src/index.ts
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env'
import { logger } from './config/logger'
import { errorHandler } from './middleware/error-handler.middleware'
import authRoutes       from './modules/auth/auth.routes'
import propertiesRoutes from './modules/properties/properties.routes'
import bookingsRoutes   from './modules/bookings/bookings.routes'
import searchRoutes     from './modules/search/search.routes'

const app = express()

// ── Security & parsing ──────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin:          env.CLIENT_URL,
  credentials:     true,
  methods:         ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders:  ['Content-Type', 'Authorization'],
}))
app.use(morgan('dev'))
app.use(express.json())

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes)
app.use('/api/search',     searchRoutes)
app.use('/api/properties', propertiesRoutes)
app.use('/api/bookings',   bookingsRoutes)

// ── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', env: env.NODE_ENV }))

// ── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler)

app.listen(env.PORT, () => {
  logger.info(`🚀 API running on http://localhost:${env.PORT}`)
})

export default app
```

---

## 2.6 Prisma Singleton

```typescript
// src/config/prisma.ts
import { PrismaClient } from '@prisma/client'
import { logger } from './logger'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
    ],
  })

prisma.$on('error', (e) => logger.error('Prisma error', { message: e.message }))

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

---

## 2.7 Middleware

### Auth Middleware

```typescript
// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { logger } from '../config/logger'

export interface AuthRequest extends Request {
  user?: { id: string; role: string; email: string }
}

/**
 * Verifies JWT from Authorization: Bearer <token> header.
 * Attaches decoded payload to req.user.
 */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No token provided' } })
    return
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { id: string; role: string; email: string }
    req.user = payload
    next()
  } catch (err) {
    logger.warn('Invalid JWT', { error: err })
    res.status(401).json({ error: { code: 'TOKEN_INVALID', message: 'Invalid or expired token' } })
  }
}

export const requireRole = (role: string) => (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== role) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } })
    return
  }
  next()
}
```

### Validation Middleware

> **Rule (general-rules):** Input validation with schemas on every protected operation — Zod on server.

```typescript
// src/middleware/validate.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

/**
 * Validates req.body against a Zod schema.
 * Returns 400 with structured field errors on failure.
 */
export const validate = (schema: ZodSchema) => (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const result = schema.safeParse(req.body)

  if (!result.success) {
    res.status(400).json({
      error: {
        code:    'VALIDATION_ERROR',
        message: 'Invalid input',
        details: result.error.flatten().fieldErrors,
      },
    })
    return
  }

  req.body = result.data
  next()
}
```

### Rate Limiting

> **Rule (general-rules):** Rate limiting for sensitive operations.

```typescript
// src/middleware/rate-limit.middleware.ts
import rateLimit from 'express-rate-limit'

export const authRateLimiter = rateLimit({
  windowMs:        60 * 1000,   // 1 minute
  max:             10,
  standardHeaders: true,
  message: {
    error: {
      code:    'RATE_LIMITED',
      message: 'Too many attempts. Please try again in 1 minute.',
    },
  },
})
```

### Global Error Handler

```typescript
// src/middleware/error-handler.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { logger } from '../config/logger'

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code:       string,
    message:                    string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const errorHandler = (
  err:  Error,
  _req: Request,
  res:  Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message } })
    return
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack })
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } })
}
```

---

## 2.8 Auth Module

> **Rule (general-rules):** Defensive programming — validate → normalize → check business rules → execute → catch.

```typescript
// src/modules/auth/auth.service.ts
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../../config/prisma'
import { env } from '../../config/env'
import { logger } from '../../config/logger'
import { AppError } from '../../middleware/error-handler.middleware'

interface TokenPayload { id: string; role: string; email: string }
interface AuthResult   { accessToken: string; user: TokenPayload }

export const authService = {

  /**
   * Registers a new user and sends an OTP for email verification.
   * Fails fast if email already exists.
   */
  async register(email: string, password: string, role = 'CUSTOMER'): Promise<{ userId: string }> {
    try {
      // 1. Check business rules
      const exists = await prisma.user.findUnique({ where: { email } })
      if (exists) throw new AppError(409, 'EMAIL_IN_USE', 'Email already registered')

      // 2. Normalize + hash
      const passwordHash = await bcrypt.hash(password, 12)

      // 3. Execute
      const user = await prisma.user.create({ data: { email, passwordHash, role } })

      // 4. Create OTP (6-digit, 10 min TTL)
      const code     = Math.floor(100000 + Math.random() * 900000).toString()
      const codeHash = await bcrypt.hash(code, 10)

      await prisma.otpToken.create({
        data: {
          userId:    user.id,
          codeHash,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      })

      logger.info(`[DEV] OTP for ${email}: ${code}`)  // replace with email service in prod
      return { userId: user.id }

    } catch (error) {
      logger.error('Register failed', { error })
      if (error instanceof AppError) throw error
      throw new AppError(500, 'REGISTER_FAILED', 'Registration failed')
    }
  },

  /**
   * Verifies the OTP code and activates the user account.
   */
  async verifyOtp(userId: string, code: string): Promise<AuthResult> {
    try {
      const token = await prisma.otpToken.findFirst({
        where:   { userId, used: false, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
      })

      if (!token) throw new AppError(400, 'OTP_INVALID', 'OTP is invalid or expired')

      const valid = await bcrypt.compare(code, token.codeHash)
      if (!valid) throw new AppError(400, 'OTP_WRONG', 'Incorrect OTP code')

      await prisma.$transaction([
        prisma.user.update({ where: { id: userId }, data: { emailVerified: true } }),
        prisma.otpToken.update({ where: { id: token.id }, data: { used: true } }),
      ])

      const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
      return this.generateTokens({ id: user.id, role: user.role, email: user.email })

    } catch (error) {
      logger.error('OTP verification failed', { error })
      if (error instanceof AppError) throw error
      throw new AppError(500, 'OTP_FAILED', 'OTP verification failed')
    }
  },

  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')

      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')

      if (!user.emailVerified) {
        throw new AppError(403, 'EMAIL_NOT_VERIFIED', 'Please verify your email first')
      }

      return this.generateTokens({ id: user.id, role: user.role, email: user.email })

    } catch (error) {
      logger.error('Login failed', { error })
      if (error instanceof AppError) throw error
      throw new AppError(500, 'LOGIN_FAILED', 'Login failed')
    }
  },

  generateTokens(payload: TokenPayload): AuthResult {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRATION })
    return { accessToken, user: payload }
  },
}
```

```typescript
// src/modules/auth/auth.controller.ts
import { Request, Response, NextFunction } from 'express'
import { authService } from './auth.service'

export const authController = {
  register: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.register(req.body.email, req.body.password, req.body.role)
      res.status(201).json(result)
    } catch (err) { next(err) }
  },

  verifyOtp: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.verifyOtp(req.body.userId, req.body.code)
      res.json(result)
    } catch (err) { next(err) }
  },

  login: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.login(req.body.email, req.body.password)
      res.json(result)
    } catch (err) { next(err) }
  },
}
```

```typescript
// src/modules/auth/auth.routes.ts
import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware/validate.middleware'
import { authRateLimiter } from '../../middleware/rate-limit.middleware'
import { authController } from './auth.controller'

const router = Router()

const registerSchema = z.object({
  email:    z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one digit'),
  role: z.enum(['CUSTOMER', 'PARTNER']).optional(),
})

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

const otpSchema = z.object({
  userId: z.string().uuid(),
  code:   z.string().length(6),
})

router.post('/register',   authRateLimiter, validate(registerSchema), authController.register)
router.post('/verify-otp', authRateLimiter, validate(otpSchema),      authController.verifyOtp)
router.post('/login',      authRateLimiter, validate(loginSchema),     authController.login)

export default router
```

---

## 2.9 Dummy Payment Utility

```typescript
// src/utils/payment.util.ts
import crypto from 'crypto'
import { env } from '../config/env'
import { logger } from '../config/logger'

interface PaymentInput {
  cardholderName:   string
  cardNumberLast4:  string
  simulateFailure?: boolean
}

interface PaymentResult {
  success:        boolean
  transactionId:  string
  failureReason?: string
}

/**
 * Simulates a payment — no external service called.
 * Phase 2: replace this function body with:
 *   const intent = await stripe.paymentIntents.create({ amount, currency: 'inr' })
 *   const result = await stripe.paymentIntents.confirm(intent.id, { payment_method: pmId })
 *   return { success: result.status === 'succeeded', transactionId: result.id }
 */
export function simulatePayment(input: PaymentInput): PaymentResult {
  logger.info('simulatePayment called', {
    cardholderName:  input.cardholderName,
    cardNumberLast4: input.cardNumberLast4,
    // ⚠ Never log full card number, CVV, or expiry date
  })

  if (env.SIMULATE_PAYMENT_FAILURE || input.simulateFailure) {
    return {
      success:       false,
      transactionId: `FAIL-${crypto.randomUUID()}`,
      failureReason: 'Payment declined. Please check your card details.',
    }
  }

  return {
    success:       true,
    transactionId: `TXN-${crypto.randomUUID()}`,
  }
}
```

---

## 2.10 Bookings Service (Atomic Transaction)

> **Rule (general-rules):** Transaction management for multi-step DB operations — always wrap in `$transaction`.

```typescript
// src/modules/bookings/bookings.service.ts
import { prisma } from '../../config/prisma'
import { simulatePayment } from '../../utils/payment.util'
import { AppError } from '../../middleware/error-handler.middleware'
import { logger } from '../../config/logger'

interface GuestDetails {
  name:             string
  email:            string
  phone?:           string
  specialRequests?: string
}

interface PaymentDetails {
  cardholderName:   string
  cardNumberLast4:  string
  simulateFailure?: boolean
}

interface CreateBookingInput {
  holdId:         string
  guestDetails:   GuestDetails
  paymentDetails: PaymentDetails
}

interface BookingResult {
  bookingId:          string
  confirmationNumber: string
  pin:                string
  totalPrice:         number
}

export const bookingsService = {

  /**
   * Creates a confirmed booking atomically.
   * Steps: validate hold → re-check availability → simulate payment → DB transaction.
   *
   * @throws AppError(409) if hold expired or room unavailable
   * @throws AppError(402) if payment simulation fails
   */
  async createBooking(userId: string, body: CreateBookingInput): Promise<BookingResult> {
    try {
      // 1. Validate hold
      const hold = await prisma.availabilityHold.findUnique({ where: { id: body.holdId } })
      if (!hold || hold.userId !== userId) {
        throw new AppError(404, 'HOLD_NOT_FOUND', 'Booking session not found')
      }
      if (hold.expiresAt < new Date()) {
        throw new AppError(409, 'HOLD_EXPIRED', 'Your reservation timed out. Please start again.')
      }

      // 2. Re-check availability (race condition guard)
      const conflict = await prisma.availability.findFirst({
        where: {
          roomTypeId: hold.roomTypeId,
          isBlocked:  true,
          bookingId:  { not: null },
          date:       { gte: hold.checkin, lt: hold.checkout },
        },
      })
      if (conflict) {
        throw new AppError(409, 'ROOM_UNAVAILABLE', 'This room is no longer available for those dates.')
      }

      // 3. Calculate price
      const room   = await prisma.roomType.findUniqueOrThrow({ where: { id: hold.roomTypeId } })
      const nights = Math.ceil(
        (hold.checkout.getTime() - hold.checkin.getTime()) / (1000 * 60 * 60 * 24)
      )
      const base  = Number(room.basePrice) * nights
      const tax   = base * 0.1475
      const total = +(base + tax).toFixed(2)

      // 4. Simulate payment
      const payment = simulatePayment(body.paymentDetails)

      if (!payment.success) {
        await prisma.availabilityHold.delete({ where: { id: body.holdId } })
        throw new AppError(402, 'PAYMENT_DECLINED', payment.failureReason ?? 'Payment failed')
      }

      // 5. Atomic DB transaction
      const confirmationNumber = `BK-${Date.now()}`
      const pin = Math.floor(1000 + Math.random() * 9000).toString()

      const booking = await prisma.$transaction(async (tx) => {
        const newBooking = await tx.booking.create({
          data: {
            userId,
            propertyId:         room.propertyId,
            roomTypeId:         hold.roomTypeId,
            checkin:            hold.checkin,
            checkout:           hold.checkout,
            totalPrice:         total,
            confirmationNumber,
            pin,
            paymentTxId:        payment.transactionId,
            guestName:          body.guestDetails.name,
            guestEmail:         body.guestDetails.email,
            guestPhone:         body.guestDetails.phone,
            specialRequests:    body.guestDetails.specialRequests,
          },
        })

        await tx.availability.updateMany({
          where: { roomTypeId: hold.roomTypeId, date: { gte: hold.checkin, lt: hold.checkout } },
          data:  { isBlocked: true, bookingId: newBooking.id },
        })

        await tx.availabilityHold.delete({ where: { id: body.holdId } })

        return newBooking
      })

      logger.info('Booking created', { bookingId: booking.id, userId, confirmationNumber })
      return { bookingId: booking.id, confirmationNumber, pin, totalPrice: total }

    } catch (error) {
      logger.error('createBooking failed', { error })
      if (error instanceof AppError) throw error
      throw new AppError(500, 'BOOKING_FAILED', 'Failed to create booking')
    }
  },

  async getUserBookings(userId: string, status?: string): Promise<unknown[]> {
    return prisma.booking.findMany({
      where:   { userId, ...(status ? { status } : {}) },
      include: {
        property: { select: { name: true, city: true } },
        roomType: { select: { name: true } },
      },
      orderBy: { checkin: 'desc' },
    })
  },

  async cancelBooking(bookingId: string, userId: string, reason: string): Promise<{ message: string }> {
    try {
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
      if (!booking || booking.userId !== userId) {
        throw new AppError(404, 'NOT_FOUND', 'Booking not found')
      }
      if (booking.status !== 'CONFIRMED') {
        throw new AppError(409, 'NOT_CANCELLABLE', 'This booking cannot be cancelled')
      }

      await prisma.$transaction([
        prisma.booking.update({
          where: { id: bookingId },
          data:  { status: 'CANCELLED', cancellationReason: reason, cancelledAt: new Date() },
        }),
        prisma.availability.updateMany({
          where: { bookingId },
          data:  { isBlocked: false, bookingId: null },
        }),
      ])

      logger.info('Booking cancelled', { bookingId, userId })
      return { message: 'Booking cancelled successfully' }

    } catch (error) {
      logger.error('cancelBooking failed', { error })
      if (error instanceof AppError) throw error
      throw new AppError(500, 'CANCEL_FAILED', 'Failed to cancel booking')
    }
  },
}
```

---

## 2.11 NPM Scripts

```json
// server/package.json
"scripts": {
  "start:dev":   "nodemon --exec ts-node src/index.ts",
  "build":       "tsc",
  "start":       "node dist/index.js",
  "lint":        "eslint src --ext .ts",
  "lint:fix":    "eslint src --ext .ts --fix",
  "test":        "vitest run",
  "test:cov":    "vitest run --coverage",
  "migrate":     "prisma migrate dev",
  "db:seed:all": "prisma db seed"
}
```

---

---

# PLATFORM 3: FRONTEND (React 18 + Vite)

---

## 3.1 Project Setup

```bash
cd client
npm create vite@latest . -- --template react-ts
npm install
npm install @tanstack/react-query axios react-router-dom zustand
npm install react-hook-form zod @hookform/resolvers
npm install -D @types/node vitest @testing-library/react @testing-library/jest-dom jsdom
```

---

## 3.2 Folder Structure

```
client/src/
├── api/
│   ├── client.ts             ← Axios instance + interceptors
│   ├── auth.api.ts
│   ├── properties.api.ts
│   └── bookings.api.ts
├── components/
│   ├── ui/                   ← Button, Input, Badge, Spinner (PascalCase class names)
│   └── layout/               ← Header, Footer, PageWrapper
├── features/
│   ├── auth/
│   │   ├── login-page.tsx    ← kebab-case filenames
│   │   ├── register-page.tsx
│   │   └── otp-page.tsx
│   ├── search/
│   │   ├── search-page.tsx
│   │   └── property-card.tsx
│   ├── property/
│   │   └── property-detail-page.tsx
│   ├── checkout/
│   │   ├── guest-details-page.tsx
│   │   └── payment-page.tsx
│   └── trips/
│       └── trips-page.tsx
├── hooks/
│   └── use-booking-store.ts
├── store/
│   └── auth.store.ts
├── router/
│   └── index.tsx
├── types/
│   └── index.ts
├── utils/
│   ├── format.ts
│   └── error.ts             ← getApiError() — used everywhere
├── App.tsx
└── main.tsx
```

> **Convention (general-rules):**
> - Component class names → PascalCase
> - All filenames → kebab-case
> - Imports → absolute paths (configure `vite.config.ts` `resolve.alias`)

---

## 3.3 Environment Variables

```bash
# client/.env  (local only, never commit)
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
VITE_ENV=development

# client/.env.example  (always commit)
VITE_API_URL=
VITE_WS_URL=
VITE_ENV=development
```

---

## 3.4 Axios Client with Interceptors

```typescript
// client/src/api/client.ts
import axios from 'axios'
import { useAuthStore } from '../store/auth.store'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
})

// Attach JWT to every outgoing request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global 401 handler — clear auth state and redirect
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

---

## 3.5 Zustand Auth Store

```typescript
// client/src/store/auth.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User { id: string; email: string; role: string }

interface AuthState {
  user:            User | null
  accessToken:     string | null
  login:           (user: User, token: string) => void
  logout:          () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      accessToken:     null,
      login:           (user, accessToken) => set({ user, accessToken }),
      logout:          () => set({ user: null, accessToken: null }),
      isAuthenticated: () => !!get().accessToken,
    }),
    { name: 'auth-storage' }
  )
)
```

---

## 3.6 Error Utility

> **Rule (general-rules):** Comprehensive error handling — consistent shape across the entire app.

```typescript
// client/src/utils/error.ts
import axios from 'axios'

/**
 * Extracts a human-readable error message from any API error.
 * Maps to the server's { error: { code, message } } shape.
 */
export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error?.message ??
      error.message ??
      'Something went wrong'
    )
  }
  if (error instanceof Error) return error.message
  return 'Network error. Please try again.'
}

export function getApiErrorCode(error: unknown): string | null {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.code ?? null
  }
  return null
}
```

---

## 3.7 API Layer

```typescript
// client/src/api/auth.api.ts
import { apiClient } from './client'

export const authApi = {
  register: (data: { email: string; password: string; role?: string }) =>
    apiClient.post('/auth/register', data).then(r => r.data),

  verifyOtp: (userId: string, code: string) =>
    apiClient.post('/auth/verify-otp', { userId, code }).then(r => r.data),

  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }).then(r => r.data),
}
```

```typescript
// client/src/api/properties.api.ts
import { apiClient } from './client'

export const propertiesApi = {
  search: (params: Record<string, string | number>) =>
    apiClient.get('/search', { params }).then(r => r.data),

  getById: (id: string, params?: Record<string, string>) =>
    apiClient.get(`/properties/${id}`, { params }).then(r => r.data),
}
```

```typescript
// client/src/api/bookings.api.ts
import { apiClient } from './client'

export const bookingsApi = {
  createHold: (roomTypeId: string, checkin: string, checkout: string) =>
    apiClient.post('/bookings/hold', { roomTypeId, checkin, checkout }).then(r => r.data),

  createBooking: (data: object) =>
    apiClient.post('/bookings', data).then(r => r.data),

  getMyBookings: (status?: string) =>
    apiClient.get('/bookings', { params: { status } }).then(r => r.data),

  cancel: (bookingId: string, reason: string) =>
    apiClient.post(`/bookings/${bookingId}/cancel`, { reason }).then(r => r.data),
}
```

---

## 3.8 React Router

```typescript
// client/src/router/index.tsx
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuthStore } from '../store/auth.store'

const LoginPage      = lazy(() => import('../features/auth/login-page'))
const RegisterPage   = lazy(() => import('../features/auth/register-page'))
const SearchPage     = lazy(() => import('../features/search/search-page'))
const PropertyDetail = lazy(() => import('../features/property/property-detail-page'))
const GuestDetails   = lazy(() => import('../features/checkout/guest-details-page'))
const PaymentPage    = lazy(() => import('../features/checkout/payment-page'))
const TripsPage      = lazy(() => import('../features/trips/trips-page'))

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated())
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

const router = createBrowserRouter([
  { path: '/',              element: <SearchPage /> },
  { path: '/login',         element: <LoginPage /> },
  { path: '/register',      element: <RegisterPage /> },
  { path: '/property/:id',  element: <PropertyDetail /> },
  { path: '/checkout/details', element: <ProtectedRoute><GuestDetails /></ProtectedRoute> },
  { path: '/checkout/payment', element: <ProtectedRoute><PaymentPage /></ProtectedRoute> },
  { path: '/trips',         element: <ProtectedRoute><TripsPage /></ProtectedRoute> },
])

export const AppRouter = () => (
  <Suspense fallback={<div>Loading…</div>}>
    <RouterProvider router={router} />
  </Suspense>
)
```

---

## 3.9 React Query Setup

```typescript
// client/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRouter } from './router'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            1000 * 60 * 5,   // 5 min cache
      retry:                1,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  </React.StrictMode>
)
```

---

## 3.10 Login Page

> **Rule (general-rules):** Input validation with Zod on client before any API call.

```typescript
// client/src/features/auth/login-page.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../store/auth.store'
import { getApiError } from '../../utils/error'

const schema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const login    = useAuthStore(s => s.login)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => authApi.login(data.email, data.password),
    onSuccess:  (data) => {
      login(data.user, data.accessToken)
      navigate('/')
    },
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit(d => mutation.mutate(d))}
        className="bg-white p-8 rounded-xl shadow w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold text-blue-900">Sign in</h1>

        <div>
          <input
            {...register('email')}
            type="email"
            placeholder="Email"
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <input
            {...register('password')}
            type="password"
            placeholder="Password"
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
        </div>

        {mutation.isError && (
          <p className="text-red-500 text-sm">{getApiError(mutation.error)}</p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
        >
          {mutation.isPending ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
        </p>
      </form>
    </div>
  )
}
```

---

## 3.11 Payment Page (Dummy)

```typescript
// client/src/features/checkout/payment-page.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { bookingsApi } from '../../api/bookings.api'
import { getApiError } from '../../utils/error'

const schema = z.object({
  cardholderName:  z.string().min(2, 'Name required'),
  cardNumber:      z.string().regex(/^\d{16}$/, 'Enter 16 digits'),
  expiry:          z.string().regex(/^\d{2}\/\d{2}$/, 'Format: MM/YY'),
  cvc:             z.string().regex(/^\d{3}$/, '3-digit CVC required'),
  simulateFailure: z.boolean().optional(),
})
type FormData = z.infer<typeof schema>

export default function PaymentPage() {
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver:      zodResolver(schema),
    defaultValues: { simulateFailure: false },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => bookingsApi.createBooking({
      holdId:       'HOLD_ID_FROM_ZUSTAND_STORE',  // replace with store value
      guestDetails: { /* from Zustand checkout store */ },
      paymentDetails: {
        cardholderName:  data.cardholderName,
        cardNumberLast4: data.cardNumber.slice(-4),  // never send full number
        simulateFailure: data.simulateFailure,
      },
    }),
    onSuccess: (data) => navigate(`/booking/confirmation/${data.bookingId}`),
  })

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Complete your booking</h1>

      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">

        <input {...register('cardholderName')} placeholder="Name on card"
          className="w-full border rounded-lg px-4 py-3" />
        {errors.cardholderName && <p className="text-red-500 text-sm">{errors.cardholderName.message}</p>}

        <input {...register('cardNumber')} placeholder="Card number (16 digits)" maxLength={16}
          className="w-full border rounded-lg px-4 py-3" />
        {errors.cardNumber && <p className="text-red-500 text-sm">{errors.cardNumber.message}</p>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <input {...register('expiry')} placeholder="MM/YY"
              className="w-full border rounded-lg px-4 py-3" />
            {errors.expiry && <p className="text-red-500 text-sm">{errors.expiry.message}</p>}
          </div>
          <div>
            <input {...register('cvc')} placeholder="CVC" maxLength={3}
              className="w-full border rounded-lg px-4 py-3" />
            {errors.cvc && <p className="text-red-500 text-sm">{errors.cvc.message}</p>}
          </div>
        </div>

        {/* DEV-only failure simulation — hidden in production builds */}
        {import.meta.env.DEV && (
          <label className="flex items-center gap-2 text-sm text-orange-600 border border-orange-200 rounded p-2">
            <input type="checkbox" {...register('simulateFailure')} />
            [DEV] Simulate payment failure
          </label>
        )}

        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {getApiError(mutation.error)}
          </div>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl disabled:opacity-50"
        >
          {mutation.isPending ? 'Processing…' : '🔒 Complete Booking'}
        </button>
      </form>
    </div>
  )
}
```

---

## 3.12 Loading & Error State Pattern

```typescript
// Standard pattern — apply consistently across all data-fetching components
const { data, isLoading, isError, error } = useQuery({
  queryKey: ['properties', id],
  queryFn:  () => propertiesApi.getById(id),
})

if (isLoading) return <Spinner />
if (isError)   return <ErrorBanner message={getApiError(error)} />
return <PropertyDetail data={data} />
```

---

## 3.13 NPM Scripts

```json
// client/package.json
"scripts": {
  "dev":   "vite",
  "build": "tsc && vite build",
  "lint":  "eslint src --ext .ts,.tsx",
  "test":  "vitest run"
}
```

---

---

# PLATFORM 4: INTEGRATION & DEPLOYMENT

---

## 4.1 Development Commands (from general-rules)

```bash
# ── Client ────────────────────────────────────────────────
cd client
npm run dev       # Start dev server     → http://localhost:5173
npm run build     # Production build     → dist/
npm run lint      # Run linting
npm test          # Run tests

# ── Server ────────────────────────────────────────────────
cd server
npm run start:dev # Start with watch mode → http://localhost:3001
npm run build     # Production build      → dist/
npm run lint      # Run linting
npm run lint:fix  # Auto-fix lint issues
npm run test      # Run unit tests
npm run test:cov  # Test with coverage
npm run migrate   # Run database migrations
npm run db:seed:all # Seed database
```

---

## 4.2 Pre-Commit Checklist (from general-rules)

```
Before every commit — execute in this exact order:
  1.  cd client  && npm run lint
  2.  cd server  && npm run lint:fix
  3.  npm test (in whichever workspace was changed)
  4.  npm run migrate  (only if DB schema changed)
  5.  npm run build    (both client and server — catch TS errors)

THEN (and only then):
  → Suggest the git command(s)
  → Explain what each will do
  → Wait for explicit user approval
  → Execute only after approval
```

---

## 4.3 Run Everything Locally

```bash
# Terminal 1 — Database
docker-compose up -d

# Terminal 2 — Server
cd server && npm run start:dev

# Terminal 3 — Client
cd client && npm run dev

# One-time setup (after clone):
cd server
npm run migrate      # creates all tables
npm run db:seed:all  # seeds admin + partner test users
```

---

## 4.4 Testing

### Backend — Vitest + Supertest

```bash
cd server
npm install -D vitest supertest @types/supertest
```

```typescript
// server/src/modules/auth/__tests__/auth.test.ts
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../../index'

describe('POST /api/auth/register', () => {

  it('returns 201 with userId on valid input', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: `test+${Date.now()}@example.com`, password: 'Test@1234' })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('userId')
  })

  it('returns 409 on duplicate email', async () => {
    const email = `dupe+${Date.now()}@example.com`
    await request(app).post('/api/auth/register').send({ email, password: 'Test@1234' })
    const res = await request(app).post('/api/auth/register').send({ email, password: 'Test@1234' })

    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('EMAIL_IN_USE')
  })

  it('returns 400 on invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'Test@1234' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

})
```

### Frontend — Vitest + React Testing Library

```typescript
// client/src/features/auth/__tests__/login-page.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../login-page'

vi.mock('../../api/auth.api', () => ({
  authApi: {
    login: vi.fn().mockResolvedValue({
      user:        { id: '1', email: 'a@b.com', role: 'CUSTOMER' },
      accessToken: 'mock-token',
    }),
  },
}))

const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>)

describe('LoginPage', () => {
  it('renders email and password inputs', () => {
    renderWithRouter(<LoginPage />)
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
  })

  it('shows inline error for invalid email format', async () => {
    renderWithRouter(<LoginPage />)
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'notanemail' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(screen.getByText('Invalid email address')).toBeInTheDocument())
  })
})
```

---

## 4.5 Deployment

**Backend → Railway or Render**

```bash
# Procfile
web: npx prisma migrate deploy && node dist/index.js
```

**Frontend → Vercel**

```bash
cd client && npm run build
# Connect GitHub repo to Vercel → auto-deploys on push
# Add env var in Vercel dashboard: VITE_API_URL=https://your-api.railway.app/api
```

**Database → Supabase or Neon (managed PostgreSQL)**
- Create project → copy `DATABASE_URL` → paste into server environment variables

---

---

# PLATFORM 5: BEST PRACTICES (from general-rules)

---

## 5.1 Security Checklist

| Area | Rule |
|---|---|
| Passwords | bcrypt rounds=12; never log or store plaintext |
| JWT | Short-lived access (`JWT_EXPIRATION=3600`); never expose in localStorage |
| Input validation | Zod on every API route **before** any DB call |
| SQL injection | Prisma ORM — parameterized queries enforced by default |
| Sensitive data | Never log card numbers, CVV, passwords, or raw tokens |
| CORS | Explicit `CLIENT_URL` origin; never `origin: '*'` in production |
| Env vars | `.env` in `.gitignore`; `.env.example` always committed with dummy values |
| Rate limiting | `authRateLimiter` on all auth routes (max 10/min) |
| Security headers | `helmet()` always enabled |
| HTTPS | TLS termination required in prod; HTTP → HTTPS redirect enforced |
| HTML entities | Escape all user-generated content before rendering |
| File uploads | Validate MIME type + file size before accepting (Phase 2) |
| Authorization | Check ownership on every protected operation — never trust client-supplied IDs alone |

---

## 5.2 SOLID Principles Applied

```
Single Responsibility:
  auth.service.ts       → only auth logic
  auth.controller.ts    → only request/response handling
  auth.routes.ts        → only route + middleware definitions

Open/Closed:
  AppError class        → extend for specific error types, don't modify base
  simulatePayment()     → swap body for Stripe without touching callers

Liskov Substitution:
  Any AuthRequest       → substitutable for Express Request

Interface Segregation:
  GuestDetails          → separate from PaymentDetails (not one giant object)

Dependency Inversion:
  bookingsService       → depends on Prisma abstraction, not raw pg
  simulatePayment()     → depends on PaymentInput interface, not Stripe specifics
```

---

## 5.3 Clean Architecture

```
server/src/

  Domain Layer (pure logic, no framework deps)
  └── utils/payment.util.ts    → simulatePayment()

  Application Layer (use-case orchestration)
  └── modules/*/auth.service.ts
  └── modules/*/bookings.service.ts

  Infrastructure Layer (DB, email, storage)
  └── config/prisma.ts         → Prisma client
  └── utils/email.util.ts      → email transport

Dependency direction: always inward.
  Routes → Controllers → Services → Prisma
  Never reverse — a Service never imports a Controller.
```

---

## 5.4 Defensive Programming Template

```typescript
// Apply this structure in every service method (from general-rules)
async function doSomething(input: Input): Promise<Result> {
  try {
    // 1. Validate input (Zod schema at route level covers this)
    // 2. Normalize data (trim strings, lowercase emails)
    // 3. Check business rules (ownership, status, existence)
    // 4. Execute operation (Prisma, simulatePayment, etc.)
    return result
  } catch (error) {
    logger.error('doSomething failed', { error })
    if (error instanceof AppError) throw error
    throw new AppError(500, 'OPERATION_FAILED', 'Operation failed')
  }
}
```

---

## 5.5 Result Pattern (for multi-outcome flows)

```typescript
// From general-rules — use where exceptions would be too heavy
type Result<T, E = string> =
  | { success: true;  data:  T }
  | { success: false; error: E }

// Example
function simulatePayment(input: PaymentInput): Result<string> {
  if (shouldFail) return { success: false, error: 'Payment declined' }
  return { success: true, data: `TXN-${crypto.randomUUID()}` }
}
```

---

## 5.6 JSDoc — Public APIs and Complex Functions

```typescript
/**
 * Creates a confirmed booking atomically.
 * Validates hold → re-checks availability → simulates payment → commits transaction.
 *
 * @param userId - Authenticated customer's user ID (from JWT)
 * @param body   - Hold ID, guest details, and payment input
 * @returns      Booking ID, confirmation number, PIN, and total price charged
 * @throws       AppError(404) if hold not found or belongs to different user
 * @throws       AppError(409) if hold expired or room no longer available
 * @throws       AppError(402) if payment simulation returns failure
 * @throws       AppError(500) if DB transaction fails (auto-rolled back)
 */
async createBooking(userId: string, body: CreateBookingInput): Promise<BookingResult>
```

---

## 5.7 Scalability Upgrade Path

| Concern | MVP Approach | Scale-up Path |
|---|---|---|
| Caching | No cache | Redis (search results, sessions) |
| Background jobs | Inline (hold GC, emails) | Bull/BullMQ with `AWS_SQS_QUEUE_URL` |
| File storage | Cloudinary | AWS S3 + CloudFront (`AWS_S3_BUCKET` already in env) |
| DB connections | Prisma default (`DB_POOL_MAX=5`) | PgBouncer connection pooler |
| Logging | Winston console | Ship to Datadog / Grafana Loki |
| Payment | `simulatePayment()` | Stripe PaymentIntents (swap 1 function body) |
| Real-time | Not in MVP | Socket.IO with `VITE_WS_URL` already configured |
| Deployment | Single server | Docker → Kubernetes / ECS |
| i18n | English only | i18n library — `VITE_ENV` flag already in env |

---

*End of Guide — PostgreSQL 15 · Node.js · React 18 | Aligned with general-rules.md*
