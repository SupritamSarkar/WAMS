# WAMS - Web Based Automated Manufacturing System

This repository contains a full-stack implementation of WAMS using:

- `frontend/`: Next.js 16 + React 19, dark-themed operations dashboard
- `backend/`: Express API with manufacturing workflow endpoints
- `supabase/`: SQL migration, RLS policies, and seed data

## Quick Start

1. Configure backend environment:
   - Copy `backend/.env.example` to `backend/.env`
2. Configure frontend environment:
   - Copy `frontend/.env.example` to `frontend/.env.local`
3. Install dependencies and run backend:
   - `cd backend && npm install && npm run dev`
4. Run frontend:
   - `cd frontend && npm install && npm run dev`

## Core Modules Implemented

- Authorization and password change
- Dealers and suppliers management
- Parts and products inventory
- Quotations and purchase order confirmation
- Dealer order processing, fulfillment, and billing
- Transaction logging and report generation
- Stock requirement analysis endpoint

## Supabase Setup

- Apply schema migration from `supabase/migrations/20260422_init_wams.sql`
- Apply RLS policies from `supabase/policies.sql`
- Seed demo records from `supabase/seed.sql`

## Testing

- Backend tests:
  - `cd backend && npm test`
- Frontend lint:
  - `cd frontend && npm run lint`

## Traceability

See `docs/traceability-matrix.md` for SRS-to-code mapping and `docs/test-plan.md` for verification flows.
