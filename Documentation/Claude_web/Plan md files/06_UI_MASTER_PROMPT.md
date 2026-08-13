# 🎨 MASTER UI PROMPT
## Booking.com Clone — React 18 + Vite + TypeScript
### Paste this entire prompt into Claude when building any UI component or page

---

## 🧠 CONTEXT — READ FIRST

You are building the frontend (`client/`) of a **Booking.com clone** called **StayBook**.

**Reference site:** https://www.booking.com/
Study Booking.com's visual language closely:
- Deep navy/blue header (`#003580`) with white text
- Bright yellow CTA buttons (`#FFCC00` / `#F5A623`)
- White card surfaces with subtle `box-shadow`
- Star ratings in yellow (`#FDC702`)
- Clean sans-serif typography (use `Inter` or `system-ui`)
- Property card image-first layout with price anchored bottom-right
- Sticky header on scroll
- Search bar as a prominent hero element on the homepage

**Stack already installed:**
```
React 18, Vite, TypeScript, React Router DOM v6, TanStack React Query,
Zustand, Axios, React Hook Form + Zod + @hookform/resolvers,
Tailwind CSS (or plain CSS modules — your choice, be consistent)
```

**Design system tokens to use everywhere:**
```css
--color-primary:      #003580;   /* Booking.com navy */
--color-primary-dark: #00224F;
--color-accent:       #FFCC00;   /* Yellow CTA */
--color-accent-hover: #E6B800;
--color-surface:      #FFFFFF;
--color-bg:           #F2F6FA;   /* Page background */
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

## 📁 FOLDER STRUCTURE (already defined — follow exactly)

```
client/src/
├── api/
│   ├── client.ts              ← Axios singleton (JWT interceptor, 401 redirect)
│   ├── auth.api.ts            ← register(), verifyOtp(), login()
│   ├── properties.api.ts      ← search(), getById()
│   ├── bookings.api.ts        ← createHold(), createBooking(), getMyBookings(), cancel()
│   └── brightdata.api.ts      ← searchHotels(), getHotelDetail()
├── components/
│   ├── ui/
│   │   ├── Button.tsx         ← variant: primary | secondary | danger | ghost
│   │   ├── Input.tsx          ← RHF register prop + label + error message
│   │   ├── Spinner.tsx        ← centered loader
│   │   ├── ErrorBanner.tsx    ← red alert
│   │   ├── Badge.tsx          ← booking status chip (color-coded)
│   │   ├── StarRating.tsx     ← filled/empty stars in --color-star
│   │   └── Modal.tsx          ← accessible dialog wrapper
│   └── layout/
│       ├── Header.tsx         ← sticky nav, logo, user menu
│       ├── Footer.tsx         ← links, copyright
│       └── PageWrapper.tsx    ← max-width container + padding
├── features/
│   ├── auth/
│   │   ├── login-page.tsx
│   │   ├── register-page.tsx
│   │   └── otp-page.tsx
│   ├── search/
│   │   ├── search-page.tsx    ← hero + search bar + hybrid results grid
│   │   ├── property-card.tsx  ← partner listing card
│   │   └── external-hotel-card.tsx ← Bright Data / Booking.com result card
│   ├── property/
│   │   └── property-detail-page.tsx
│   ├── checkout/
│   │   ├── guest-details-page.tsx
│   │   └── payment-page.tsx
│   ├── booking/
│   │   └── confirmation-page.tsx
│   ├── trips/
│   │   └── trips-page.tsx
│   └── partner/
│       ├── dashboard-page.tsx
│       ├── onboarding-wizard.tsx  ← 6-step wizard
│       └── availability-manager.tsx
├── hooks/
│   └── use-booking-store.ts   ← Zustand: holdId, checkin, checkout, guestDetails
├── store/
│   └── auth.store.ts          ← Zustand: user, accessToken, login(), logout()
├── router/
│   └── index.tsx              ← lazy routes + ProtectedRoute
├── types/
│   └── index.ts               ← Property, RoomType, Booking, User, BDHotelDetail
└── utils/
    ├── format.ts              ← formatPrice(), formatDate(), formatNights()
    └── error.ts               ← getApiError(), getApiErrorCode()
