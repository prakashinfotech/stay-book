Admin Panel Expansion Plan
Context
The existing admin panel has 5 read-only/minimal-write endpoints (GET /stats, GET /users, GET /properties, GET /bookings, PATCH /properties/:id/status). A full audit identified bugs in the repository layer and missing write operations needed for a complete admin control panel. The goal is to fix all bugs and add full CRUD for users, bookings, and properties without touching any other module.

Bugs to Fix
Location	Bug
admin.repository.ts:19	prisma.user.count() has no deletedAt: null filter — includes soft-deleted users
admin.repository.ts:58-79	getUsers has no deletedAt: null filter — shows deleted users
admin.repository.ts:100-116	getBookings missing user relation in include — no user info on bookings
admin.repository.ts:118-123	updatePropertyStatus no existence check — throws raw Prisma P2025, not a clean 404
admin.router.ts:16	PATCH /properties/:id/status has no Zod validation — raw string cast to enum
New Features
Server
New file: server/src/modules/admin/admin.schema.ts

export const updatePropertyStatusSchema = z.object({ status: z.enum(['ACTIVE', 'DRAFT', 'PAUSED']) });
export const updateUserRoleSchema        = z.object({ role: z.enum(['CUSTOMER', 'PARTNER']) });
export const updateBookingStatusSchema   = z.object({ status: z.enum(['CANCELLED', 'COMPLETED', 'NO_SHOW']) });
New endpoints to add:

Method	Path	Body	Business Rule
PATCH	/admin/users/:id/role	{ role }	Cannot change own role; target role limited to CUSTOMER/PARTNER (no ADMIN promotion)
DELETE	/admin/users/:id	—	Cannot deactivate self; cannot deactivate another ADMIN
POST	/admin/users/:id/restore	—	Restores soft-deleted user
PATCH	/admin/bookings/:id/status	{ status }	Booking must be in CONFIRMED state before transitioning
Also add search query param to GET /users, GET /properties, GET /bookings.

Repository Methods to Add (admin.repository.ts)
getUserById(id) — needed for deactivation role check
updateUserRole(userId, role) — prisma.user.update
deactivateUser(userId) — set deletedAt: new Date()
restoreUser(userId) — set deletedAt: null
getBookingById(id) — needed for status transition guard
updateBookingStatus(bookingId, status) — prisma.booking.update
Add search filter to getUsers, getProperties, getBookings
Service Business Logic (admin.service.ts)
updateUserRole(actorId, userId, role): throw ForbiddenError if actorId === userId
deactivateUser(actorId, userId): throw ForbiddenError if self; fetch user, throw ForbiddenError if target is ADMIN
restoreUser(userId): straight delegate to repo
updateBookingStatus(bookingId, status): fetch booking, throw BadRequestError if not CONFIRMED
Controller + Router
4 new handlers in admin.controller.ts following existing arrow-function pattern
4 new routes in admin.router.ts with Zod validate() middleware; fix existing PATCH route to add Zod
Client
client/src/api/admin.api.ts — add search?: string param to existing list methods; add 5 new methods: updateUserRole, deactivateUser, restoreUser, updateBookingStatus

client/src/features/admin/users/admin-users-page.tsx:

Add search text input (debounced, resets to page 1 on change)
Add deletedAt column + badge (Active / Deactivated)
Add "Change Role" button → Modal with role select + confirm
Add "Deactivate"/"Restore" button → Modal with confirmation text
client/src/features/admin/bookings/admin-bookings-page.tsx:

Add search text input
Add user email column (available once repo fix includes user relation)
Add action buttons (Cancel / Complete / No-Show) for CONFIRMED bookings → Modal confirmation
client/src/features/admin/properties/admin-properties-page.tsx:

Add search text input
client/src/features/admin/dashboard/admin-dashboard-page.tsx:

