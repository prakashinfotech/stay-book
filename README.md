# StayBook — E-Commerce System

Stay Booking platform system consists of three independently deployable components: a **Node.js REST API**, a **React web client**, and a **Flutter mobile app**, all sharing the same backend and JWT authentication.

---

## 📦 Repository Structure

```
Booking-Ecommerce-System/
├── server/          ← Express + TypeScript + Prisma (REST API)
├── client/          ← React 18 + Vite + TypeScript (Web App)
└── flutter/         ← Flutter 3.9.2 + Dart (Mobile App)
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend API** | Node.js, Express, TypeScript, Prisma ORM, PostgreSQL |
| **Web Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Zustand, React Query |
| **Mobile App** | Flutter 3.9.2, Dart, BLoC/Cubit, Clean Architecture, go_router |
| **Database** | PostgreSQL 15+ |
| **Auth** | JWT (Access + Refresh Token), OTP email verification |
| **Validation** | Zod (server + client), Flutter form validators |

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- PostgreSQL 15 running on `localhost:5432`
- Flutter SDK 3.9.2+
- Android Emulator / iOS Simulator (for mobile)

### 1. Start the Backend Server

```bash
cd server
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET
npm install
npm run db:migrate          # apply schema migrations
npm run db:seed             # seed test accounts
npm run dev                 # starts on http://localhost:3001
```

### 2. Start the Web Client

```bash
cd client
npm install
npm run dev                 # starts on http://localhost:3000
```

### 3. Run the Flutter Mobile App

```bash
cd flutter
flutter pub get
flutter run                 # connects to http://10.0.2.2:3001 (Android emulator)
```

---

## 🌐 Server — REST API

> **Port:** `3001` &nbsp;|&nbsp; **Prefix:** `/api/v1`

### Environment Variables (`server/.env`)

```env
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:1234@localhost:5432/booking_dev?schema=public
JWT_SECRET=<min 20 chars>
JWT_EXPIRATION=1h
JWT_REFRESH_SECRET=<min 20 chars>
SIMULATE_PAYMENT_FAILURE=false
```

### Key Commands

```bash
npm run dev                   # Start with hot-reload (nodemon + ts-node)
npm run build                 # Compile TypeScript → dist/
npm run lint                  # ESLint
npm run db:generate           # Regenerate Prisma typed client
npm run db:migrate            # Apply pending migrations
npm run db:studio             # Prisma Studio UI at localhost:5555
npm run db:seed               # Seed test accounts
```

### API Endpoints

#### Auth — `/api/v1/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Create account, send OTP |
| POST | `/verify-otp` | — | Verify OTP → return JWT |
| POST | `/login` | — | Returns `{ accessToken, refreshToken, user }` |
| POST | `/refresh` | — | Rotate tokens |
| POST | `/logout` | JWT | Clear refresh token |
| POST | `/resend-otp` | — | Resend OTP to email (validation + rate limit) |

> **Dev OTP**: printed to terminal as `[DEV] OTP email to <email>: <code>`

#### Search — `/api/v1/search`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/?destination=&checkin=&checkout=&adults=` | — | Full-text + availability search, supports filtering & sorting |
| GET | `/suggestions?q=` | — | City autocomplete |
| GET | `/categories` | — | Exploratory categories (Hotel, Resort, Villa, Heritage, Hostel) |

#### Properties — `/api/v1/properties`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/:id` | — | Property detail with rooms + rate plans |
| POST | `/` | PARTNER | Create listing (DRAFT) |
| PATCH | `/:id` | PARTNER | Update listing |
| POST | `/:id/publish` | PARTNER | DRAFT → ACTIVE |

#### Partner KYC & Onboarding — `/api/v1/partners`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/kyc` | PARTNER | Submit KYC (phone, identity, address) |
| GET | `/kyc` | PARTNER | Get KYC status + validation messages |
| PATCH | `/kyc` | PARTNER | Update KYC information |
| POST | `/:id/bookings/:bookingId/approve` | PARTNER | Approve booking |
| POST | `/:id/bookings/:bookingId/decline` | PARTNER | Decline booking with reason |

#### Bookings — `/api/v1/bookings`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/hold` | CUSTOMER | Reserve slot (15-min TTL) |
| POST | `/` | CUSTOMER | Confirm booking (atomic transaction) |
| GET | `/` | CUSTOMER | List own bookings |
| POST | `/:id/cancel` | CUSTOMER | Cancel booking |

#### Media — `/api/v1/media`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/proxy?url=<imageUrl>` | — | Optimized image proxy (caching, compression) |

