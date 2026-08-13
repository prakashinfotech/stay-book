<!-- e:\Projects\POC\stay-book\README.md -->
# 🏨 StayBook — E-Commerce Stay Booking Platform

[![Status](https://img.shields.io/badge/Status-Active_Development-yellow)](Documentation/Claude_web/final_documentation.md)
[![Server](https://img.shields.io/badge/Server-Node.js_%2B_Express_%2B_Prisma-339933)](server)
[![Web Client](https://img.shields.io/badge/Web-React_18_%2B_Vite_%2B_TS-61DAFB)](client)
[![Mobile App](https://img.shields.io/badge/Mobile-Flutter_3.9.2_%2B_BLoC-02569B)](flutter)
[![Database](https://img.shields.io/badge/Database-PostgreSQL_15%2B-336791)](server/prisma)
[![Git Repo](https://img.shields.io/badge/Git-prakashinfotech%2Fstay--book-black)](https://github.com/prakashinfotech/stay-book.git)

**StayBook** is a full-featured Booking.com-style hotel and accommodation booking platform. It features three independently deployable components: a **Node.js REST API**, a **React Web Client**, and a **Flutter Mobile App**, all backed by PostgreSQL, Prisma ORM, and JWT authentication with email OTP verification. The system delivers an end-to-end customer booking journey, partner KYC/onboarding & listing management, and administrator controls.

> 🚧 This repository is actively developed as a production-grade multi-platform MVP. See [`Documentation/Claude_web/final_documentation.md`](Documentation/Claude_web/final_documentation.md) for full project specs.

---

## 🏗️ Architecture Overview

Built as a **Router → Middleware → Controller → Service → Repository → Prisma ORM** layered REST API behind a feature-driven React SPA and a Clean Architecture Flutter app. Concurrency for room reservations is managed via 15-minute TTL `availability_holds` with automated background garbage collection, and confirmed bookings are processed within atomic Prisma database transactions.

```mermaid
graph TD
    subgraph "Clients"
        Web["React Web App (React 18 + Vite + TS)"] --> WebStore["Zustand State (Persisted Auth & Checkout)"]
        WebStore --> WebAxios["Axios + JWT Interceptor"]
        
        Mobile["Flutter Mobile App (Flutter 3.9.2 + Dart)"] --> MobileBloc["BLoC / Cubit (Clean Architecture)"]
        MobileBloc --> MobileStorage["Flutter SecureStorage & Dio Client"]
    end

    subgraph "Backend API (Node.js + Express + TS)"
        Router["Express Router (/api/v1)"] --> Middleware["Zod Validation & JWT Auth Guard"]
        Middleware --> Controllers["Controllers"]
        Controllers --> Services["Business Services"]
        Services --> Repos["Repository Layer"]
        Repos --> Prisma["Prisma ORM 5"]
        Services --> HoldGC["Hold GC Job (15-min TTL Sweep)"]
    end

    subgraph "Infrastructure & Data"
        DB[("PostgreSQL 15+ (tsvector + Triggers)")]
        MediaProxy["Media Proxy Router"]
        Email["Email / OTP Service"]
        Payment["Payment Gateway (Simulation / Razorpay)"]
    end

    WebAxios -.->|HTTP REST| Router
    MobileStorage -.->|HTTP REST| Router
    Prisma --> DB
    HoldGC --> DB
    Services -.-> MediaProxy
    Services -.-> Email
    Services -.-> Payment
```

### Key Design Decisions

- **Multi-Client Unified API**: React Web SPA and Flutter Mobile App share a unified Express TypeScript REST API (`/api/v1`) with identical JWT auth and payload schemas.
- **Atomic Room Locks & Hold GC**: Temporary 15-minute slot reservations (`availability_holds`) are managed by a background sweep job, preventing double-booking before final payment.
- **Transactional Booking Confirmation**: Atomic `$transaction` in Prisma handles booking creation, availability grid locking, hold deletion, and payment audit logging.
- **Secure Dual-Token Auth + OTP**: Access tokens (1h TTL) + Refresh tokens (7d TTL) with 6-digit email OTP verification. Web uses Zustand `persist`, mobile uses `flutter_secure_storage`.
- **PostgreSQL Full-Text Search**: Optimized property search utilizing PostgreSQL `tsvector` (`search_vector` column managed via DB triggers) with fallback to `ILIKE`.
- **Partner KYC & Onboarding Workflow**: Multi-step partner legal entity setup (`partner_legal`), identity & address validation, and listing publish flow.

---

## ✨ Key Highlights

- **Complete Customer Booking Flow**: Search destination/dates → Property details & room selection → 15-min room hold → Guest details → Card payment → Confirmation with PIN & PDF export.
- **Cross-Platform Parity**: Full-featured React 18 web application alongside a native-performance Flutter 3.9.2 mobile application for iOS & Android.
- **Partner Portal & KYC**: Partner dashboard to manage properties, room types, rate plans, availability grids, KYC verification, and booking approval/decline requests.
- **Clean Architecture & State Management**: Zustand with persistence on Web; Clean Architecture (Domain, Data, Presentation) + BLoC/Cubit pattern on Mobile.
- **Automated Input Validation**: Zero unvalidated API requests — end-to-end Zod schemas on server and client, and Dart form validators on mobile.
- **Media Optimization Proxy**: Centralized media router for proxying, caching, and compressing external property image assets.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Backend API** | Node.js, Express, TypeScript, Prisma ORM 5, Zod, Winston Logger, Morgan, Nodemailer |
| **Web Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Query, React Router v6, React Hook Form + Zod |
| **Mobile App** | Flutter 3.9.2, Dart, BLoC / Cubit, Clean Architecture, GetIt (DI), Dio, go_router, flutter_secure_storage |
| **Database** | PostgreSQL 15+ (with `tsvector` full-text search triggers) |
| **Authentication** | JWT (HS256 short-lived access + refresh rotation), BCrypt (cost 12), 6-digit Email OTP |
| **Monorepo Tools** | Turborepo, npm workspaces |
| **Testing** | Jest / Vitest (server/client), Flutter Test + `flutter analyze` (mobile) |

---

## 📁 Repository Directory Structure

```text
stay-book/
├── .claude/                   # Claude Code configs & rules
├── Documentation/             # Architecture, design docs, final documentation
│   ├── Claude_web/            # Deep-dive specs & PRD (final_documentation.md, fullstack-guide.md)
│   └── Doc/                   # Design specifications
├── client/                    # React 18 + Vite + TypeScript Web Application
│   ├── src/
│   │   ├── api/               # Axios instances & endpoint modules
│   │   ├── components/        # Layout (Header, PageWrapper) & UI primitives (Button, Input, Badge, StarRating)
│   │   ├── features/          # Auth, Search, Property Detail, Checkout, Trips, Partner
│   │   ├── store/             # Zustand stores (auth.store, checkout.store)
│   │   └── router/            # React Router v6 configuration & guards
├── server/                    # Express + TypeScript + Prisma REST API
│   ├── prisma/                # Schema definitions (schema.prisma), migrations & seed script
│   └── src/
│       ├── common/            # Errors, auth/roles/validate middleware, utils
│       ├── modules/           # Auth, Users, Properties, Search, Bookings, Partners, Media
│       └── jobs/              # Availability hold Garbage Collection (hold-gc.job.ts)
├── flutter/                   # Flutter 3.9.2 Mobile Application (iOS & Android)
│   ├── lib/
│   │   ├── core/              # Network (Dio), theme, router (go_router), utils
│   │   ├── features/          # Auth, Search, Property, Checkout, Trips (Clean Architecture + BLoC)
│   │   ├── app.dart           # App root & theme provider
│   │   └── main.dart          # Entry point & Dependency Injection init
├── turbo.json                 # Turborepo build & dev pipeline configuration
├── package.json               # Root monorepo workspace definition
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org/) & npm 10+
- [PostgreSQL 15+](https://www.postgresql.org/) running locally on `localhost:5432`
- [Flutter SDK 3.9.2+](https://docs.flutter.dev/) (for running the mobile app)
- Android Emulator / iOS Simulator (optional for mobile dev)

### 1. Clone Repository

```bash
git clone https://github.com/prakashinfotech/stay-book.git
cd stay-book
```

### 2. Backend Server Setup

```bash
cd server

# Copy environment variables template and configure secrets
cp .env.example .env

# Install dependencies & generate Prisma client
npm install
npm run db:generate

# Run database migrations & seed test accounts
npm run db:migrate
npm run db:seed

# Start backend dev server (starts on http://localhost:3001)
npm run dev
```

### 3. Web Client Setup (New Terminal)

```bash
cd client

# Install dependencies
npm install

# Start Vite development server (starts on http://localhost:3000)
npm run dev
```

### 4. Flutter Mobile App Setup (New Terminal)

```bash
cd flutter

# Fetch Dart dependencies
flutter pub get

# Run on emulator/device (connects to http://10.0.2.2:3001 for Android or http://localhost:3001 for iOS)
flutter run
```

---

## 🔑 Environment Variables Reference

### Backend (`server/.env`)

```env
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:3000

DATABASE_URL=postgresql://postgres:1234@localhost:5432/booking_dev?schema=public

JWT_SECRET=your_super_secret_jwt_key_min_20_chars
JWT_EXPIRATION=1h
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_20_chars

SIMULATE_PAYMENT_FAILURE=false

# Optional in Dev / Required in Production
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_SQS_QUEUE_URL=
```

### Web Client (`client/.env`)

```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_WS_URL=ws://localhost:3001
VITE_ENV=development
```

---

## 🔐 Seeded Test Accounts

Running `npm run db:seed` inside `server/` populates your local PostgreSQL database with pre-configured accounts:

| Role | Email | Password | Allowed Actions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@app.com` | `Admin@123` | Platform oversight, system management |
| **PARTNER** | `partner@app.com` | `Partner@123` | Property listings CRUD, KYC submission, booking approvals |
| **CUSTOMER** | `customer@app.com` | `Customer@123` | Search properties, place 15-min holds, complete bookings |

> ℹ️ **Dev OTP**: In development mode, email OTP codes are output directly to the backend terminal log as `[DEV] OTP email to <email>: <code>`.

---

## 🌐 Key API Endpoints (`/api/v1`)

| Module | Method | Route Path | Auth Guard | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/auth/register` | Public | Create account & dispatch OTP |
| **Auth** | `POST` | `/auth/verify-otp` | Public | Validate OTP → returns JWT access token |
| **Auth** | `POST` | `/auth/login` | Public | Authenticate → returns access & refresh tokens |
| **Auth** | `POST` | `/auth/refresh` | Public | Rotate expired access token |
| **Search** | `GET` | `/search?destination=&checkin=&checkout=` | Public | Full-text & availability search with filtering |
| **Search** | `GET` | `/search/suggestions?q=` | Public | City autocomplete (`ILIKE`) |
| **Properties**| `GET` | `/properties/:id` | Public | Property overview, room types & rate plans |
| **Properties**| `POST` | `/properties` | Partner/Admin | Create new draft listing |
| **Properties**| `POST` | `/properties/:id/publish` | Owner | Publish listing (DRAFT → ACTIVE) |
| **Partners** | `POST` | `/partners/kyc` | Partner | Submit partner identity & address KYC |
| **Bookings** | `POST` | `/bookings/hold` | Customer | Lock room availability for 15 minutes |
| **Bookings** | `POST` | `/bookings` | Customer | Confirm atomic booking transaction |
| **Bookings** | `GET` | `/bookings` | Customer | Fetch user's booking history |
| **Bookings** | `POST` | `/bookings/:id/cancel` | Customer | Cancel booking & unlock availability grid |
| **Media** | `GET` | `/media/proxy?url=` | Public | Optimized image proxy & caching |

---

## 🧪 Testing & Verification

### Monorepo Commands (Root)
```bash
npm run dev        # Run server + client in parallel via Turborepo
npm run build      # Build all workspaces
npm run lint       # Run linters across workspaces
```

### Backend (`server/`)
```bash
npm run lint       # ESLint check
npm run build      # Compile TypeScript → dist/
npm run db:studio  # Open Prisma Studio UI at http://localhost:5555
```

### Web Client (`client/`)
```bash
npm run lint       # ESLint check
npm run build      # TypeScript compile & Vite production bundle
```

### Mobile App (`flutter/`)
```bash
flutter analyze    # Static analysis (must maintain 0 warnings/errors)
flutter test       # Run unit & widget tests
```

---

## 🔀 Branching & Development Workflow

1. Sync local develop branch: `git checkout develop && git pull`
2. Create feature branch: `git checkout -b feat/<feature-name>`
3. Ensure linting and build verification pass locally.
4. Submit PR to `develop` branch for review.

---

## 📚 Documentation Matrix

| Document | Location | Focus Area |
| :--- | :--- | :--- |
| **Master Documentation** | [`Documentation/Claude_web/final_documentation.md`](Documentation/Claude_web/final_documentation.md) | End-to-end system design, DB schema, flow charts & feature specs |
| **Fullstack Setup Guide** | [`Documentation/Claude_web/fullstack-guide.md`](Documentation/Claude_web/fullstack-guide.md) | Step-by-step developer environment setup |
| **Server Reference** | [`server/CLAUDE.md`](server/CLAUDE.md) | API architecture, Express modules, Prisma models, hold GC job |
| **Web Client Reference** | [`client/CLAUDE.md`](client/CLAUDE.md) | Component tree, Zustand stores, RHF forms, design tokens |
| **Mobile App Reference** | [`flutter/CLAUDE.md`](flutter/CLAUDE.md) | Clean Architecture layers, BLoC events/states, router guards |

---

## ⚠️ Critical Security & Development Rules

- **Never Commit Secrets**: Do not commit real `.env` or credentials. All secret templates use `.env.example`.
- **Pre-API Validation**: Client applications must validate form data via Zod/validators prior to dispatching network requests.
- **Sanitized Logging**: Never log passwords, raw OTP codes, full JWT tokens, or credit card numbers.
- **Card Security**: Only store `card_last_four` — raw card data must never be saved to the database.
- **Flutter Quality Guard**: `flutter analyze` must pass with **0 errors** before pushing mobile changes.

## 📄 License

Proprietary — All rights reserved.
