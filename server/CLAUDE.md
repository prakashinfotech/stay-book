# Server — CLAUDE.md
> Express + TypeScript + Prisma · Booking.com Clone MVP · Port 3001

> **Serves Both**: Web (React at port 3000) and Mobile (Flutter) clients. All data shared via JWT auth.

---

## Quick Start

```bash
cd server
npm run dev          # nodemon + ts-node, auto-reloads on save
```

Requires PostgreSQL running on `localhost:5432` with database `booking_dev`.
All env vars are validated at startup via Zod — the process exits immediately if any required var is missing.

---

## Key Commands

```bash
npm run dev                  # start with nodemon (watch mode)
npm run build                # compile to dist/
npm run lint                 # eslint src/**/*.ts
npm run db:generate          # prisma generate (regenerate typed client)
npm run db:migrate           # prisma migrate dev (apply pending migrations)
npm run db:migrate:deploy    # prisma migrate deploy (production)
npm run db:studio            # prisma studio UI at localhost:5555
npm run db:seed              # seed admin + partner + customer test accounts
```

---

## Environment Variables (server/.env)

```
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:3000

DATABASE_URL=postgresql://postgres:1234@localhost:5432/booking_dev?schema=public

JWT_SECRET=<min 20 chars>
JWT_EXPIRATION=1h
JWT_REFRESH_SECRET=<min 20 chars>

SIMULATE_PAYMENT_FAILURE=false

# AWS — optional in dev, required in prod
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_SQS_QUEUE_URL=
```

---

## Folder Structure

```
server/src/
├── app.ts                        ← Express app factory (middleware + route mounts)
├── index.ts                      ← Bootstrap: DB connect → GC job → app.listen
├── config/
│   ├── env.ts                    ← Zod env validation, exports `config`
│   └── prisma.ts                 ← Prisma singleton, exports `prisma`
├── common/
│   ├── errors/
│   │   ├── app-error.ts          ← AppError base + typed subclasses
│   │   └── error-handler.ts      ← Global error handler middleware
│   ├── middleware/
│   │   ├── auth.middleware.ts    ← JWT verify, attaches req.user
│   │   ├── roles.middleware.ts   ← authorize(...roles) guard
│   │   ├── validate.middleware.ts← validate(zodSchema) + validateQuery(zodSchema)
│   │   └── morgan.middleware.ts  ← HTTP request logging
│   └── utils/
│       ├── logger.ts             ← Winston logger (console + file)
│       ├── hash.ts               ← bcrypt helpers
│       └── response.ts           ← ok() / created() response helpers
├── modules/
│   ├── auth/                     ← register, verify-otp, login, refresh, logout
│   ├── users/                    ← get profile, update profile
│   ├── properties/               ← CRUD partner listings + publish
│   ├── search/                   ← full-text + availability search, suggestions
│   └── bookings/                 ← hold, create booking, list, cancel
├── jobs/
│   └── hold-gc.job.ts            ← setInterval every 5 min, deletes expired holds
└── utils/
    ├── payment.util.ts           ← simulatePayment() — Phase 2: replace with Stripe
    └── email.util.ts             ← sendOtpEmail / sendBookingConfirmation (dev: logger.info)
```

---

## API Routes

All routes are prefixed `/api/v1`.

### Auth — `/api/v1/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Create account, send OTP email |
| POST | `/verify-otp` | — | Verify OTP → return `{ accessToken, user }` |
| POST | `/login` | — | Returns `{ accessToken, refreshToken, user }` |
| POST | `/refresh` | — | Rotate access + refresh tokens |
| POST | `/logout` | JWT | Clear refresh token |
| POST | `/resend-otp` | — | Resend OTP (validates email exists, rate limit 3/min) |

> **Dev OTP**: code is printed to terminal as `[DEV] OTP email to <email>: <code>`

### Search — `/api/v1/search`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/?destination=&checkin=&checkout=&adults=` | — | Full-text + availability search (supports filtering/sorting) |
| GET | `/suggestions?q=` | — | City autocomplete (DISTINCT ILIKE) |
| GET | `/categories` | — | Exploratory categories (Hotel, Resort, Villa, Heritage, Hostel) |

### Properties — `/api/v1/properties`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/:id` | — | Property detail with roomTypes + ratePlans |
| POST | `/` | PARTNER/ADMIN | Create property (status: DRAFT) |
| PATCH | `/:id` | PARTNER/ADMIN (owner) | Update listing |
| POST | `/:id/publish` | PARTNER/ADMIN (owner) | DRAFT → ACTIVE |

### Partner KYC & Management — `/api/v1/partners`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/kyc` | PARTNER | Submit KYC (phone, identity doc, address) |
| GET | `/kyc` | PARTNER | Get KYC status + validation messages |
| PATCH | `/kyc` | PARTNER | Update KYC information |
| POST | `/:id/bookings/:bookingId/approve` | PARTNER | Approve booking for property |
| POST | `/:id/bookings/:bookingId/decline` | PARTNER | Decline booking with reason |

