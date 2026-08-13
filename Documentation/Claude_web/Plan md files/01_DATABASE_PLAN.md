# 📦 DATABASE PLAN — PostgreSQL 15 + Prisma ORM
> Booking.com Clone · Phase 1 MVP

---

## ✅ STEP 1 — Local Setup (Day 1)

### Recommended: Docker
```bash
docker-compose up -d        # starts PostgreSQL 15 on :5432 + pgAdmin on :5050
```
Use pgAdmin at `http://localhost:5050` with `admin@app.com / admin` to inspect tables visually.

### `.env` in `server/`
```
DATABASE_URL=postgresql://appuser:apppassword@localhost:5432/appdb
```

---

## ✅ STEP 2 — Prisma Init (Day 1)
```bash
cd server
npm install prisma @prisma/client
npx prisma init
```
Paste the full `schema.prisma` (see guide §1.4), then:
```bash
npx prisma migrate dev --name init   # creates all tables
npx prisma generate                  # regenerates the typed client
npx prisma db seed                   # seeds admin + partner test users
```

> ⚠️ RULE: Never edit the DB directly. All schema changes go through `prisma migrate dev`.

---

## ✅ STEP 3 — Tables to Build (in dependency order)

| # | Table | Purpose | Advanced Notes |
|---|-------|---------|----------------|
| 1 | `users` | Auth + roles (CUSTOMER / PARTNER / ADMIN) | UUID PK, bcrypt hash, email_verified flag |
| 2 | `otp_tokens` | Email OTP verification | 10-min TTL, `used` flag, bcrypt hashed code |
| 3 | `properties` | Partner listings | JSONB amenities, TSVECTOR for full-text search |
| 4 | `room_types` | Rooms within a property | Price, occupancy, cancellation policy |
| 5 | `availability` | Per-date availability grid | UNIQUE(room_type_id, date) constraint |
| 6 | `availability_holds` | TTL-based reservation locks | `expires_at` — cleaned by cron job |
| 7 | `bookings` | Confirmed reservations | Atomic tx, confirmation_number UNIQUE |
| 8 | `payment_simulations` | Audit log for dummy payments | NEVER store full card number |

---

## ✅ STEP 4 — Indexes to Create

```sql
-- Full-text search on properties
CREATE INDEX idx_properties_search    ON properties USING GIN(search_vector);
CREATE INDEX idx_properties_amenities ON properties USING GIN(amenities);
CREATE INDEX idx_properties_city      ON properties(city);
CREATE INDEX idx_properties_status    ON properties(status);

-- Availability lookup (most critical for performance)
CREATE INDEX idx_availability_room_date ON availability(room_type_id, date);

-- Booking queries
CREATE INDEX idx_bookings_user     ON bookings(user_id);
CREATE INDEX idx_bookings_property ON bookings(property_id);
CREATE INDEX idx_bookings_status   ON bookings(status);

-- Hold garbage collection
CREATE INDEX idx_holds_expires ON availability_holds(expires_at);
```

---

## ✅ STEP 5 — Full-Text Search Trigger

```sql
-- Auto-rebuild search_vector whenever a property is inserted/updated
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

## ✅ STEP 6 — Seed Data (server/prisma/seed.ts)

Seed creates two test accounts automatically:
| Role | Email | Password |
|------|-------|----------|
| ADMIN | admin@app.com | Admin@123 |
| PARTNER | partner@app.com | Partner@123 |

Add 5–10 sample properties with room types and pre-filled `availability` rows (e.g., for the next 90 days) so the search page works immediately during development.

---

## 🔴 ADVANCED TASKS (Do after MVP works)

### A. Hold Garbage Collection (Cron Job)
```ts
// Run every 5 minutes — delete expired holds and unblock dates
await prisma.availabilityHold.deleteMany({
  where: { expiresAt: { lt: new Date() } }
})
```
Use `node-cron` in `server/src/jobs/hold-gc.job.ts`. Upgrade path: Bull/BullMQ + SQS.

### B. Race Condition Protection
The `availability` table has `UNIQUE(room_type_id, date)`. In `createBooking`, re-check availability **inside** the `$transaction` after hold validation. If another request already blocked the date, Prisma will throw and the transaction rolls back cleanly.

### C. Soft Deletes (Phase 2)
Add `deleted_at TIMESTAMPTZ` to `properties` and `users`. Filter with `WHERE deleted_at IS NULL`. Never hard-delete partner data that has associated bookings.

### D. Connection Pooling (Scale-up)
```
DB_POOL_MAX=5   ← already in .env.example
```
For production traffic, add PgBouncer in front of Postgres (or use Supabase/Neon which pools automatically).

### E. Managed DB in Production
- **Supabase** or **Neon** → copy `DATABASE_URL` → paste into Railway/Render env vars.
- Run `npx prisma migrate deploy` (not `dev`) in the Procfile.

---

## 🚫 CRITICAL RULES
- Parameterized queries only (Prisma enforces this by default — never bypass with raw SQL strings).
- Never run `DROP TABLE`, `DELETE` (SQL), or `migrate:undo:all` without explicit user approval.
- Always commit `.env.example` with dummy values; never commit `.env`.
- Card numbers: store `card_last_four` only — never the full 16 digits.
