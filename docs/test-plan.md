# WAMS Local Verification Scenarios

## Automated checks

Backend API tests:
- cd backend && npm test

Frontend production build:
- cd frontend && npm run build

Current automated backend coverage includes:
- health check in local mode
- auth register + username login
- dealer create/update/delete
- order fulfillment with stock reduction and bill creation
- billing mark-paid flow

## Manual smoke flows

1. Admin login and dashboard load
   - Open http://localhost:3000
   - Login with admin / admin123
   - Confirm dashboard renders with summary cards

2. Dealer management persistence
   - Open Dealers tab
   - Add a dealer or toggle a dealer status
   - Refresh the page
   - Confirm the change still appears
   - Confirm the change exists in backend/data/local-db.json

3. Order fulfillment to billing
   - Open Orders tab
   - Fulfill a pending order
   - Confirm product quantity decreases
   - Confirm a new invoice appears in Billing
   - Confirm a transaction record exists in backend local data

4. Billing payment workflow
   - Open Billing tab
   - Click Mark Paid on an unpaid invoice
   - Confirm payment status changes to paid
   - Confirm paid_date is written in backend/data/local-db.json

5. Inventory and parts view
   - Open Parts and Inventory tabs
   - Confirm stock values render from backend data
   - Update stock if needed and verify the UI refreshes from API-backed state

## Data reset

To restore a fresh seeded environment:
- stop the backend
- delete backend/data/local-db.json
- restart the backend

## Expected local URLs

- frontend: http://localhost:3000
- backend: http://localhost:5000
- backend health: http://localhost:5000/api/health
