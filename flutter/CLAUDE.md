# Flutter — CLAUDE.md
> Flutter 3.9.2 + Dart + Clean Architecture + BLoC · Booking.com Clone MVP · Customer App Only

---

## Quick Start

```bash
cd flutter
flutter pub get
flutter run                    # Android emulator or connected device
```

Calls same backend: `http://10.0.2.2:3001/api/v1` (Android emulator) or `http://localhost:3001/api/v1` (iOS).

---

## Key Commands

```bash
flutter pub get               # install dependencies
flutter analyze               # static analysis (must have 0 errors)
flutter run                   # run on device/emulator
flutter test                  # run unit tests
flutter build apk --release   # build Android APK
flutter build ios --release   # build iOS (macOS only)
flutter pub run build_runner build --delete-conflicting-outputs  # codegen
```

---

## Architecture Layers

```
Presentation (BLoC/Cubit) → Domain (Use Cases, abstract Repos) ← Data (Models, DataSources, RepoImpl)
```

**Domain Layer**: Pure Dart, zero Flutter/Dio imports.  
**Data Layer**: Handles JSON, Dio, SecureStorage. Implements domain repository contracts.  
**Presentation Layer**: BLoC for state, Pages dispatch events, Widgets are pure view.

---

## Project Structure

```
lib/
├── main.dart                          ← DI init + runApp
├── app.dart                           ← MaterialApp.router + theme
├── injection_container.dart           ← GetIt registrations
├── core/
│   ├── constants/app_constants.dart   ← BASE_URL, timeouts
│   ├── errors/{failures,exceptions}.dart
│   ├── network/{dio_client,auth_interceptor}.dart
│   ├── theme/{app_theme,app_text_styles}.dart
│   ├── utils/{date_utils,currency_utils}.dart
│   └── router/app_router.dart         ← go_router with auth guard
└── features/
    ├── auth/                          ← splash, login, register, OTP
    ├── search/                        ← home, explore cities, search results, featured properties
    ├── property/                      ← property detail, amenities, rooms
    ├── checkout/                      ← hold, guest details, payment, confirmation
    └── trips/                         ← list bookings (3 tabs), cancel
```

---

## All 6 Phases Complete

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Core layer (theme, network, DI, router) | ✅ |
| 2 | Auth (splash, login, register, OTP, resend) | ✅ |
| 3 | Search/Home (explore cities, search, featured, filtering/sorting) | ✅ |
| 4 | Property detail (images, amenities, rooms) | ✅ |
| 5 | Checkout (hold → guest details → payment → confirmation) | ✅ |
| 6 | Trips (list, detail, cancel) | ✅ |
| 7 | Partner features (KYC, onboarding, bookings) | 🔄 In progress |

---

## Key Implementation Details

- **JWT Interceptor** (`auth_interceptor.dart`): attaches token, handles 401 refresh, rotates tokens
- **Secure Storage**: `flutter_secure_storage` for tokens (not SharedPreferences)
- **Auth Guard** (`app_router.dart`): `redirect` protects `/home`, `/checkout`, `/booking`, `/trips`
- **BLoC Pattern**: Every screen has a BLoC/Cubit; no `setState` in production pages
- **Either<Failure, T>**: `dartz` for error handling in all repositories and use cases
- **Equatable**: All events and states extend `Equatable` for equality
- **CachedNetworkImage**: All remote images cached locally
- **Search with Filtering**: Supports price/rating/amenities filtering + sorting
- **Resend OTP**: Rate-limited resend functionality on login/register pages

---

## Customer Flow

```
Splash (check token) → Login/Register/OTP → Home (search)
  → Property Detail (tap Reserve)
    → Guest Details (create hold) → Payment → Confirmation
      → Trips (list/cancel)
```

---

## Token Lifecycle

1. Register → OTP verification → return `accessToken` (no refresh)
2. Login → return `accessToken` (1h) + `refreshToken` (7d)
3. Store both in `flutter_secure_storage`
4. On 401 → auto-refresh via interceptor → retry request
5. Logout → delete both from storage

---

## Design System Colors

```
Primary:   #003580 (navy)
Accent:    #FFCC00 (yellow CTA)
Success:   #00875A (green)
Danger:    #D32F2F (red)
Background: #F2F6FA
Text:      #1A1A2E
Muted:     #6B7280
```

---

## Critical Rules

- Never run `git push`, `rm -rf` without explicit approval.
- Always ask before any git command (commit, add, reset, merge).
- `flutter analyze` must pass with 0 errors before declaring done.
- `flutter_secure_storage` for all sensitive data — never shared prefs.
- All API errors extracted from `response.data['error']['message']` or fallback to `response.data['message']`.
- No hardcoding of `kBaseUrl` — always read from `app_constants.dart`.