```

---

## 🗺️ ALL PAGES + ROUTES

| Route | Component | Auth | Description |
|-------|-----------|------|-------------|
| `/` | `SearchPage` | Public | Hero + search bar + hybrid hotel results |
| `/login` | `LoginPage` | Public | Email + password form |
| `/register` | `RegisterPage` | Public | Email + password + role selector |
| `/verify-otp` | `OtpPage` | Public | 6-digit OTP input + resend |
| `/property/:id` | `PropertyDetailPage` | Public | Rooms, date picker, Reserve CTA |
| `/checkout/details` | `GuestDetailsPage` | 🔒 Customer | Name, email, phone, special requests |
| `/checkout/payment` | `PaymentPage` | 🔒 Customer | Dummy card form + pay button |
| `/booking/confirmation/:id` | `ConfirmationPage` | 🔒 Customer | Confirmation # + PIN + summary |
| `/trips` | `TripsPage` | 🔒 Customer | Past + upcoming bookings, cancel action |
| `/partner/dashboard` | `PartnerDashboard` | 🔒 Partner | Listings overview + stats |
| `/partner/onboard` | `OnboardingWizard` | 🔒 Partner | 6-step property creation wizard |
| `/partner/listings/:id` | `ListingManager` | 🔒 Partner | Edit property + room types |
| `/partner/listings/:id/availability` | `AvailabilityManager` | 🔒 Partner | Calendar block/unblock |

---

## 🖥️ PAGE-BY-PAGE UI REQUIREMENTS

---

### PAGE 1 — Search / Home (`/`)

**Visual reference:** Booking.com homepage hero section + property results grid.

**Hero Section:**
- Full-width deep navy (`--color-primary`) background
- Logo top-left: "✈ StayBook" in white, bold
- Tagline: *"Find your perfect stay"* in white, 28px
- Search bar — a single horizontal card (white background, shadow) containing:
  - 📍 **Destination** text input (placeholder: "Where are you going?")
  - 📅 **Check-in date** date picker
  - 📅 **Check-out date** date picker
  - 👥 **Adults** number stepper (min 1, max 20)
  - 🔵 **Search button** in `--color-accent` (yellow), bold, "Search" text
- Below hero: category filter chips — Hotel · Resort · Villa · Heritage · Hostel (horizontal scroll on mobile)

**Results Section:**
- Two clearly labelled sections separated by a divider:
  1. **"Partner Hotels"** — cards from your local DB (`propertiesApi.search`)
  2. **"More Hotels on Booking.com"** — cards from Bright Data (`brightDataApi.search`)
- Each section shows a count badge: e.g. "4 properties"
- Show `<Spinner />` while loading, `<ErrorBanner />` on error
- Empty state: illustrated empty state with "No hotels found. Try a different city."

**Filter Sidebar (desktop, collapsible on mobile):**
- Price range slider (₹0 – ₹50,000)
- Star rating checkboxes (★ through ★★★★★)
- Property type checkboxes (Hotel, Resort, Villa, Heritage, Hostel)
- Amenities multi-select (WiFi, Pool, Spa, Gym, Parking, Restaurant)
- "Clear filters" link

---

### PAGE 2 — Property Card (`components/features/search/property-card.tsx`)

**Visual reference:** Booking.com search result card.

```
┌─────────────────────────────────────────────┐
│  [Property Image — 280px tall, object-cover] │
│  ★ FEATURED (badge, top-left on image)       │
├─────────────────────────────────────────────┤
│  Grand Palace Hotel              ★★★★★       │
│  📍 Ahmedabad, Gujarat                       │
│  Pool · Spa · Gym · WiFi  (amenity chips)    │
│                                              │
│  "Luxurious 5-star in the heart of..."       │
│                             ₹8,500 /night    │
│                          [Reserve →]         │
└─────────────────────────────────────────────┘
```

- Card hover: lift shadow (`--shadow-card-hover`) + slight scale (1.01)
- Amenity chips: max 4 shown, "+N more" overflow badge
- Price: right-aligned, bold, `--color-primary`, `/night` in muted
- Category badge (RESORT / VILLA / HERITAGE) on image top-right
- `<StarRating stars={property.starRating} />` inline with hotel name
- Click anywhere → navigate to `/property/:id`

---

### PAGE 3 — Property Detail (`/property/:id`)

**Visual reference:** Booking.com hotel detail page.

**Layout (desktop: sidebar + main, mobile: stacked):**

**Left / Main (60%):**
- Image gallery — large hero image + 4 thumbnails in a grid
- Hotel name, star rating, location with map pin icon
- Amenity grid — icons + labels in a 3-column grid
- Description (expandable — "Show more" after 3 lines)
- Review score card: large number (e.g. 9.2), "Excellent", review count

**Right / Sidebar (40%) — Booking Panel:**
```
┌──────────────────────────┐
│  Select your dates        │
│  ┌──────────┬──────────┐ │
│  │ Check-in │Check-out │ │
│  └──────────┴──────────┘ │
│  Adults: [−] 2 [+]       │
│                           │
│  ── Available Rooms ──   │
│  ┌─────────────────────┐ │
│  │ Deluxe Double        │ │
│  │ Max 2 guests · ♟ 2  │ │
│  │ Free cancellation    │ │
│  │            ₹8,500    │ │
│  │       [Reserve →]    │ │
│  └─────────────────────┘ │
│  (repeat per room type)   │
└──────────────────────────┘
```
- "Reserve" triggers `POST /api/bookings/hold` → on success navigate to `/checkout/details`
- Show "Only 2 left!" warning if `totalRooms ≤ 2`
- Cancellation policy badge: green FREE / yellow MODERATE / red STRICT

---

### PAGE 4 — Guest Details (`/checkout/details`)

**Visual reference:** Booking.com checkout step 1.

- Progress stepper at top: **① Guest Details** → ② Payment → ③ Confirmation
- Booking summary card (right sidebar on desktop):
  - Property name, room type, dates, nights, total price
  - Editable via "Change" link → back to property detail
- Form fields (react-hook-form + Zod):
  - First name + Last name (side-by-side)
  - Email address
  - Phone number (with +91 prefix selector)
  - Special requests (textarea, optional)
- "Continue to Payment →" button (yellow, full-width on mobile)
- All fields validated on submit; inline error messages below each field

---

### PAGE 5 — Payment (`/checkout/payment`)

**Visual reference:** Booking.com payment step.

- Same progress stepper: ① Guest Details → **② Payment** → ③ Confirmation
- Booking summary card (right sidebar) — same as guest details page
- Dummy card form:
  - Card number input (format: XXXX XXXX XXXX XXXX, mask with spaces)
  - Cardholder name
  - Expiry (MM/YY) + CVV side-by-side
  - Card type auto-detected (Visa/MC/RuPay icon appears)
- **DEV-only toggle** (only when `import.meta.env.DEV === true`):
  - Checkbox: "☑ Simulate payment failure" — wraps in a dashed red border
- "Pay ₹X,XXX →" button (yellow, large, bold)
- Security note: "🔒 Your payment info is processed securely (demo only)"
- Spinner + disabled state while payment is processing

---

### PAGE 6 — Confirmation (`/booking/confirmation/:id`)

**Visual reference:** Booking.com booking confirmation page.

```
┌──────────────────────────────────────────┐
│  ✅  Booking Confirmed!                   │
│  Confirmation No: STB-A3K2-XP9Q  [Copy] │
│  Your PIN: 4821                          │
├──────────────────────────────────────────┤
│  Grand Palace Hotel ★★★★★               │
│  📅 Jun 10 → Jun 12  (2 nights)         │
│  👤 Amit Verma · 2 adults               │
│  🛏  Deluxe Double                       │
│  💰 ₹17,000 total                       │
├──────────────────────────────────────────┤
│  [🖨 Save as PDF]    [View My Trips →]   │
└──────────────────────────────────────────┘
```

- Big green checkmark icon at top
- Confetti animation on mount (CSS keyframes, no library needed)
- Copy button for confirmation number (uses `navigator.clipboard.writeText`)
- "Save as PDF" → `window.print()` with a print-only CSS style
- "What's next" section with tips (check-in time, ID required, etc.)

---

### PAGE 7 — My Trips (`/trips`)

**Visual reference:** Booking.com "Bookings" page.

- Tab bar: **Upcoming** | **Past** | **Cancelled**
- Each booking card:
```
┌──────────────────────────────────────────┐
│ [Property thumb]  Grand Palace Hotel     │
│                   Ahmedabad · ★★★★★      │
│                   Jun 10 – Jun 12        │
│                   Deluxe Double · 2 pax  │
│                   ₹17,000               │
│           [CONFIRMED ●]  [Cancel]        │
└──────────────────────────────────────────┘
```
- Status badges: CONFIRMED (green) / CANCELLED (red) / PENDING (yellow)
- "Cancel" only visible on CONFIRMED + future-date bookings
- Cancel flow: confirm modal → optimistic UI update → API call
- Empty state per tab: e.g. "No upcoming trips. Start searching →"

---

### PAGE 8 — Auth Pages (Login / Register / OTP)

**Visual reference:** Booking.com sign-in page.

**Login (`/login`):**
- Centered card (max-width: 440px), white background, shadow
- Logo at top
- Email + Password fields (show/hide password toggle)
- "Sign In" button (navy, full-width)
- "Forgot password?" link (grey, right-aligned)
- Divider + "Don't have an account? Register →"

**Register (`/register`):**
- Same card layout
- Full name + Email + Password + Confirm Password
- Role selector: radio buttons styled as cards
  - 🏨 I want to book hotels (CUSTOMER)
  - 🏢 I want to list my property (PARTNER)
- "Create Account" button
- Terms of service checkbox (required)

**OTP Verify (`/verify-otp`):**
- 6 separate single-character inputs (auto-advance, backspace-aware)
- 10-minute countdown timer
- "Resend OTP" button (disabled until timer expires)
- Auto-submit when all 6 digits filled

---

### PAGE 9 — Partner Dashboard (`/partner/dashboard`)

**Visual reference:** Booking.com Extranet dashboard.

- Welcome header: "Good morning, Rajesh 👋"
- Stats row (4 cards):
  - Total listings | Active bookings | This month revenue | Avg rating
- "My Properties" table:
  - Thumbnail | Name | Category | Status | Rooms | Bookings | Actions
  - Status toggle: ACTIVE / DRAFT chip (clickable)
  - Actions: Edit · Manage Availability · View bookings
- "Recent Bookings" mini-table (last 5)
- "+ Add New Property" button → `/partner/onboard`

---

### PAGE 10 — Partner Onboarding Wizard (`/partner/onboard`)

**Visual reference:** Booking.com property registration wizard.

**Stepper header (always visible):**
```
① Basics → ② Location → ③ Amenities → ④ Rooms → ⑤ Availability → ⑥ Review
```

**Step 1 — Basics:**
- Property name, category (card selector with icons), description (rich textarea)

**Step 2 — Location:**
- Address fields (address line, city, state, country, pincode)
- Latitude + Longitude (optional — auto-fill via city name lookup)

**Step 3 — Amenities:**
- Grid of amenity checkboxes with icons:
  WiFi · Pool · Spa · Gym · Restaurant · Bar · Parking · AC · Beach Access · Mountain View · Heater · Bonfire · Trekking · Conference Room · Kitchen

**Step 4 — Room Types:**
- Repeatable form rows (Add Room button adds a new row):
  - Name | Max occupancy | Price/night | Cancellation policy | Total rooms
  - Remove row button

**Step 5 — Availability:**
- "Open next 90 days" bulk toggle (default ON)
- Manual date blocking: calendar UI to block specific dates

**Step 6 — Review & Publish:**
- Full summary of all entered data
- "← Edit" per section
- "Publish Property" button → PATCH status to ACTIVE

---

## 🧩 REUSABLE COMPONENT SPECS

### `Button.tsx`
```tsx
// Props: variant ('primary'|'secondary'|'danger'|'ghost'), size ('sm'|'md'|'lg'),
//        disabled, loading (shows spinner), fullWidth, onClick, children
// Primary: bg --color-primary, white text
// Accent:  bg --color-accent, dark text  (use for main CTAs)
// Danger:  bg --color-danger, white text
// Ghost:   transparent, border, --color-primary text
```

### `Input.tsx`
```tsx
// Props: label, register (RHF), error (string), type, placeholder, suffix (e.g. icon)
// Shows red border + error message below on invalid
// Focus: 2px solid --color-primary outline
```

### `Badge.tsx`
```tsx
// CONFIRMED → green bg, white text
// CANCELLED → red bg, white text
// PENDING   → yellow bg, dark text
// ACTIVE    → blue bg, white text
// DRAFT     → grey bg, dark text
```

### `PropertyCard.tsx`
```tsx
// Props: property (Property | BDHotelDetail), variant ('partner'|'external')
// external variant shows "via Booking.com" label + link-out icon
// partner variant shows internal link to /property/:id
```

### `StarRating.tsx`
```tsx
// Props: stars (0–5), size ('sm'|'md'|'lg'), showNumber (bool)
// Filled stars: --color-star (#FDC702)
// Empty stars: --color-border
```

### `Header.tsx`
```tsx
// Sticky, z-index: 100
// Left:   Logo "✈ StayBook" → links to /
// Center: Nav links (hidden on mobile → hamburger menu)
//         Search · My Trips (customer) · Dashboard (partner)
// Right:  If logged in: Avatar + dropdown (Profile · My Trips · Sign out)
//         If not: [Login] [Register] buttons
// Mobile: hamburger → slide-in drawer
```

---

## ⚙️ STATE + DATA PATTERNS

### Auth Store (Zustand)
```ts
// store/auth.store.ts
interface AuthState {
  user:         User | null
  accessToken:  string | null
  login:        (user: User, token: string) => void
  logout:       () => void
  isAuthenticated: () => boolean
  isPartner:    () => boolean
  isAdmin:      () => boolean
}
// Persist in sessionStorage (NOT localStorage)
```

### Booking Store (Zustand)
```ts
// hooks/use-booking-store.ts
interface BookingState {
  holdId:       string | null
  roomTypeId:   string | null
  propertyId:   string | null
  checkin:      string | null   // YYYY-MM-DD
  checkout:     string | null
  adults:       number
  guestDetails: GuestDetails | null
  setHold:      (holdId, roomTypeId, propertyId, checkin, checkout, adults) => void
  setGuestDetails: (details: GuestDetails) => void
  clearBooking: () => void
}
// NOT persisted — clears on tab close
```

### React Query Rules
```tsx
// Always: staleTime for expensive calls
// Always: handle isLoading, isError, data
// BD hotel search: staleTime: 5 * 60 * 1000  (5 min — quota-sensitive)
// Property detail: staleTime: 2 * 60 * 1000
// My bookings:     staleTime: 30 * 1000
```

---

## 🎨 VISUAL DESIGN RULES — FOLLOW STRICTLY

1. **No Bootstrap, no MUI, no Ant Design.** Use Tailwind utility classes OR CSS Modules — pick one and be consistent throughout the whole codebase.

2. **Typography scale:**
   - Page title: 28px, bold, `--color-text`
   - Section heading: 20px, semibold
   - Card title: 16px, semibold
   - Body: 14px, regular, `--color-text`
   - Muted/label: 12px, `--color-muted`

3. **Spacing:** Use 4px base grid. Common: 8px, 12px, 16px, 24px, 32px, 48px.

4. **Cards:** Always `border-radius: --radius-card (12px)`, `box-shadow: --shadow-card`, white background. Hover: `--shadow-card-hover`.

5. **Buttons:** CTA (Reserve, Pay, Search) → yellow accent. Nav/secondary → navy primary. Destructive → red danger. Min height: 44px (mobile tap target).

6. **Images:** Always `object-fit: cover`. Use `loading="lazy"`. Show placeholder skeleton while loading (`background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)`).

7. **Mobile-first:** Every component built mobile-first, then enhanced with `md:` / `lg:` breakpoints. Minimum tested width: 375px.

8. **Loading states:** Every async operation shows either a `<Spinner />` (inline) or skeleton loader (full page). Never blank screen.

9. **Empty states:** Every list has an illustrated or icon-based empty state — never just blank space.

10. **Accessibility:** All interactive elements have `aria-label` or visible label. Focus rings always visible. Color alone never conveys meaning.

---

## 🚫 HARD RULES — NEVER VIOLATE

- Never use `localStorage` for `accessToken` — use Zustand with `sessionStorage` persist
- Never use `dangerouslySetInnerHTML`
- Never call the API without Zod validation first (client-side, before submit)
- Never show raw error objects to users — always `getApiError(error)`
- Never hardcode the API URL — always use `import.meta.env.VITE_API_URL`
- DEV-only UI (payment failure toggle) must be wrapped in `import.meta.env.DEV` guard
- Never import anything from `server/` into `client/`
- File names: `kebab-case.tsx` · Component names: `PascalCase`
- Tailwind class ordering: layout → spacing → typography → color → effects

---

## 💡 HOW TO USE THIS PROMPT

When asking Claude to build a specific page or component, paste this full prompt and then add:

```
Now build: [PAGE NAME]
File path: client/src/features/[path]/[component-name].tsx

Additional context:
- [Any specific API shape or props you want to pass]
- [Any specific behavior not covered above]
```

**Examples:**

```
Now build: PropertyCard component
File path: client/src/features/search/property-card.tsx
Additional context:
- property prop can be either Property (from DB) or BDHotelDetail (from Bright Data)
- Show a "Booking.com" badge on external cards
- All prices in INR format: ₹8,500
```

```
Now build: Search Page
File path: client/src/features/search/search-page.tsx
Additional context:
- Hero section must match Booking.com's navy background exactly
- Category chips: Hotel, Resort, Villa, Heritage, Hostel — filter the results grid
- Hybrid results: partnerListings on top, externalHotels below with divider
```

```
Now build: OTP Page
File path: client/src/features/auth/otp-page.tsx
Additional context:
- 6 individual input boxes (1 digit each)
- Auto-advance to next box on input
- Backspace clears current and moves to previous
- Auto-submit when all 6 filled
- 10-minute countdown, resend button enabled only after timer hits 0
```
