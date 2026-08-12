# Client — CLAUDE.md
> React 18 + Vite + TypeScript + Tailwind · Booking.com Clone MVP · Port 3000

> **Flutter Mobile App**: See `../flutter/CLAUDE.md`. Same backend, same JWT auth, same data.

---

## Quick Start

```bash
cd client
npm run dev          # Vite dev server with HMR
```

Proxies `/api` requests to `http://localhost:3001` (configured in `vite.config.ts`).

---

## Key Commands

```bash
npm run dev          # start Vite dev server on port 3000
npm run build        # tsc + vite build → dist/
npm run lint         # eslint src/**/*.{ts,tsx}
```

---

## Environment Variables (client/.env)

```
VITE_API_URL=http://localhost:3001/api/v1
VITE_WS_URL=ws://localhost:3001
VITE_ENV=development
```

---

## Folder Structure (actual files on disk)

```
client/src/
├── api/
│   ├── client.ts             ← Axios instance (base URL, JWT interceptor, 401 → refresh)
│   ├── auth.api.ts           ← register, verifyOtp, login, refresh, logout
│   ├── properties.api.ts     ← search, getById
│   └── bookings.api.ts       ← createHold, createBooking, getMyBookings, cancel
├── common/
│   └── axiosInstance.ts      ← secondary axios instance (used by some legacy calls)
├── components/
│   ├── layout/
│   │   ├── Header.tsx        ← sticky nav, auth-aware (login/register or email + logout)
│   │   └── PageWrapper.tsx   ← max-w-6xl mx-auto px-4 py-6 container
│   └── ui/
│       ├── Button.tsx        ← variant: primary/secondary/danger · size: sm/md/lg · loading spinner
│       ├── Input.tsx         ← forwardRef, label, error message
│       ├── Spinner.tsx       ← animated SVG circle, size: sm/md/lg
│       ├── ErrorBanner.tsx   ← red alert box
│       ├── Badge.tsx         ← booking status chip (CONFIRMED=green, CANCELLED=red, etc.)
│       └── StarRating.tsx    ← filled/empty stars, props: stars(0-5)/size/showNumber
├── features/
│   ├── auth/
│   │   ├── login-page.tsx        ← RHF + Zod, POST /auth/login
│   │   ├── register-page.tsx     ← RHF + Zod, POST /auth/register
│   │   └── otp-page.tsx          ← 6-digit code input, POST /auth/verify-otp, resend OTP
│   ├── search/
│   │   ├── search-page.tsx       ← hero + search form + categories + filtering/sorting + results
│   │   └── property-card.tsx     ← partner listing card (internal link to /property/:id)
│   ├── property/
│   │   └── property-detail-page.tsx ← cover, amenities, room cards, reserve CTA
│   ├── checkout/
│   │   ├── guest-details-page.tsx   ← 🔒 name/email/phone/country/arrivalTime/specialRequests
│   │   ├── payment-page.tsx         ← 🔒 card form + price breakdown sidebar
│   │   └── confirmation-page.tsx    ← 🔒 confirmationNumber + PIN + summary
│   ├── trips/
│   │   └── trips-page.tsx           ← 🔒 booking list + cancel action
│   └── partner/                     ← stubs only — no real implementation
│       ├── dashboard/partner-dashboard-page.tsx
│       ├── onboarding/partner-onboarding-page.tsx
│       ├── bookings/partner-bookings-page.tsx
│       ├── availability/partner-availability-page.tsx
│       └── earnings/partner-earnings-page.tsx
├── hooks/
│   ├── useAppDispatch.ts     ← no-op stub (project uses Zustand, not Redux)
│   └── useAppSelector.ts     ← no-op stub (project uses Zustand, not Redux)
├── store/
│   ├── auth.store.ts         ← Zustand + persist · { user, accessToken, refreshToken }
│   └── checkout.store.ts     ← Zustand (not persisted) · { roomSelection, guestDetails, holdId }
├── router/
│   └── index.tsx             ← createBrowserRouter, lazy pages, ProtectedRoute
├── types/
│   └── index.ts              ← User, Property, RoomType, SearchResult, BookingListItem, CreatedBooking
└── utils/
    ├── format.ts             ← formatPrice(), formatDate(), formatNights(), todayStr(), tomorrowStr()
    └── error.ts              ← getApiError() extracts human message from Axios errors
```

