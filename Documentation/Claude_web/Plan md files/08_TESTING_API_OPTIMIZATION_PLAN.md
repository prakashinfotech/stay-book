# Plan: Testing Coverage, API Integration Depth & AI-Assisted Optimization

## Context

The project is a Turborepo monorepo (React client, Express/Prisma server, Flutter mobile) building a Booking.com-style POC. Core happy paths (search → hold → pay → book → trips) are functional. This plan improves three areas **without breaking existing working flows**:

1. **Testing coverage and validation scenarios** — zero tests exist; frameworks are installed but not configured
2. **Backend/API integration depth** — three missing endpoints, a client-exposed API key, and disconnected partner frontend pages
3. **AI-assisted optimization** — N+1 queries, duplicate indexes, no caching, startup mutation, and sequential loops

Phases are ordered so later work never breaks earlier work: bugs/security first → test scaffolding → unit/integration tests → validation schemas → partner pages → performance.

---

## Phase 1 — Critical Bug Fixes & Security (no risk to working flows)

### 1.1 Add missing `GET /bookings/:id` endpoint
**Problem:** `TripDetailPage` fetches all 50 bookings and filters client-side — inefficient and fragile.

- `server/src/modules/bookings/bookings.repository.ts` — add `findByIdForOwner(bookingId, userId)` with full relations
- `server/src/modules/bookings/bookings.service.ts` — add `getBookingById(id, userId)`, throws `NotFoundError` if not found
- `server/src/modules/bookings/bookings.controller.ts` — add `getBookingById` handler
- `server/src/modules/bookings/bookings.router.ts` — add `router.get('/:id', authenticate, authorize(CUSTOMER), controller.getBookingById)`
- `client/src/api/bookings.api.ts` — add `getById(id)` function
- `client/src/features/trips/trip-detail-page.tsx` — replace bulk-fetch with `useQuery(['booking', bookingId], () => bookingsApi.getById(bookingId!))`

### 1.2 Fix Gemini API key security (key exposed in browser bundle)
**Problem:** `ChatBot.tsx` calls `generativelanguage.googleapis.com` directly from the browser with `VITE_GEMINI_API_KEY`.

- Create `server/src/modules/chat/` module: `chat.router.ts`, `chat.controller.ts`, `chat.service.ts`, `chat.schema.ts`
  - Schema: `z.object({ history: z.array(...), userText: z.string().max(500) })`
  - Service: reads `config.GEMINI_API_KEY` (server-side env var), calls Gemini API
  - Service: returns 503 when key is absent (optional env var)
- `server/src/config/env.ts` — add `GEMINI_API_KEY: z.string().optional()`
- `server/src/app.ts` — mount `chatRouter` at `/api/v1/chat`
- `client/src/features/search/ChatBot.tsx` — replace direct Gemini fetch with `apiClient.post('/chat/ask', { history, userText })`
- Remove `VITE_GEMINI_API_KEY` from client `.env.example`; add `GEMINI_API_KEY` to server `.env.example`

### 1.3 Add missing `POST /auth/resend-otp` endpoint
**Problem:** OTP page resend button has no backend route — silently fails.

- `server/src/modules/auth/auth.service.ts` — add `resendOtp(userId)`: invalidate prior tokens, generate new OTP, send email, return `{ devOtp }` in dev
- `server/src/modules/auth/auth.controller.ts` — add `resendOtp` handler
- `server/src/modules/auth/auth.router.ts` — add `router.post('/resend-otp', authLimiter, controller.resendOtp)`
- `client/src/api/auth.api.ts` — add `resendOtp(userId)`
- `client/src/features/auth/otp-page.tsx` — wire `handleResend` to `useMutation` calling `authApi.resendOtp`

### 1.4 Remove unused duplicate Axios instance
- Verify zero imports of `client/src/common/axiosInstance.ts` (confirmed unused by exploration)
- Delete `client/src/common/axiosInstance.ts`

### 1.5 Remove server startup mutation
- `server/src/index.ts` — remove the `prisma.property.updateMany` lat/lng backfill that runs on every server start
- Create `server/prisma/scripts/backfill-latlng.ts` as a one-time ts-node script

### 1.6 Remove duplicate database indexes (requires Prisma migration)
- `server/prisma/schema.prisma`:
  - `Booking` model: remove anonymous `@@index([userId, status])` and `@@index([propertyId])`; keep only named versions
  - `AvailabilityHold` model: remove anonymous `@@index([expiresAt])`; keep named version
- Run `prisma migrate dev --name remove_duplicate_indexes`

---

## Phase 2 — Test Infrastructure Setup

### 2.1 Server: Create `server/jest.config.ts`
```ts
import type { Config } from 'jest';
const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts', '!src/config/**'],
  coverageDirectory: 'coverage',
};
export default config;
```
Add `"test:watch": "jest --watch"` to `server/package.json`.

