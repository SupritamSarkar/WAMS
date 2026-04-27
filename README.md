# WAMS - Web Based Automated Manufacturing System

WAMS now runs as a fully local-first full-stack app with no Supabase dependency.

Repository layout:
- frontend/: Next.js 16 + React 19 dashboard UI
- backend/: Express API running on local JSON storage
- backend/data/local-db.json: seeded local datastore used by the backend


## Quick start

1. Start the backend
   - cd backend
   - npm install
   - npm run dev

2. Start the frontend
   - cd frontend
   - npm install
   - npm run dev

3. Open the app
   - http://localhost:3000

4. Check backend health
   - http://localhost:5000/api/health

## Demo accounts

Use these seeded local accounts:
- admin / admin123
- supplier1 / sup123
- dealer1 / deal123
- inventory / inv123

## Local architecture

Frontend:
- Uses frontend/src/lib/localDb.ts as an API-backed client/cache layer
- Syncs app state from the local backend and stores a browser cache for fast reloads

Backend:
- Uses backend/src/lib/localDb.js as a Supabase-like local query layer
- Persists all changes to backend/data/local-db.json
- Seeds the JSON file automatically on first run

## Reset local data

To reset the app to a fresh seeded state:
- stop the backend
- delete backend/data/local-db.json
- restart the backend

The file will be recreated automatically.

## Main local flows supported

- Authentication and password change
- Dealer CRUD
- Supplier CRUD and approval flow
- Parts and product inventory management
- Quotation submission and review
- Dealer order creation and fulfillment
- Billing generation and mark-paid flow
- Transaction logging and reporting

## Verification

Backend automated tests:
- cd backend && npm test

Frontend production build:
- cd frontend && npm run build

Recommended local smoke check:
1. Login as admin
2. Create or update a dealer
3. Place or fulfill an order
4. Open Billing and mark an invoice paid
5. Confirm changes persist in backend/data/local-db.json

## Docs

- docs/test-plan.md: local verification and smoke scenarios
- docs/traceability-matrix.md: SRS/use-case to endpoint/UI mapping

## Notes

- next.config.js allows 127.0.0.1 as a dev origin for local browser testing
- backend tests now cover auth, dealer CRUD, order fulfillment, and billing status updates
