# 🖥️ FRONTEND PLAN — React 18 + Vite + TypeScript
> Booking.com Clone · Phase 1 MVP · Port 5173

---

## ✅ STEP 1 — Project Setup (Day 1)

```bash
cd client
npm create vite@latest . -- --template react-ts
npm install
npm install @tanstack/react-query axios react-router-dom zustand
npm install react-hook-form zod @hookform/resolvers
npm install -D @types/node vitest @testing-library/react @testing-library/jest-dom jsdom
```

### `.env` (local only — never commit)
```
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
VITE_ENV=development
```

### NPM Scripts
```json
"dev":   "vite",
"build": "tsc && vite build",
"lint":  "eslint src --ext .ts,.tsx",
"test":  "vitest run"
```

---

## ✅ STEP 2 — Folder Structure

```
client/src/
├── api/
│   ├── client.ts             ← Axios instance + interceptors (JWT attach, 401 redirect)
│   ├── auth.api.ts           ← register, verifyOtp, login
│   ├── properties.api.ts     ← search, getById
│   └── bookings.api.ts       ← createHold, createBooking, getMyBookings, cancel
├── components/
│   ├── ui/                   ← Button, Input, Badge, Spinner, ErrorBanner (reusable)
│   └── layout/               ← Header, Footer, PageWrapper
├── features/
│   ├── auth/
│   │   ├── login-page.tsx
│   │   ├── register-page.tsx
│   │   └── otp-page.tsx
│   ├── search/
│   │   ├── search-page.tsx   ← search bar + results grid
│   │   └── property-card.tsx ← card shown in results
│   ├── property/
│   │   └── property-detail-page.tsx  ← rooms, availability picker, "Reserve" CTA
│   ├── checkout/
│   │   ├── guest-details-page.tsx    ← name, email, phone, special requests
│   │   └── payment-page.tsx          ← dummy card form
│   ├── booking/
│   │   └── confirmation-page.tsx     ← confirmation number + PIN display
│   └── trips/
│       └── trips-page.tsx            ← list + cancel bookings
├── hooks/
│   └── use-booking-store.ts  ← Zustand checkout state (holdId, guestDetails)
├── store/
│   └── auth.store.ts         ← Zustand auth state (user, accessToken)
├── router/
│   └── index.tsx             ← lazy routes + ProtectedRoute wrapper
├── types/
│   └── index.ts              ← shared TS interfaces (Property, Booking, User, etc.)
├── utils/
│   ├── format.ts             ← formatPrice(), formatDate(), formatNights()
│   └── error.ts              ← getApiError(), getApiErrorCode()
├── App.tsx
└── main.tsx                  ← QueryClient + AppRouter providers
```

> Convention: Filenames → `kebab-case`. Component/class names → `PascalCase`.

---

## ✅ STEP 3 — Pages to Build

### 3.1 Auth Flow
| Page | Route | Notes |
|------|-------|-------|
| Register | `/register` | email + password + role selector (Customer/Partner) |
| OTP Verify | `/verify-otp` | 6-digit code input, resend button |
| Login | `/login` | email + password, redirect to `/` on success |

All forms use `react-hook-form` + `zodResolver`. No API call until client-side Zod passes.

### 3.2 Customer Flow
| Page | Route | Notes |
|------|-------|-------|
| Search | `/` | city, dates, adults inputs → query `/api/search` |
| Property Detail | `/property/:id` | room list, date picker, occupancy check |
| Guest Details | `/checkout/details` | 🔒 Protected — name, email, phone, special requests |
| Payment | `/checkout/payment` | 🔒 Protected — dummy card form, DEV failure toggle |
| Confirmation | `/booking/confirmation/:id` | shows `confirmationNumber` + `PIN` |
| My Trips | `/trips` | 🔒 Protected — booking list, cancel action |

### 3.3 Partner Flow (Post-MVP but scaffold routes)
| Page | Route | Notes |
|------|-------|-------|
| Onboarding Wizard | `/partner/onboard` | 6 steps, stepper UI |
| Dashboard | `/partner/dashboard` | listings overview, booking stats |
| Listing Manager | `/partner/listings/:id` | edit property, manage rooms |
| Availability Manager | `/partner/listings/:id/availability` | calendar-style block/unblock |

---

## ✅ STEP 4 — State Management

### Zustand Auth Store (`store/auth.store.ts`)
```ts
{
  user: User | null,
  accessToken: string | null,
  login(user, token): void,
  logout(): void,
  isAuthenticated(): boolean
}
```
Persisted via `zustand/middleware persist` (survives page refresh).

### Zustand Booking Store (`hooks/use-booking-store.ts`)
```ts
{
  holdId: string | null,
  checkin: string | null,
  checkout: string | null,
  roomTypeId: string | null,
  guestDetails: GuestDetails | null,
  setHold(...): void,
  setGuestDetails(...): void,
  clearBooking(): void
}
```
Used to pass data between Guest Details → Payment page without re-fetching.

---