---

## Implemented Pages & Routes

| Route | Page | Auth | Status |
|-------|------|------|--------|
| `/` | SearchPage | — | ✅ Hero + search form + landing dashboard + exploratory categories + filtering/sorting |
| `/login` | LoginPage | — | ✅ Email + password |
| `/register` | RegisterPage | — | ✅ Name + email + password + role selector |
| `/verify-otp` | OtpPage | — | ✅ 6 individual digit boxes, auto-advance, backspace nav, paste, 10-min countdown, resend, auto-submit |
| `/property/:id` | PropertyDetailPage | — | ✅ Info, rooms, reserve CTA |
| `/checkout/details` | GuestDetailsPage | 🔒 Customer | ✅ Guest name, email, phone, arrival time |
| `/checkout/payment` | PaymentPage | 🔒 Customer | ✅ Card form + price summary |
| `/booking/confirmation/:bookingId` | ConfirmationPage | 🔒 Customer | ✅ confirmationNumber + PIN + CSS confetti + copy to clipboard + print/PDF + "What's next" |
| `/trips` | TripsPage | 🔒 Customer | ✅ Tab bar (Upcoming/Past/Cancelled with counts) + cancel button for future confirmed |
| `/partner/dashboard` | PartnerDashboardPage | 🔒 Partner | ⚠️ WIP — onboarding flow |
| `/partner/onboarding` | PartnerOnboardingPage | 🔒 Partner | ⚠️ WIP — KYC validation (phone, identity, address) |
| `/partner/bookings` | PartnerBookingsPage | 🔒 Partner | ⚠️ WIP — approve/decline bookings |
| `/partner/properties` | PartnerPropertiesPage | 🔒 Partner | ⚠️ WIP — list + edit listings |

---

## Implemented UI Components

| Component | File | Description |
|-----------|------|-------------|
| Button | `components/ui/Button.tsx` | variant: primary/secondary/danger/ghost · loading state |
| Input | `components/ui/Input.tsx` | forwardRef, RHF-compatible, label + inline error |
| Spinner | `components/ui/Spinner.tsx` | SVG circle, size: sm/md/lg |
| ErrorBanner | `components/ui/ErrorBanner.tsx` | red alert box for API errors |
| Badge | `components/ui/Badge.tsx` | status chip, color-coded by booking status |
| Header | `components/layout/Header.tsx` | sticky nav, auth-aware user menu |
| PageWrapper | `components/layout/PageWrapper.tsx` | max-width container |
| PropertyCard | `features/search/property-card.tsx` | partner listing card (internal links only) |
| StarRating | `components/ui/StarRating.tsx` | filled/half/empty stars · props: stars(0–5), size(sm/md/lg), showNumber |

**Not yet built (in plan):** `Modal.tsx`, `Footer.tsx`

---

## State Management

### Auth Store (`store/auth.store.ts`)
- Zustand + `persist` middleware (survives page refresh via localStorage)
- `login(user, accessToken, refreshToken)` — sets all three
- `clear()` — logout, clears all state
- `setTokens(accessToken, refreshToken)` — used by token refresh interceptor
- `isAuthenticated()` — returns `accessToken !== null`

### Checkout Store (`store/checkout.store.ts`)
- Plain Zustand, not persisted — intentionally cleared after booking completes
- `setRoomSelection({ propertyId, roomTypeId, ratePlanId, checkin, checkout, adults, children, priceBreakdown, holdId })`
- `setHoldId(holdId)` — updates holdId after hold creation
- `setGuestDetails({ firstName, lastName, email, phone, country, arrivalTime, specialRequests, isMainGuest })`
- `clear()` — called after `POST /bookings` succeeds