Add href="/admin/bookings" to the Platform Revenue StatCard (other 3 cards already have hrefs)
Execution Order
Create admin.schema.ts
Update admin.repository.ts (bugs + new methods)
Update admin.service.ts (business rules + new methods)
Update admin.controller.ts (new handlers)
Update admin.router.ts (Zod validation + new routes)
Update client/src/api/admin.api.ts
Update admin-dashboard-page.tsx (1-line fix)
Update admin-properties-page.tsx (search only)
Update admin-bookings-page.tsx (search + actions + Modal)
Update admin-users-page.tsx (search + role change + deactivate/restore + Modal)
Verification
npm run lint in server/ — 0 errors
npm run lint in client/ — 0 errors
Curl/Postman: PATCH /api/v1/admin/users/:id/role, DELETE /api/v1/admin/users/:id, POST /api/v1/admin/users/:id/restore, PATCH /api/v1/admin/bookings/:id/status
Verify existing endpoints still work: GET /admin/stats, GET /admin/users, PATCH /admin/properties/:id/status
In browser: admin users page shows search + action buttons; bookings page shows Cancel/Complete/No-Show; dashboard Revenue card links to bookings
Gap Closure Plan: Booking.com MVP
Context
Reviewed Documentation\Antigravity\final_doc_implementation_plan and cross-checked against the actual server, React client, and Flutter codebase. The goal is to identify everything planned or implied by the feature documentation that is not yet implemented, and produce a prioritized plan to close those gaps.

Flutter is fully complete (11 routes, 0 analyze errors). The gaps are entirely in the server and React client, plus a large documentation deliverable.

Gap Summary
Server Gaps
Gap	Status
PartnerLegal KYC API — Prisma model exists, zero endpoints	❌ Missing
Rate plan management (NON_REFUNDABLE, WEEKLY) — only STANDARD auto-created	❌ Missing
Search filter params (minPrice, maxPrice, stars) not in query schema	❌ Missing
Public property availability endpoint (customer-facing)	❌ Missing
ChatBot API key exposed client-side — needs backend proxy	❌ Security issue
REQUEST booking mode ignored in hold/confirm flow	❌ Partial
Stub modules (services/, orders/, payments/, notifications/)	Phase 2 — leave as-is
React Client Gaps
Gap	Status
Search filter sidebar doesn't pass params to API (filters are client-side only)	❌ Partial
Header category chips show "Coming soon" disabled state	❌ UX issue
Property detail: blocked-date date picker (no availability API call)	❌ Missing
Property detail: "Only N left!" scarcity badge absent	❌ Missing
ChatBot: VITE_GEMINI_API_KEY exposed in browser bundle	❌ Security issue
useAppDispatch.ts / useAppSelector.ts — dead Redux stubs	❌ Dead code
Modal.tsx — built but never imported/used	❌ Unused
Documentation/Claude_web/final_documentation.md — 14-section doc planned, not created	❌ Missing
Flutter Gaps
None. All 6 phases complete.

Implementation Plan (Prioritized)
Phase 1 — Server: New APIs (all independent, no migrations needed)
1.1 PartnerLegal KYC Endpoints (Complexity: M)
New endpoints under /api/v1/partner:

GET /properties/:propertyId/legal
POST /properties/:propertyId/legal (upsert — works for create and update)
PATCH /properties/:propertyId/legal (same upsert handler, partial schema)
Files to modify:

server/src/modules/partner/partner.router.ts — add 3 routes; all require JWT + PARTNER/ADMIN
server/src/modules/partner/partner.controller.ts — add getLegal, upsertLegal methods
server/src/modules/partner/partner.service.ts — ownership check (property.ownerId === userId), then prisma.partnerLegal.upsert({ where: { propertyId }, create, update })
server/src/modules/partner/partner.repository.ts — add getLegal(propertyId), upsertLegal(propertyId, dto)
New file to create:

server/src/modules/partner/partner-legal.schema.ts — Zod schema with: entityType (INDIVIDUAL/BUSINESS enum), firstName, lastName, dateOfBirth (ISO date string), pan (regex /^[A-Z]{5}[0-9]{4}[A-Z]$/), aadhaar (regex /^\d{12}$/), gst (optional, max 15), phone (min 10 digits)
Client follow-up: client/src/api/partner.api.ts — add getLegal, upsertLegal methods