## ✅ STEP 5 — API Layer Patterns

### Axios Client (client.ts)
- Base URL from `VITE_API_URL`
- Request interceptor: attaches `Authorization: Bearer <token>` from Zustand store
- Response interceptor: on 401 → call `logout()` → redirect to `/login`
- Timeout: 10 seconds

### React Query Usage Pattern
```tsx
// Always handle all three states
const { data, isLoading, isError, error } = useQuery({
  queryKey: ['properties', id],
  queryFn: () => propertiesApi.getById(id),
})

if (isLoading) return <Spinner />
if (isError)   return <ErrorBanner message={getApiError(error)} />
return <PropertyDetail data={data} />
```

### Mutation Pattern
```tsx
const mutation = useMutation({
  mutationFn: (data: FormData) => authApi.login(data.email, data.password),
  onSuccess: (data) => {
    login(data.user, data.accessToken)
    navigate('/')
  },
})
// In JSX: disabled={mutation.isPending}, show mutation.isError banner
```

---

## ✅ STEP 6 — Routing Setup

```tsx
// Lazy-load all pages (code splitting)
const LoginPage    = lazy(() => import('../features/auth/login-page'))
const SearchPage   = lazy(() => import('../features/search/search-page'))
// ...etc

// ProtectedRoute wrapper
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated())
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}
```

Wrap entire router in `<Suspense fallback={<Spinner />}>`.

---

## ✅ STEP 7 — Reusable UI Components to Build

| Component | Props | Notes |
|-----------|-------|-------|
| `Button` | variant, disabled, onClick, children | primary / secondary / danger variants |
| `Input` | register (RHF), error, placeholder, type | wraps label + error message |
| `Spinner` | size? | centered loading indicator |
| `ErrorBanner` | message | red alert box |
| `Badge` | status | color-coded booking status chips |
| `PropertyCard` | property | image, name, city, price, rating |
| `PageWrapper` | title, children | consistent max-width + padding |
| `Header` | — | logo, nav links, user menu / logout |

---

## 🔴 ADVANCED TASKS (Do after MVP works)

### A. Date Picker Component
Install `react-day-picker` or `@mantine/dates`. Key rules:
- `checkin` must be today or later
- `checkout` must be at least 1 day after `checkin`
- Disable dates that are fully blocked (fetch availability from API)
- Show a loading skeleton while availability loads

### B. Partner Onboarding Wizard (6 Steps)
```
Step 1 → Property basics (name, category, description)
Step 2 → Address & location (with map pin picker — use Google Maps or Leaflet)
Step 3 → Star rating + amenities (multi-select checkboxes from preset list)
Step 4 → Add room types (repeatable form rows)
Step 5 → Set availability (bulk-open next 90 days + allow blocking specific dates)
Step 6 → Review & publish (summary card + submit to ACTIVE)
```
Store step progress in component state. Auto-save to `/api/properties` on each step.

### C. Availability Calendar (Partner)
Build a calendar grid where each cell is a date. Partners click to toggle `isBlocked`. Batch update via `PATCH /api/properties/:id/availability` with date ranges.

### D. Search with Filters
Add filter sidebar: price range (slider), star rating (checkbox), amenities (multi-select), property type (hotel/hostel/etc). All filters → query params → `useQuery` revalidates automatically.

### E. Infinite Scroll on Search Results
Replace pagination with `useInfiniteQuery` from React Query. Load next page when user scrolls to bottom (IntersectionObserver).

### F. Booking Confirmation Email Simulation
After successful booking, show a large confirmation modal with:
- Confirmation Number (copyable)
- 4-digit PIN
- Property name, dates, total price
- "Save as PDF" button (window.print() styled)

### G. i18n Setup (Phase 2)
`VITE_ENV` flag already in env. Use `react-i18next`. Start with English only, add Gujarati/Hindi later. All user-visible strings must go through `t('key')` from day one.

### H. Error Boundary
Wrap `<AppRouter>` in an `<ErrorBoundary>` component that catches render errors and shows a friendly fallback instead of a blank screen.

### I. Optimistic UI for Cancellation
When user cancels a booking, update the list optimistically before the API confirms:
```ts
useMutation({
  onMutate: async (bookingId) => {
    await queryClient.cancelQueries(['my-bookings'])
    queryClient.setQueryData(['my-bookings'], old =>
      old.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b)
    )
  },
  onError: () => queryClient.invalidateQueries(['my-bookings']),
})
```

---

## 🚫 CRITICAL RULES
- Zod schema on every form with `zodResolver` — no submit without client-side validation.
- Never store `accessToken` in `localStorage` — Zustand persist uses `sessionStorage` or memory.
- `getApiError(error)` everywhere — never display raw error objects.
- All filenames → `kebab-case`; all component/class names → `PascalCase`.
- Escape all user-generated content before rendering (React does this by default — never use `dangerouslySetInnerHTML`).
- DEV-only UI (payment failure toggle) must be wrapped in `import.meta.env.DEV` guards.
