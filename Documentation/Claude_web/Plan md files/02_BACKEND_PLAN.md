# ⚙️ BACKEND PLAN — Node.js + Express + TypeScript
> Booking.com Clone · Phase 1 MVP · Port 3001

---

## ✅ STEP 1 — Project Setup (Day 1)

```bash
cd server
npm init -y
npm install express cors helmet morgan dotenv bcrypt jsonwebtoken zod express-rate-limit winston uuid @prisma/client
npm install -D typescript ts-node @types/express @types/node @types/bcrypt @types/jsonwebtoken nodemon vitest supertest @types/supertest
npx tsc --init
```

### NPM Scripts to add
```json
"start:dev":   "nodemon --exec ts-node src/index.ts",
"build":       "tsc",
"start":       "node dist/index.js",
"lint":        "eslint src --ext .ts",
"lint:fix":    "eslint src --ext .ts --fix",
"test":        "vitest run",
"test:cov":    "vitest run --coverage",
"migrate":     "prisma migrate dev",
"db:seed:all": "prisma db seed"
```

---

## ✅ STEP 2 — Folder Structure

```
server/src/
├── config/
│   ├── env.ts              ← Zod-validated env (fail-fast on startup)
│   ├── prisma.ts           ← Prisma singleton
│   └── logger.ts           ← Winston logger
├── middleware/
│   ├── auth.middleware.ts       ← JWT verify + role guard
│   ├── validate.middleware.ts   ← Zod body validation
│   ├── rate-limit.middleware.ts ← 10 req/min on auth routes
│   └── error-handler.middleware.ts ← AppError class + global handler
├── modules/
│   ├── auth/               ← register, verify-otp, login
│   ├── properties/         ← CRUD for partner listings
│   ├── bookings/           ← hold, create, cancel, list
│   └── search/             ← full-text + filter search
├── utils/
│   ├── jwt.util.ts
│   ├── payment.util.ts     ← simulatePayment()
│   └── email.util.ts
└── index.ts                ← Express app entry point
```

> Convention: Files → `kebab-case`. Classes → `PascalCase`. Never import `client/` code here.

---

## ✅ STEP 3 — Modules to Build

### 3.1 Auth Module (`/api/auth`)
| Endpoint | Body | Response | Guard |
|----------|------|----------|-------|
| `POST /register` | email, password, role? | `{ userId }` | rate limiter |
| `POST /verify-otp` | userId, code | `{ accessToken, user }` | rate limiter |
| `POST /login` | email, password | `{ accessToken, user }` | rate limiter |

**Service logic:**
1. Register → hash password (bcrypt rounds=12) → create user → generate 6-digit OTP → hash OTP → store with 10-min TTL → log OTP in dev (send email in prod).
2. Verify OTP → find latest unused, non-expired token → bcrypt compare → atomic `$transaction` to mark verified + used → return JWT.
3. Login → find user → compare hash → check `emailVerified` → return JWT.

### 3.2 Search Module (`/api/search`)
| Endpoint | Query Params | Notes |
|----------|-------------|-------|
| `GET /search` | city, checkin, checkout, adults, category | Full-text via `search_vector @@ to_tsquery` |

Availability filter: exclude `room_type_id`s that have ANY `isBlocked=true` row in the requested date range.

### 3.3 Properties Module (`/api/properties`)
| Endpoint | Auth | Notes |
|----------|------|-------|
| `GET /properties/:id` | public | includes room types + availability |
| `POST /properties` | PARTNER | creates in DRAFT status |
| `PATCH /properties/:id` | PARTNER (owner only) | update listing details |
| `POST /properties/:id/publish` | PARTNER (owner only) | DRAFT → ACTIVE |

Always verify `property.owner_id === req.user.id` before any write operation.

### 3.4 Bookings Module (`/api/bookings`)
| Endpoint | Auth | Notes |
|----------|------|-------|
| `POST /bookings/hold` | CUSTOMER | creates `availability_hold` (TTL 15 min) |
| `POST /bookings` | CUSTOMER | atomic: validate hold → re-check → payment → commit |
| `GET /bookings` | CUSTOMER | list own bookings |
| `POST /bookings/:id/cancel` | CUSTOMER | CONFIRMED → CANCELLED, unblock dates |

---

## ✅ STEP 4 — Key Implementation Patterns

### Env Validation (fail-fast)
```ts
// src/config/env.ts
const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten())
  process.exit(1)          // crash immediately — never start with bad config
}
export const env = parsed.data
```

### Every Route Uses This Stack
```
Router → validate(zodSchema) → authenticate → requireRole('X') → Controller → Service → Prisma
```