1.2 Rate Plan Management Endpoints (Complexity: M)
New endpoints under /api/v1/properties:

GET /:id/room-types/:roomTypeId/rate-plans
POST /:id/room-types/:roomTypeId/rate-plans
DELETE /:id/room-types/:roomTypeId/rate-plans/:ratePlanId
Files to modify:

server/src/modules/properties/properties.router.ts — add 3 routes; all require JWT + PARTNER/ADMIN
server/src/modules/properties/properties.controller.ts — add getRatePlans, addRatePlan, deleteRatePlan
server/src/modules/properties/properties.service.ts — addRatePlan must: verify ownership, reject STANDARD plan type (always auto-created), check no duplicate planType exists on that roomType (ConflictError), default discountPercent (NON_REFUNDABLE → 10, WEEKLY → 15) and minNights (NON_REFUNDABLE → 1, WEEKLY → 7); deleteRatePlan must: verify ownership, block deletion of STANDARD plan (BadRequestError)
server/src/modules/properties/properties.repository.ts — add findRatePlans, addRatePlan, deleteRatePlan
server/src/modules/properties/properties.schema.ts — add addRatePlanSchema: planType enum ['NON_REFUNDABLE', 'WEEKLY'] (exclude STANDARD), optional discountPercent and minNights
Client follow-up: client/src/api/properties.api.ts — add rate plan CRUD methods

1.3 Search Filter Query Params (Complexity: S)
Files to modify:

server/src/modules/search/search.schema.ts — add to searchQuerySchema: minPrice (z.coerce.number().min(0).optional()), maxPrice (z.coerce.number().min(0).optional()), stars (z.coerce.number().int().min(1).max(5).optional())

server/src/modules/search/search.repository.ts — inject optional SQL fragments into whereClause:

Price: AND (SELECT MIN(rt.base_price) FROM room_types rt WHERE rt.property_id = p.id) BETWEEN ${minPrice ?? 0} AND ${maxPrice ?? 9999999}
Stars: AND p.star_rating = ${stars}
Use Prisma.sql and Prisma.empty — already the pattern in this file.

1.4 Public Property Availability Endpoint (Complexity: S)
Prerequisite for client-side blocked-date date picker. The existing partner availability endpoint requires PARTNER auth — customers cannot call it.

New endpoint:

GET /api/v1/properties/:id/availability?year=YYYY&month=MM — no auth required
Files to modify:

server/src/modules/properties/properties.router.ts — add router.get('/:id/availability', controller.getAvailability) (unauthenticated)
server/src/modules/properties/properties.controller.ts — add getAvailability method
server/src/modules/properties/properties.service.ts — add getAvailability(propertyId, year, month): returns { date, roomTypeId, isBlocked }[]
server/src/modules/properties/properties.repository.ts — add query: prisma.availability.findMany({ where: { propertyId, isBlocked: true, date: { gte: startOfMonth, lt: startOfNextMonth } } })
1.5 ChatBot Backend Proxy (Complexity: M)
Moves Gemini API key server-side; prevents client bundle exposure.

New files to create:

server/src/modules/ai/ai.router.ts — POST /chat; rate-limited to 10 req/min; no auth
server/src/modules/ai/ai.controller.ts — reads GEMINI_API_KEY from process.env, proxies request to Gemini REST endpoint, returns response
Files to modify:

server/src/app.ts — mount aiRouter at /api/v1/ai
server/src/config/env.ts — add GEMINI_API_KEY: z.string().optional() (optional to not break deployments without it); if absent, /ai/chat returns 503 { message: 'AI service not configured' }
server/.env + server/.env.example — add GEMINI_API_KEY= entry
1.6 REQUEST Booking Mode (Complexity: S-M) — Optional MVP
Minimal no-migration approach: when property.bookingMode === 'REQUEST', skip payment simulation and attach mode: 'REQUEST' in the booking confirmation response.

Files to modify:

server/src/modules/bookings/bookings.service.ts — after fetching the hold, look up property.bookingMode; if REQUEST, skip simulatePayment / PaymentSimulation.create, return booking with extra mode: 'REQUEST' field
Note: paymentTransactionId is already String? (nullable) in schema — no migration needed
Phase 2 — React Client UX Gaps
2.1 Search Filter Sidebar → Pass Params to API (Complexity: S)
The filter sidebar UI and client-side filter logic already exist in search-page.tsx. The only change is passing the active filter values as query params to the API call.

Files to modify:

client/src/features/search/search-page.tsx — update queryFn inside the useQuery call to forward minPrice, maxPrice, stars from filter state as optional query params; update queryKey to include filter values so the query re-runs on filter changes
Also fix: PROPERTY_TYPES constant includes RESORT and HERITAGE which are not valid PropertyCategory enum values — remove or map them to OTHER
2.2 Header Category Chips — Friendly UX Fix (Complexity: S)
The chips represent product verticals (Flights, Car rentals etc.) — not property types. They are correctly non-functional for this MVP. The "Coming soon" cursor-not-allowed UX is unfriendly.

Files to modify:

client/src/components/layout/Header.tsx — replace disabled <button> elements with clickable buttons that show a toast: toast.info('Coming soon — flights and car rentals are in development'). Remove cursor-not-allowed styling.
2.3 Property Detail: Blocked-Date Display (Complexity: M)
Requires Phase 1.4 (public availability endpoint) first.

Files to modify:

client/src/api/properties.api.ts — add getAvailability(id, year, month): Promise<{ date: string; isBlocked: boolean }[]>
client/src/features/property/property-detail-page.tsx — add useQuery call for availability; build blockedDates: Set<string> from response; add a helper isDateBlocked(date: string): boolean; display a small notice below date inputs: "Some dates may be unavailable. Blocked dates: [list]" if any are blocked in the selected month. Native <input type="date"> cannot disable individual dates — use informational display rather than a custom picker for MVP.
2.4 Property Detail: Scarcity Badge (Complexity: S)
No server change needed. Use maxOccupancy as a proxy heuristic.

Files to modify:

client/src/features/property/property-detail-page.tsx — inside the RoomCard (or room type row), add:
{room.maxOccupancy <= 2 && (
  <span className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-full">
    Only 1 left at this price!
  </span>
)}
2.5 ChatBot: Remove Client-Side API Key (Complexity: S)
Requires Phase 1.5 first.

Files to modify:

client/src/features/search/ChatBot.tsx — replace direct fetch to generativelanguage.googleapis.com with a call to /api/v1/ai/chat; pass { history, userText } in the body; remove all usage of import.meta.env.VITE_GEMINI_API_KEY
client/.env / client/.env.example — remove VITE_GEMINI_API_KEY entry
Phase 3 — Code Cleanup
3.1 Remove Dead Redux Stubs (Complexity: S)
Verify first: grep -r "useAppDispatch\|useAppSelector" client/src/ — should return zero results.

Files to delete:

client/src/hooks/useAppDispatch.ts
client/src/hooks/useAppSelector.ts
3.2 Activate Modal.tsx in Cancel Confirmation (Complexity: S)
Modal.tsx is a fully-implemented accessible dialog component sitting unused. Activate it in the trips cancellation flow to replace any window.confirm.

Files to modify:

client/src/features/trips/trips-page.tsx — replace the cancel confirmation with <Modal> imported from ../../components/ui/Modal; add a cancelModalOpen state and confirmation/cancel buttons inside the modal body
Phase 4 — Documentation
4.1 Create Documentation/Claude_web/final_documentation.md (Complexity: L)
Single-source-of-truth reference. Consolidates all three CLAUDE.md files, schema.prisma, and all route files into one readable document.

Target file: Documentation/Claude_web/final_documentation.md

14 sections (per the final_doc_implementation_plan):