### 2.2 Client: Create `client/vitest.config.ts`
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  test: { globals: true, environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] },
});
```
Create `client/src/test/setup.ts` with `import '@testing-library/jest-dom'`.

### 2.3 Flutter: Restructure test directory
- Replace placeholder `flutter/test/widget_test.dart` with a structured entry point
- Create `flutter/test/features/auth/` and `flutter/test/features/trips/` directories

---

## Phase 3 — Core Happy-Path Unit & Integration Tests

### 3.1 Server unit: Auth service
**File:** `server/src/modules/auth/__tests__/auth.service.test.ts`
- `register` happy path → `userId` + `devOtp` returned
- `register` duplicate email → `ConflictError` with code `EMAIL_IN_USE`
- `verifyOtp` happy path → tokens returned
- `login` unverified email → 403 `EMAIL_NOT_VERIFIED`

### 3.2 Server unit: Bookings service
**File:** `server/src/modules/bookings/__tests__/bookings.service.test.ts`
- `createHold` happy path, room not found, room not available
- `createBooking` with expired hold → 410 `HOLD_EXPIRED`
- `cancelBooking` already-cancelled → 409 `BOOKING_NOT_CANCELLABLE`

### 3.3 Server integration: Auth routes
**File:** `server/src/modules/auth/__tests__/auth.router.integration.test.ts`
Use supertest against `createApp()` + test DB. 11 scenarios covering register/verify/login/refresh/logout/resend-otp flows.

### 3.4 Server integration: Bookings routes
**File:** `server/src/modules/bookings/__tests__/bookings.router.integration.test.ts`
8 scenarios: auth guards, hold creation, booking list, `GET /:id`, cancel, double-cancel.

### 3.5 Client unit: Shared Zod schemas
**File:** `client/src/test/schemas.test.ts`
Tests for `loginSchema`, `registerSchema`, `guestDetailsSchema`, `paymentSchema` from `packages/shared/src/schemas.ts`.

### 3.6 Client unit: `getApiError` utility
**File:** `client/src/test/utils.test.ts`
4 cases: Axios error with nested message, fallback message, plain Error, unknown type.

### 3.7 Flutter unit: Auth use cases
**Files:** `flutter/test/features/auth/login_usecase_test.dart`, `verify_otp_usecase_test.dart`
Using `mocktail`: success → `Right(entity)`, network failure → `Left(NetworkFailure)`, server error → `Left(ServerFailure)`.

---

## Phase 4 — API Integration Depth (Partner Frontend)

### 4.1 Fix TanStack Query global staleTime
**File:** `client/src/main.tsx` (wherever `QueryClient` is created)
```ts
new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})
```
Queries needing live data can override with `staleTime: 0` at the call site.

### 4.2 Ensure `client/src/api/partner.api.ts` is complete
Add all partner API calls: `getSummary`, `getProperties`, `getArrivals`, `getBookings`, `markNoShow`, `getEarnings`, `getAvailability`, `updateAvailability`.

### 4.3 Implement Partner Bookings page
**File:** `client/src/features/partner/bookings/partner-bookings-page.tsx`
- TanStack Query fetching `/partner/bookings` with status filter + pagination
- Table: property, guest, check-in/out, price, status badge
- "Mark No-Show" button for past CONFIRMED bookings (fires `partnerApi.markNoShow`, invalidates query)

### 4.4 Implement Partner Earnings page
**File:** `client/src/features/partner/earnings/partner-earnings-page.tsx`
- Three stat cards: This Month / Last Month / Lifetime
- Commission breakdown table

### 4.5 Implement Partner Availability page
**File:** `client/src/features/partner/availability/partner-availability-page.tsx`
- Calendar grid for a property (from `useParams`)
- Red cells = blocked, blue = booked (non-interactive), white = available
- Click toggles block on available dates; Save button fires `updateAvailability`

---

## Phase 5 — Validation Schema Coverage

### 5.1 Fill stub schema files
- `server/src/modules/notifications/notifications.schema.ts` — `createNotificationSchema`
- `server/src/modules/orders/orders.schema.ts` — `createOrderSchema`
- `server/src/modules/services/services.schema.ts` — `createServiceSchema`

### 5.2 Add admin module Zod schemas
**File to create:** `server/src/modules/admin/admin.schema.ts`
- `updatePropertyStatusSchema`: `z.enum(['ACTIVE', 'DRAFT', 'PAUSED'])`
- `listQuerySchema`: `page`, `limit`, optional `q`

**File:** `server/src/modules/admin/admin.router.ts`
- Apply `validate(updatePropertyStatusSchema)` to PATCH route
- Apply `validateQuery(listQuerySchema)` to GET list routes

### 5.3 Client: Import shared schemas instead of re-implementing inline
- `client/src/features/checkout/guest-details-page.tsx` — import `guestDetailsSchema` from `@booking/shared`, extend locally
- `client/src/features/auth/login-page.tsx` — import `loginSchema` from `@booking/shared`
- `client/src/features/auth/register-page.tsx` — import `registerSchema` from `@booking/shared`
- Confirm `@booking/shared` is in `client/package.json` (`"workspace:*"`)

---

## Phase 6 — Performance & Scalability Fixes

All changes are pure query refactors; existing request/response contracts are unchanged.

### 6.1 Eliminate N+1 in partner repository
**File:** `server/src/modules/partner/partner.repository.ts`
- Remove private `propertyIds(ownerId)` method
- In `getSummary`, `getUpcomingArrivals`, `getBookings`, `getEarnings`: replace `propertyId: { in: ids }` with `property: { ownerId }` in the Prisma `where` clause
- Each method goes from 2 DB round-trips to 1

### 6.2 Batch the availability conflict check
**File:** `server/src/modules/partner/partner.repository.ts` (`updateAvailability`)
- Replace the sequential `for...await findFirst` loop with a single `findMany` query that fetches all conflicting rows at once
- Throw `ConflictError` if any results are returned

### 6.3 Replace correlated subqueries with LATERAL JOINs
**File:** `server/src/modules/search/search.repository.ts`
**File:** `server/src/modules/properties/properties.repository.ts` (`getFeatured`)
- Replace per-row `SELECT MIN(rt2.base_price)` and `SELECT pi.url FROM property_images` correlated subqueries with `LEFT JOIN LATERAL (...)` expressions on `min_price` and `cover_image`

### 6.4 Add Prisma connection pool configuration
**File:** `server/.env` / `.env.example`
- Append `?connection_limit=10&pool_timeout=30&statement_timeout=5000` to `DATABASE_URL`
- Document recommended production value: `connection_limit = (2 × CPU cores) + 1`

### 6.5 Add lightweight in-memory cache for partner summary
**File:** `server/src/modules/partner/partner.service.ts`
- Add module-level `Map<string, { data, expiresAt }>` with 30-second TTL for `getSummary`
- Invalidate on `markNoShow` and `updateAvailability` calls for the same `ownerId`
- (Replaces the need for Redis until Phase 2 infra work)

---

## Phase 7 — Validation Edge-Case Tests

### 7.1 Server: Auth edge cases
Extend `auth.router.integration.test.ts`:
- Password missing uppercase → 400 with field-level `details`
- Register with role `ADMIN` → 400 (schema only allows CUSTOMER/PARTNER)
- Expired OTP → 400 `OTP_INVALID`; already-used OTP → 400 `OTP_INVALID`
- Wrong password login → 401; tampered refresh token → 401
- Resend OTP for non-existent user → 404; for verified user → 409 `ALREADY_VERIFIED`

### 7.2 Server: Bookings edge cases
Extend `bookings.router.integration.test.ts`:
- Checkout before checkin → 400 `VALIDATION_ERROR`
- Non-UUID `roomTypeId` → 400
- Hold created by user A, booking attempted by user B → 403 `FORBIDDEN`
- `GET /bookings/:id` for another user's booking → 404

### 7.3 Client: Form validation edge cases (Vitest + Testing Library)
**File:** `client/src/test/forms.test.tsx`
- Login: empty submit shows required errors without calling API
- Login: email without `@` shows validation error
- Guest details: 9-digit phone shows regex message
- Guest details: special requests > 500 chars shows length error

### 7.4 Flutter: Auth BLoC tests
**File:** `flutter/test/features/auth/auth_bloc_test.dart`
- `LoginBloc`: success → `[AuthLoading, AuthSuccess(user)]`
- `LoginBloc`: network failure → `[AuthLoading, AuthError('No internet')]`
- `LoginBloc`: wrong password → `[AuthLoading, AuthError('Invalid credentials')]`
- `RegisterBloc`: success → `[AuthLoading, RegisterSuccess(userId)]`
- `RegisterBloc`: duplicate email → `[AuthLoading, AuthError('Email already registered')]`

---

## Verification Checklist

After each phase:
1. `cd server && npm test` — all tests green
2. `cd client && npm test` — all tests green
3. `cd flutter && flutter test` — all tests green
4. `cd server && npm run build` — no TypeScript errors
5. `cd client && npm run build` — no TypeScript errors
6. `cd flutter && flutter analyze` — 0 errors
7. Manual smoke test: register → verify OTP → search → hold → pay → booking list → trip detail
8. Phase 1 only: verify resend OTP button returns a new code; verify `GET /bookings/[id]` returns single booking instead of list

## Files NOT to touch (high risk, currently working)
- `server/src/modules/bookings/bookings.repository.ts` (atomic transaction) — only add new method, never modify existing ones
- `server/src/modules/auth/auth.service.ts` (OTP flow) — only add `resendOtp`, never modify `verifyOtp`
- `client/src/features/checkout/` (3-step payment flow) — only add validation schema import in guest-details; never modify payment or confirmation pages
- `server/prisma/schema.prisma` — only remove the proven duplicate indexes; no model changes