### Defensive Service Template
```ts
async function doSomething(input: Input): Promise<Result> {
  try {
    // 1. Check business rules (ownership, status, existence)
    // 2. Normalize data (trim strings, lowercase emails)
    // 3. Execute operation
    return result
  } catch (error) {
    logger.error('doSomething failed', { error })
    if (error instanceof AppError) throw error
    throw new AppError(500, 'OPERATION_FAILED', 'Operation failed')
  }
}
```

### Atomic Booking Transaction
```ts
const booking = await prisma.$transaction(async (tx) => {
  const newBooking = await tx.booking.create({ data: { ... } })
  await tx.availability.updateMany({ where: { ... }, data: { isBlocked: true, bookingId: newBooking.id } })
  await tx.availabilityHold.delete({ where: { id: holdId } })
  return newBooking
})
// If ANY step throws → entire transaction rolls back automatically
```

---

## ✅ STEP 5 — Middleware Checklist

| Middleware | Where Applied |
|-----------|--------------|
| `helmet()` | Global — all routes |
| `cors({ origin: env.CLIENT_URL })` | Global — never `origin: '*'` in prod |
| `express.json()` | Global |
| `morgan('dev')` | Global (dev only) |
| `authRateLimiter` (10/min) | All `/api/auth/*` routes |
| `validate(zodSchema)` | Every POST/PATCH route before controller |
| `authenticate` | All protected routes |
| `requireRole('PARTNER')` | Partner-only routes |
| `errorHandler` | Last middleware — catches all AppErrors |

---

## ✅ STEP 6 — Winston Logger Setup

```ts
// src/config/logger.ts
import winston from 'winston'
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
})
```

**Rules:**
- NEVER log: card numbers, CVV, expiry, passwords, raw OTP codes, full JWTs.
- Always log: `userId`, `bookingId`, `confirmationNumber`, sanitized error messages.

---

## ✅ STEP 7 — simulatePayment() Utility

```ts
// src/utils/payment.util.ts
export function simulatePayment(input: PaymentInput): Result<string> {
  if (env.SIMULATE_PAYMENT_FAILURE || input.simulateFailure) {
    return { success: false, error: 'Payment declined' }
  }
  return { success: true, data: `TXN-${crypto.randomUUID()}` }
}
```

Phase 2 upgrade: replace this function body with Stripe `paymentIntents.create()` — no other code changes needed (Open/Closed principle).

---

## 🔴 ADVANCED TASKS (Do after MVP works)

### A. OTP via Email (Nodemailer)
```ts
// src/utils/email.util.ts
import nodemailer from 'nodemailer'
// Replace logger.info(`[DEV] OTP: ${code}`) with:
await transporter.sendMail({ to: email, subject: 'Your OTP', text: `Your code: ${code}` })
```

### B. Partner Onboarding Wizard (6-Step)
Build as 6 separate PATCH endpoints (or one endpoint with a `step` field):
`Step 1` → basic info → `Step 2` → address/location → `Step 3` → amenities → `Step 4` → room types → `Step 5` → availability → `Step 6` → review + publish.
Store progress in a `partner_onboarding_sessions` table or as a status field on the property.

### C. Availability Hold GC Job
```ts
// src/jobs/hold-gc.job.ts
import cron from 'node-cron'
cron.schedule('*/5 * * * *', async () => {
  await prisma.availabilityHold.deleteMany({ where: { expiresAt: { lt: new Date() } } })
})
```

### D. Property Image Upload (Phase 2)
- Accept multipart/form-data in `POST /properties/:id/images`
- Validate MIME type (`image/jpeg`, `image/png` only) + max 5MB
- Upload to Cloudinary (MVP) or AWS S3 + CloudFront (scale-up)
- Store URL in `properties.images JSONB`

### E. Admin Panel Routes
```
GET  /api/admin/users          ← list all users (ADMIN only)
PATCH /api/admin/users/:id/ban ← ban a user
GET  /api/admin/bookings       ← all bookings with filters
```

### F. WebSocket (Real-time, Phase 2)
Socket.IO on the same Express server. `VITE_WS_URL` env var is already scaffolded. Use for: live booking status, partner dashboard alerts.

---

## 🚫 CRITICAL RULES
- Zod validation on EVERY route before any DB call.
- Check ownership (`property.owner_id === req.user.id`) on every partner write.
- Rate limit all auth routes (10 req/min).
- JWT stored in memory on client — never in localStorage.
- Never run `git push`, `rm -rf`, or raw SQL `DELETE/DROP` without explicit user approval.