#### Users — `/api/v1/users`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/:id` | JWT | Get user profile |
| PATCH | `/:id` | JWT | Update first/last name |

### Architecture

```
Router → validate(Zod) → authenticate → authorize(Role) → Controller → Service → Repository → Prisma
```

### Database Tables

| Table | Purpose |
|-------|---------|
| `users` | Auth + roles (CUSTOMER / PARTNER / ADMIN) |
| `otp_tokens` | Email OTP verification (10-min TTL) |
| `properties` | Partner listings (DRAFT / ACTIVE / PAUSED) |
| `room_types` | Rooms within a property |
| `rate_plans` | Pricing tiers (STANDARD / NON_REFUNDABLE / WEEKLY) |
| `availability` | Per-date availability grid |
| `availability_holds` | 15-min reservation locks (GC job) |
| `bookings` | Confirmed reservations (confirmationNumber + PIN) |
| `payment_simulations` | Audit log for simulated card payments |

### Seeded Test Accounts

| Role | Email | Password |
|------|-------|----------|
| ADMIN | admin@app.com | Admin@123 |
| PARTNER | partner@app.com | Partner@123 |
| CUSTOMER | customer@app.com | Customer@123 |

---

## 🖥️ Client — React Web App

> **Port:** `3000` &nbsp;|&nbsp; Proxies `/api` → `http://localhost:3001`

### Environment Variables (`client/.env`)

```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_WS_URL=ws://localhost:3001
VITE_ENV=development
```

### Key Commands

```bash
npm run dev          # Vite dev server with HMR
npm run build        # TypeScript compile + Vite bundle → dist/
npm run lint         # ESLint
```

### Pages & Routes

| Route | Page | Auth | Status |
|-------|------|------|--------|
| `/` | Search / Home | — | ✅ Hero + search + explore categories + filtering/sorting |
| `/login` | Login | — | ✅ |
| `/register` | Register | — | ✅ |
| `/verify-otp` | OTP Verify | — | ✅ 6-digit, auto-advance, resend |
| `/property/:id` | Property Detail | — | ✅ Rooms, amenities, reserve |
| `/checkout/details` | Guest Details | 🔒 | ✅ |
| `/checkout/payment` | Payment | 🔒 | ✅ Card form + price summary |
| `/booking/confirmation/:id` | Confirmation | 🔒 | ✅ PIN + confetti |
| `/trips` | My Trips | 🔒 | ✅ Past / Cancelled tabs with counts |
| `/partner/dashboard` | Partner Dashboard | 🔒 PARTNER | ⚠️ WIP — onboarding flow |
| `/partner/onboarding` | Partner Onboarding | 🔒 PARTNER | ⚠️ WIP — KYC validation |
| `/partner/bookings` | Partner Bookings | 🔒 PARTNER | ⚠️ WIP — approve/decline |
| `/partner/properties` | Partner Properties | 🔒 PARTNER | ⚠️ WIP |

### State Management

| Store | Library | Persisted | Purpose |
|-------|---------|-----------|---------|
| `auth.store.ts` | Zustand | ✅ localStorage | User, accessToken, refreshToken |
| `checkout.store.ts` | Zustand | ❌ | Room selection, guest details, holdId |

### Customer Booking Flow

```
/ (Search) → /property/:id (Pick Room → POST /hold)
  → /checkout/details (Guest info)
    → /checkout/payment (Card → POST /bookings)
      → /booking/confirmation/:id (Number + PIN)
```

---

## 📱 Flutter — Mobile App

> **Target:** Android & iOS &nbsp;|&nbsp; Customer-facing only

### Key Commands

```bash
flutter pub get                                              # Install dependencies
flutter run                                                  # Run on device/emulator
flutter analyze                                              # Static analysis (0 errors required)
flutter test                                                 # Unit tests
flutter build apk --release                                  # Android APK
flutter build ios --release                                  # iOS (macOS only)
flutter pub run build_runner build --delete-conflicting-outputs  # Code generation
```

### Architecture — Clean Architecture + BLoC

```
Presentation (BLoC/Cubit) → Domain (Use Cases, Entities, abstract Repos)
                                  ↑
                          Data (Models, DataSources, Repository Impl)
```

| Layer | Responsibility |
|-------|---------------|
| **Domain** | Pure Dart — entities, use cases, abstract repository interfaces |
| **Data** | JSON models, Dio data sources, concrete repository implementations |
| **Presentation** | BLoC/Cubit for state, Pages dispatch events, Widgets are pure view |

### Project Structure