---

## API Layer

### Axios Client (`api/client.ts`)
- `baseURL`: `VITE_API_URL` env var (defaults to `http://localhost:3001/api/v1`)
- Request interceptor: attaches `Authorization: Bearer <token>` from Zustand auth store
- Response interceptor: on 401 → attempt token refresh → retry original request → on failure: `clear()` + redirect to `/login`
- Timeout: 10 seconds

### Error Handling
Always use `getApiError(error)` from `utils/error.ts` — extracts the human-readable message from Axios error responses. Never display raw `error` objects.

---

## Customer Booking Flow

```
/ (Search) → /property/:id (Pick Room → POST /bookings/hold)
  → /checkout/details (Guest info → stored in Zustand)
    → /checkout/payment (Card form → POST /bookings)
      → /booking/confirmation/:id (shows confirmationNumber + PIN)
```

- Hold is created on "Reserve" click in PropertyDetailPage
- Hold ID stored in `checkout.store`
- On payment success: `checkout.store.clear()` + navigate to confirmation with `{ state: { booking } }`
- Confirmation page reads booking from `useLocation().state.booking`

---

## Form Pattern

All forms use **React Hook Form** + **Zod** + `@hookform/resolvers/zod`:

```tsx
const schema = z.object({ email: z.string().email(), ... })
type FormData = z.infer<typeof schema>

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
})
```

No API call fires until client-side Zod validation passes.

---

## Design System Tokens (from 06_UI_MASTER_PROMPT.md)

```css
--color-primary:      #003580;   /* Booking.com navy */
--color-primary-dark: #00224F;
--color-accent:       #FFCC00;   /* Yellow CTA */
--color-accent-hover: #E6B800;
--color-surface:      #FFFFFF;
--color-bg:           #F2F6FA;
--color-text:         #1A1A2E;
--color-muted:        #6B7280;
--color-star:         #FDC702;
--color-success:      #00875A;
--color-danger:       #D32F2F;
--color-border:       #E5E7EB;
--radius-card:        12px;
--radius-btn:         6px;
--shadow-card:        0 2px 8px rgba(0,0,0,0.10);
--shadow-card-hover:  0 6px 20px rgba(0,0,0,0.16);
```

---

## TypeScript

- Strict mode enabled
- `tsconfig.node.json` exists for Vite config type checking
- `npx tsc --noEmit` passes with 0 errors
- `npx vite build` produces clean dist/

---

## In Progress

### Partner Pages (Phase 2)
- Partner Dashboard: stats row, listings table, recent bookings
- Onboarding Wizard: KYC validation (phone, identity doc, address)
- Partner Bookings: approve/decline bookings per property
- Listings Manager: edit property + room types + publish/unpublish

---

## Not Yet Implemented (Phase 3+)

### Missing UI Components
- `Modal.tsx` — accessible dialog wrapper
- `Footer.tsx` — page footer with links and copyright

### Missing on Property Detail Page
- Date picker with blocked-date awareness (`isBlocked: true` dates shown greyed)
- "Only N left!" warning when `totalRooms ≤ 2`

### Missing Features
- Admin panel pages
- WebSocket real-time notifications
- Advanced image upload (S3 / Cloudinary integration)

---

## Critical Rules

- Never store `accessToken` in `localStorage` directly — only via Zustand `persist`.
- Always use `getApiError(error)` — never display raw error objects.
- All form filenames → `kebab-case`; all component/class names → `PascalCase`.
- Never use `dangerouslySetInnerHTML`.
- DEV-only UI (payment failure toggle) must be wrapped in `import.meta.env.DEV`.
- Never run `git push`, `rm -rf`, or destructive operations without explicit user approval.
- Always ask before any `git commit`, `git add`, `git reset`, or `git merge`.
