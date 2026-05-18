# Phase 2 Core Product Design

**Date:** 2026-05-18  
**Project:** SoftRent  
**Status:** Approved direction, pending implementation planning

## Goal

Turn the current partial Phase 2 work into one coherent product system:

- Postgres becomes the source of truth for listings and bookings.
- Search, booking, profile, admin, and ingestion flows all operate on the same database-backed model.
- The ingestion pipeline keeps only on-brand luxury tropical and mountain homes, with explainable scoring and audit logs.

## Current State

Already present:

- Prisma + Neon/Postgres connection
- Database schema for listings, users, bookings, and ingest records
- Seed import for the original 12 listings
- DB-backed home page and listing detail pages
- Initial ingestion helpers with normalization, category detection, luxury scoring, and basic dedupe
- Initial bookings API route

Still incomplete:

- `/search` still reads from the old static data module
- `BookingModal` and profile still use `localStorage`
- booking creation currently auto-confirms instead of entering a review queue
- no availability-block model or conflict checks
- no `/api/listings`
- no `/admin`
- ingestion sources are not production-ready, and synthetic records are mislabeled as if they came from Plum Guide

## Product Decisions

### 1. Listings and Search

Postgres is the single source of truth for all published listings.

The following surfaces must read from the database:

- home page
- search page
- listing detail page
- future admin listing views
- `/api/listings`

Search should support:

- destination/category filtering
- country/city matching
- price bounds
- guest capacity
- published state
- free-text query over title, description, location, country, and amenities

The first implementation should remain pragmatic:

- use Prisma query composition where possible
- use Postgres-backed text matching without introducing a separate search product
- keep the UI behavior close to the existing experience

### 2. Booking Flow

Bookings must move fully from browser storage into Postgres.

Creation flow:

1. User submits dates, guest counts, and contact details from `BookingModal`.
2. `/api/bookings` validates the payload and calculates price totals on the server.
3. The API rejects invalid ranges and unavailable dates.
4. Successful bookings are created with status `PENDING`.
5. The profile page loads real bookings from the API and shows booking status.

Availability rules:

- a listing cannot receive overlapping `CONFIRMED` bookings
- a listing cannot receive bookings overlapping explicit availability blocks
- pending bookings do not block inventory until approved

### 3. Admin Panel

`/admin` is a working operations surface, not a placeholder page.

Minimum admin capabilities:

- list and edit listings
- publish/unpublish listings
- create listings manually
- inspect ingestion history and reasons for import/rejection
- review booking queue
- approve or reject pending bookings
- create and manage availability blocks

The admin UI can be minimal but must be usable and connected to real data.

### 4. Ingestion and Luxury Classification

The ingestion pipeline should be source-agnostic:

- every external source maps into one normalized `RawListing` shape
- normalization, scoring, dedupe, and insertion stay shared
- source-specific logic remains inside adapters

Luxury classification should be explicit and explainable.

The score should combine:

- nightly price tier
- rating quality
- property type
- premium amenities
- size/capacity
- tropical or mountain relevance

Each ingestion decision should persist enough detail to answer:

- why an object was imported
- why it was rejected
- why it was considered a duplicate

Data-source honesty rules:

- synthetic/demo records must use a distinct source label and never masquerade as scraped records
- external adapters must fail transparently when blocked
- the architecture should allow new compliant sources to be added without rewriting the core pipeline

### 5. Data Model Changes

Expected schema additions or adjustments:

- add `AvailabilityBlock`
- use `PENDING` as the default booking status
- preserve `IngestRecord`
- preserve listing source metadata
- add any minimal supporting fields needed for admin operations and status display

The current array-based storage for listing images and amenities is acceptable for this iteration; full relational normalization is not required yet.

## System Boundaries

### Core modules

- listing query layer
- booking service layer
- availability service layer
- ingestion core
- source adapters
- admin API/UI

Each module should have one clear responsibility and be testable independently.

### Out of scope for this iteration

- payment processing
- email delivery
- role-based multi-admin system
- a separate search engine such as Algolia or Elasticsearch
- fully autonomous scraping of arbitrary websites
- perfect source coverage

## Error Handling

The system should fail clearly rather than silently:

- validation errors return structured API responses
- conflicting booking dates return a specific availability error
- ingestion failures are logged to `IngestRecord`
- blocked external sources should not crash the rest of the pipeline
- admin actions should surface success and failure states to the operator

## Testing Strategy

Use behavior-focused tests around the highest-risk logic:

- luxury scoring
- category detection
- dedupe
- listing search filters
- booking overlap detection
- booking status transitions
- profile/API serialization
- admin booking review actions

Use integration-level verification for:

- Prisma schema sync
- API routes
- production build

## Delivery Order

1. Finish the database-backed listing/search layer.
2. Move booking creation and profile reads to the DB-backed API.
3. Add availability rules and booking queue behavior.
4. Add admin APIs and minimal `/admin` UI.
5. Clean up ingestion honesty, scoring, and logs.
6. Verify the complete product flow end-to-end.

## Success Criteria

Phase 2 is complete when:

- the site no longer depends on `localStorage` for bookings
- search reads from the database
- bookings enter a real pending queue
- conflicting confirmed bookings are prevented
- admins can manage listings, review bookings, and manage availability
- ingestion produces auditable decisions
- synthetic records are no longer mislabeled as real external imports
- the app builds successfully and the main user/admin flows work end-to-end