```
lib/
├── main.dart                        ← DI init + runApp
├── app.dart                         ← MaterialApp.router + AppTheme
├── injection_container.dart         ← GetIt registrations (factory + singleton)
├── core/
│   ├── constants/app_constants.dart ← BASE_URL, timeouts
│   ├── errors/                      ← Failures, Exceptions
│   ├── network/                     ← DioClient, JWT AuthInterceptor
│   ├── theme/                       ← AppColors, AppTheme, AppTextStyles
│   ├── utils/                       ← date_utils, currency_utils
│   └── router/app_router.dart       ← go_router + auth guard + KeyboardDismissObserver
└── features/
    ├── auth/                        ← Splash, Login, Register, OTP, Profile
    ├── search/                      ← Home, Explore India, Search Results
    ├── property/                    ← Property Detail, Amenities, Rooms
    ├── checkout/                    ← Guest Details, Payment, Confirmation (animated)
    └── trips/                       ← My Trips (Past/Cancelled tabs with counts), Trip Detail
```

### Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Auth (Splash → Login → Register → OTP) | ✅ | JWT + SecureStorage |
| Profile Page (editable name, read-only email) | ✅ | PATCH `/users/:id` |
| Home (Explore India, Featured, Pull-to-refresh) | ✅ | BLoC |
| Property Detail (Images, Amenities, Rooms) | ✅ | Sliver AppBar |
| Checkout (Hold → Guest → Payment → Confirmation) | ✅ | Animated confetti |
| My Trips (Past + Cancelled with counts) | ✅ | Tab badges |
| Back-stack management | ✅ | go_router + canPop guards |
| Global keyboard dismiss on navigation | ✅ | NavigatorObserver |
| Indian mobile number validation | ✅ | 10-digit, starts 6-9 |

### Navigation

All screens use **go_router**:
- `pushNamed` for drill-down (preserves back-stack)
- `goNamed` for root-level replacement (home, login)
- `canPop()` guard on all back buttons to prevent crash on root routes
- `_KeyboardDismissObserver` in GoRouter dismisses keyboard on every route change

### Design System Colors

```dart
primary:    #003580  // Navy blue
accent:     #FFCC00  // Yellow CTA
success:    #00875A  // Green
danger:     #D32F2F  // Red
background: #F2F6FA  // Light grey
text:       #1A1A2E  // Near black
muted:      #6B7280  // Grey
```

---

## 🔐 Auth Flow (All Clients)

```
POST /register → OTP sent to email (logged to terminal in dev)
POST /verify-otp → returns accessToken (no refresh on register)
POST /login → returns { accessToken (1h), refreshToken (7d) }

On 401 → auto-refresh → retry → on failure: logout + redirect to login
```

Tokens stored in:
- **Web**: Zustand `persist` (localStorage)
- **Mobile**: `flutter_secure_storage` (Keychain / Keystore)

---

## 🗺️ Roadmap — In Progress & Phase 3

### In Progress
| Feature | Component | Status |
|---------|-----------|--------|
| Partner onboarding with KYC validation | Server + Client | 🔄 Phone + identity + address validation |
| Search with filtering & categories | Server + Client | 🔄 Sorting, category chips, exploratory results |
| Media proxy router (image optimization) | Server | 🔄 Centralized image proxy |

### Phase 3 — Backlog
| Feature | Component |
|---------|-----------|
| Real OTP email (Nodemailer / Resend) | Server |
| Property image upload (S3 / Cloudinary) | Server + Client |
| Admin panel | Server + Client |
| Date picker with blocked-date awareness | Client + Flutter |
| Razorpay payment integration | Client + Flutter |
| WebSocket real-time updates | Server + Client |
| Redis caching | Server |
| Push notifications | Flutter |

---

## ⚠️ Critical Rules (All Components)

- **Never** run `git push`, `rm -rf`, raw `DELETE/DROP` SQL, or `migrate:undo:all` without explicit approval.
- **Always** ask before any `git commit`, `git add`, `git reset`, or `git merge`.
- Zod/form validation must run **before** any API call.
- Never log: passwords, raw OTP codes, full JWTs, or card numbers.
- Never store full card numbers — `card_last_four` only.
- `flutter analyze` must pass with **0 errors** before declaring done.

---

## 📄 Component Documentation

For detailed per-component documentation, see:

- [`server/CLAUDE.md`](./server/CLAUDE.md) — API routes, module pattern, DB schema, booking transaction
- [`client/CLAUDE.md`](./client/CLAUDE.md) — Pages, state management, form pattern, design tokens
- [`flutter/CLAUDE.md`](./flutter/CLAUDE.md) — Clean Architecture layers, BLoC pattern, token lifecycle