### Bookings — `/api/v1/bookings`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/hold` | CUSTOMER | Reserve slot (15-min TTL hold) |
| POST | `/` | CUSTOMER | Confirm booking (atomic transaction) |
| GET | `/` | CUSTOMER | List own bookings |
| POST | `/:id/cancel` | CUSTOMER | CONFIRMED → CANCELLED, unblock dates |

### Media — `/api/v1/media`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/proxy?url=<imageUrl>` | Optimized image proxy (caching, compression) |

### Utility
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | `{ status: "ok", env: "development" }` |

---

## Module Pattern

Every feature module follows the same stack:

```
Router → validate(zodSchema) → authenticate → authorize(Role.X) → Controller → Service → Repository → Prisma
```

- **Router**: declares routes, applies middleware chain
- **Controller**: parse HTTP, call service, send response, pass errors to `next()`
- **Service**: all business logic, throws typed `AppError` subclasses
- **Repository**: all Prisma queries, no business logic

---

## Error Handling

```typescript
// Throw these from services — never raw Error
throw new AppError(statusCode, 'ERROR_CODE', 'Human message')
// Subclasses: UnauthorizedError, ForbiddenError, ConflictError, NotFoundError, BadRequestError
```

The global error handler in `common/errors/error-handler.ts` catches all `AppError` and `ZodError` instances and returns:
```json
{ "error": { "code": "ERROR_CODE", "message": "Human message" } }
```

---

## Database

- **ORM**: Prisma 5 with PostgreSQL
- **Schema**: `server/prisma/schema.prisma`
- **Migration**: one migration `20260509063921_init` — all tables created
- **Full-text search**: `search_vector` column (tsvector) on `properties`, managed by a PostgreSQL trigger. Queried via `Prisma.$queryRaw` with `plainto_tsquery` + ILIKE fallback.

### Tables
| Table | Purpose |
|-------|---------|
| `users` | Auth + roles (CUSTOMER / PARTNER / ADMIN) |
| `otp_tokens` | Email OTP verification (10-min TTL) |
| `properties` | Partner listings (DRAFT / ACTIVE / PAUSED) |
| `property_images` | Property photos |
| `room_types` | Rooms within a property |
| `rate_plans` | Pricing tiers per room (STANDARD / NON_REFUNDABLE / WEEKLY) |
| `availability` | Per-date availability grid, UNIQUE(room_type_id, date) |
| `availability_holds` | TTL-based reservation locks (15 min), GC job cleans expired |
| `bookings` | Confirmed reservations with confirmationNumber + PIN |
| `payment_simulations` | Audit log for simulated card payments |
| `partner_legal` | Partner KYC/legal entity info |

### Seeded Test Accounts
| Role | Email | Password |
|------|-------|----------|
| ADMIN | admin@app.com | Admin@123 |
| PARTNER | partner@app.com | Partner@123 |
| CUSTOMER | customer@app.com | Customer@123 |

---

## Auth Flow

1. `POST /register` → hash password → create user → generate 6-digit OTP → hash + store (10-min TTL) → log to console in dev
2. `POST /verify-otp` → find latest unused non-expired token → bcrypt compare → atomic `$transaction` (mark verified + mark OTP used) → return JWT
3. `POST /login` → find user → compare hash → check `emailVerified` → return `{ accessToken (1h), refreshToken (7d), user }`
4. Access token is a JWT `{ id, email, role }` — `authenticate` middleware verifies and attaches to `req.user`

---

## Booking Transaction (Atomic)

`bookings.repository.ts → createBookingWithTransaction` runs a single `prisma.$transaction`:
1. `tx.booking.create(...)` — create the booking record
2. `Promise.all(dates.map(d => tx.availability.upsert(...)))` — block each night
3. `tx.availabilityHold.delete(...)` — release the hold
4. `tx.paymentSimulation.create(...)` — log the payment audit record

If any step throws, the entire transaction rolls back.

---

## What Is NOT Yet Implemented (Phase 3+)

### In Progress
- Partner onboarding with KYC validation (phone, identity, address)
- Search filtering & sorting with exploratory categories
- Media proxy router for image optimization

### Phase 3+ Backlog
- OTP via real email (Nodemailer / Resend) — currently `logger.info` in dev
- Property image upload (S3 / Cloudinary)
- Admin panel routes (`/api/v1/admin/*`)
- WebSocket (Socket.IO) for real-time updates
- Redis caching
- Razorpay payment integration

---

## Critical Rules

- Never run `git push`, `rm -rf`, raw SQL `DELETE/DROP`, or `migrate:undo:all` without explicit user approval.
- Always ask before any `git commit`, `git add`, `git reset`, or `git merge`.
- Zod validation on every route before any DB call.
- Check ownership (`property.ownerId === req.user.id`) on every PARTNER write.
- Rate limit all auth routes (5 req/min).
- Never log: card numbers, passwords, raw OTP codes, full JWTs.
- Never store full card numbers — `card_last_four` only.