Executive Summary — project overview, goals, tech stack summary
System Architecture — 3 clients (Web/Mobile/future), REST API, PostgreSQL, GC job, JWT boundary diagram
Technology Stack — full table: server (Express/Prisma/PG/Winston), client (React/Zustand/React Query/Formik), mobile (Flutter/BLoC/Dio/go_router)
Database — Mermaid erDiagram, all 11 models with fields/types/constraints, all enums with values, PostgreSQL indexes, full-text search trigger
Backend API Reference — all 42 endpoints (auth/users/search/properties/bookings/partner/admin/ai), request/response shapes, error schema
Customer Module — user journey narrative + Mermaid sequenceDiagram (Register → OTP → Login → Search → PDP → Hold → Checkout → Confirm → Trips → Cancel), BookingStatus state machine
Partner Module — partner journey, sequence diagram (Register → Create Property → Add Rooms → Publish → Monitor), property lifecycle (DRAFT→ACTIVE→PAUSED), PartnerLegal KYC field table
Web Client / React — 20 routes table (path/role/status), Zustand store architecture, Axios interceptor chain, RHF+Zod pattern, design system tokens
Flutter Mobile App — Clean Architecture layer diagram, 11 routes table, BLoC state management, go_router + back-stack strategy, token storage lifecycle
Authentication Deep Dive — OTP registration flow, JWT lifecycle (access 1h + refresh 7d), token refresh chain (server + React + Flutter), security rules
Booking Transaction — Atomic 4-step Prisma $transaction, AvailabilityHold 15-min TTL, GC job pattern
Sequence Diagrams — standalone full Customer flow and Partner flow diagrams
Setup & Deployment Guide — prerequisites, per-component quickstart, env var reference, seed accounts (admin/partner/customer)
Phase 2 Roadmap — what's not built: services/orders/payments/notifications modules, real email, S3 upload, WebSocket, Redis, Stripe payouts, REQUEST approval flow
Author after Phase 1 + Phase 2 complete so the API reference reflects the final state.

Priority Execution Order
#	Task	Files	Complexity	Depends On
1	Server: search filter params	search.schema.ts, search.repository.ts	S	—
2	Server: PartnerLegal endpoints	partner.router/controller/service/repository.ts + new partner-legal.schema.ts	M	—
3	Server: rate plan endpoints	properties.router/controller/service/repository/schema.ts	M	—
4	Server: public availability endpoint	properties.router/controller/service/repository.ts	S	—
5	Server: ChatBot proxy	new ai/ module, app.ts, env.ts, .env.example	M	—
6	Client: filter params passthrough	search-page.tsx, PROPERTY_TYPES fix	S	#1
7	Client: header chips toast	Header.tsx	S	—
8	Client: scarcity badge	property-detail-page.tsx	S	—
9	Client: blocked-date display	properties.api.ts, property-detail-page.tsx	M	#4
10	Client: ChatBot key removal	ChatBot.tsx, .env	S	#5
11	Cleanup: delete Redux stubs	useAppDispatch.ts, useAppSelector.ts	S	—
12	Cleanup: Modal in cancel	trips-page.tsx	S	—
13	Server: REQUEST mode (optional)	bookings.service.ts	S	—
14	Docs: final_documentation.md	new file	L	#1–#12
Verification Steps
After implementation:

Server: Run npm run lint in server/ — 0 errors
Server: Hit each new endpoint with curl/Postman: POST /api/v1/partner/properties/:id/legal, POST /api/v1/properties/:id/room-types/:roomTypeId/rate-plans, GET /api/v1/properties/:id/availability, POST /api/v1/ai/chat
Client: Run npm run lint in client/ — 0 errors
Client: Open search page, apply filters, verify URL/query params update and results change
Client: Open property detail, verify scarcity badge renders for small-capacity rooms
Client: Verify ChatBot responds via backend proxy (no network calls to googleapis.com in browser DevTools)
Client: Confirm window.confirm is gone from trips cancel flow — <Modal> appears instead
Flutter: flutter analyze — still 0 errors (no Flutter changes expected)
Docs: Open final_documentation.md, verify all Mermaid diagrams render, API table has all 42+ endpoints, DB section matches schema.prisma