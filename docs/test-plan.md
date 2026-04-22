# WAMS Verification Scenarios

## Automated Checks

- Backend health test:
  - `cd backend && npm test`
- Frontend static checks:
  - `cd frontend && npm run lint`

## End-to-End Smoke Flows

1. **Supplier quotation to purchase confirmation**
   - Create supplier and part.
   - Submit quotation using `/api/quotations`.
   - Confirm via `/api/purchase-orders/:quotationId/confirm`.
   - Verify quotation status moves to `accepted`.

2. **Dealer order to billing and transaction log**
   - Create dealer and product with stock.
   - Place order via `/api/orders`.
   - Fulfill via `/api/orders/:id/fulfill`.
   - Verify product stock reduction, new `billing` row, and new `transactions` row.

3. **Low-stock detection to procurement initiation**
   - Reduce part quantity below minimum using `/api/inventory/stock-adjustments`.
   - Fetch `/api/reports/stock-requirements`.
   - Verify item appears in requirements list.

4. **Role-based UI access (dark theme)**
   - Open frontend and switch role selector.
   - Confirm tab visibility changes for Dealer, Supplier, Inventory Manager, Management, Administrator.
