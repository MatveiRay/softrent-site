# Phase 2 Core Product Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish Phase 2 by making listings, search, bookings, availability, admin operations, and ingestion all work against one coherent Postgres-backed model.

**Architecture:** Keep existing Next.js App Router structure, add focused server-side service modules for listing search, booking rules, availability, and admin mutations, and expose only thin route handlers/UI shells above them. Preserve the existing UI shape where possible so the migration is behavioral rather than a redesign.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma 7, PostgreSQL/Neon, Node test runner via `tsx`, existing Framer Motion UI.

---

## File map

### Create

- `src/lib/listing-search.ts` — pure search filter parsing and Prisma where-builder helpers
- `src/lib/availability.ts` — overlap detection and availability checks
- `src/lib/booking-service.ts` — booking validation, pricing, serialization, review actions
- `src/lib/admin-service.ts` — admin listing/ingestion/availability reads and mutations
- `src/app/api/listings/route.ts` — search API
- `src/app/api/admin/listings/route.ts` — listing admin API
- `src/app/api/admin/bookings/route.ts` — booking queue API
- `src/app/api/admin/availability/route.ts` — availability API
- `src/app/api/admin/ingest/route.ts` — ingestion audit API
- `src/app/admin/page.tsx` — server shell for admin page
- `src/app/admin/AdminClient.tsx` — interactive admin UI
- `tests/listing-search.test.ts`
- `tests/availability.test.ts`
- `tests/booking-service.test.ts`
- `tests/ingest-lib.test.ts`

### Modify

- `prisma/schema.prisma`
- `scripts/ingest/lib.ts`
- `scripts/ingest/synthetic-luxury.ts`
- `src/lib/listings-db.ts`
- `src/app/search/page.tsx`
- `src/app/api/bookings/route.ts`
- `src/components/BookingModal.tsx`
- `src/app/profile/ProfileClient.tsx`
- `src/lib/bookings.ts`
- `package.json`

## Task 1: Search foundation and DB-backed search

**Files:**
- Create: `src/lib/listing-search.ts`
- Create: `src/app/api/listings/route.ts`
- Create: `tests/listing-search.test.ts`
- Modify: `src/lib/listings-db.ts`
- Modify: `src/app/search/page.tsx`
- Modify: `package.json`

- [ ] **Step 1: Write failing search tests**

Create tests for:

```ts
import { buildListingWhere, parseListingSearchParams } from "../src/lib/listing-search";

test("parses destination, guests, price, and text filters", () => {
  expect(parseListingSearchParams({
    dest: "tropical",
    guests: "4",
    minPrice: "200",
    maxPrice: "900",
    q: "ocean",
  })).toEqual({
    dest: "tropical",
    guests: 4,
    minPrice: 200,
    maxPrice: 900,
    q: "ocean",
  });
});

test("builds tropical guest-capacity filter", () => {
  expect(buildListingWhere({ dest: "tropical", guests: 4 })).toEqual({
    isPublished: true,
    category: "TROPICAL",
    guests: { gte: 4 },
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run: `npm run test -- tests/listing-search.test.ts`  
Expected: failure because `src/lib/listing-search.ts` does not exist yet.

- [ ] **Step 3: Implement minimal search helpers**

Implement:

```ts
export type ListingSearchFilters = {
  dest?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
};

export function parseListingSearchParams(...)
export function buildListingWhere(...)
```

- [ ] **Step 4: Wire search query execution**

Add a `searchListings(filters)` function to `src/lib/listings-db.ts`, switch `/search` to use it, and add `/api/listings`.

- [ ] **Step 5: Run tests and verify they pass**

Run: `npm run test -- tests/listing-search.test.ts`  
Expected: pass.

## Task 2: Availability and booking rules

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/lib/availability.ts`
- Create: `src/lib/booking-service.ts`
- Create: `tests/availability.test.ts`
- Create: `tests/booking-service.test.ts`
- Modify: `src/app/api/bookings/route.ts`

- [ ] **Step 1: Write failing availability tests**

Create tests for:

```ts
import { rangesOverlap } from "../src/lib/availability";

test("detects overlapping ranges but allows adjacent stays", () => {
  expect(rangesOverlap("2026-06-01", "2026-06-05", "2026-06-04", "2026-06-07")).toBe(true);
  expect(rangesOverlap("2026-06-01", "2026-06-05", "2026-06-05", "2026-06-08")).toBe(false);
});
```

- [ ] **Step 2: Run test and verify red**

Run: `npm run test -- tests/availability.test.ts`  
Expected: failure because the helper does not exist.

- [ ] **Step 3: Add schema support**

Update Prisma schema:

```prisma
model AvailabilityBlock {
  id        String   @id @default(cuid())
  listingId String
  listing   Listing  @relation(fields: [listingId], references: [id])
  startDate DateTime
  endDate   DateTime
  reason    String?
  createdAt DateTime @default(now())

  @@index([listingId])
  @@index([startDate, endDate])
}
```

Also switch `Booking.status` default to `PENDING`.

- [ ] **Step 4: Implement booking services**

Implement:

```ts
export function rangesOverlap(...)
export async function assertListingAvailable(...)
export function calculateBookingTotals(...)
export function serializeBooking(...)
export async function createPendingBooking(...)
export async function reviewPendingBooking(...)
```

- [ ] **Step 5: Replace route logic with service calls**

Refactor `/api/bookings` to:

- create `PENDING` bookings
- reject conflicting confirmed bookings and availability blocks
- serialize status to profile clients

- [ ] **Step 6: Run tests and DB sync**

Run:

```bash
npm run test -- tests/availability.test.ts tests/booking-service.test.ts
npm run db:push
```

Expected: tests pass, Prisma sync succeeds.

## Task 3: Client migration from localStorage to API

**Files:**
- Modify: `src/components/BookingModal.tsx`
- Modify: `src/app/profile/ProfileClient.tsx`
- Modify: `src/lib/bookings.ts`

- [ ] **Step 1: Write failing service serialization test**

Add a booking-service test confirming status is included in serialized output.

- [ ] **Step 2: Verify red**

Run: `npm run test -- tests/booking-service.test.ts`  
Expected: failure until serializer includes `status`.

- [ ] **Step 3: Update client booking flow**

Change `BookingModal` so `confirm()` calls:

```ts
await fetch("/api/bookings", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({...}),
});
```

Use server-returned `publicId`, `nights`, and `total`.

- [ ] **Step 4: Update profile loading**

Replace `getBookings()` with `fetch("/api/bookings")` and display booking status.

- [ ] **Step 5: Retire browser persistence**

Keep only shared booking types and utilities in `src/lib/bookings.ts`; remove persistence helpers.

- [ ] **Step 6: Verify**

Run:

```bash
npm run test -- tests/booking-service.test.ts
npm run build
```

Expected: tests pass, build succeeds.

## Task 4: Admin APIs and UI

**Files:**
- Create: `src/lib/admin-service.ts`
- Create: `src/app/api/admin/listings/route.ts`
- Create: `src/app/api/admin/bookings/route.ts`
- Create: `src/app/api/admin/availability/route.ts`
- Create: `src/app/api/admin/ingest/route.ts`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/AdminClient.tsx`

- [ ] **Step 1: Write failing admin queue test**

Add a booking-service test:

```ts
test("reviewing a pending booking confirms it when dates are still available", async () => {
  // use fake repository functions or extracted pure logic
});
```

- [ ] **Step 2: Verify red**

Run: `npm run test -- tests/booking-service.test.ts`  
Expected: failure before review logic exists.

- [ ] **Step 3: Implement admin service layer**

Add focused functions for:

- listing CRUD/publish toggle
- pending booking review
- availability block CRUD
- ingestion history retrieval

- [ ] **Step 4: Add admin route handlers**

Expose:

- `GET/POST/PATCH /api/admin/listings`
- `GET/PATCH /api/admin/bookings`
- `GET/POST/DELETE /api/admin/availability`
- `GET /api/admin/ingest`

- [ ] **Step 5: Build minimal admin interface**

Use a single page with tabs/sections:

- Listings
- Booking queue
- Availability
- Ingestion history

- [ ] **Step 6: Verify**

Run:

```bash
npm run test -- tests/booking-service.test.ts
npm run build
```

Expected: tests pass, build succeeds.

## Task 5: Ingestion cleanup and luxury classifier honesty

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `scripts/ingest/lib.ts`
- Modify: `scripts/ingest/synthetic-luxury.ts`
- Create: `tests/ingest-lib.test.ts`

- [ ] **Step 1: Write failing ingestion tests**

Create tests for:

```ts
test("luxury scoring explains why a premium chalet passes", ...)
test("synthetic records use SYNTHETIC source rather than PLUM_GUIDE", ...)
```

- [ ] **Step 2: Verify red**

Run: `npm run test -- tests/ingest-lib.test.ts`  
Expected: failure until source labeling and score explanations are added.

- [ ] **Step 3: Extend schema and ingestion result**

Add `SYNTHETIC` to `ListingSource`.

Refactor scoring to return:

```ts
type LuxuryScore = {
  total: number;
  reasons: string[];
};
```

Persist reasons in `IngestRecord.message`.

- [ ] **Step 4: Fix synthetic source labeling**

Update synthetic fixtures to use `SYNTHETIC`.

- [ ] **Step 5: Verify**

Run:

```bash
npm run test -- tests/ingest-lib.test.ts
npm run db:push
```

Expected: tests pass, schema sync succeeds.

## Task 6: End-to-end verification

**Files:**
- No new files required

- [ ] **Step 1: Run full verification**

Run:

```bash
npm run test
npm run build
```

- [ ] **Step 2: Manually verify core flows**

Check:

- search results come from DB
- booking creates `PENDING` record
- profile displays DB-backed bookings and status
- admin can confirm/reject bookings
- conflicting confirmed dates are blocked
- ingestion history shows reasons

- [ ] **Step 3: Summarize remaining tradeoffs**

Document:

- which ingestion sources are production-usable today
- which adapters remain operationally brittle
- what should be done next if the user wants true live scraping
