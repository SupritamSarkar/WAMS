# WAMS Traceability Matrix

| SRS Use Case | UML/DFD Element | API Endpoint(s) | UI Area |
|---|---|---|---|
| Login | Manage Authorization | `POST /api/auth/login` | `frontend/src/app/page.tsx` (role-driven entry) |
| Change Password | Authorization sequence | `POST /api/auth/change-password` | planned account panel integration |
| Create/Update/Delete Dealer | Dealer management | `GET/POST/PUT/DELETE /api/dealers` | `dealers` tab |
| Create/Update Supplier | Supplier management | `GET/POST/PUT/DELETE /api/suppliers` | `suppliers` tab |
| Add Part / Update Part Stock | Inventory DFD | `GET/POST/PUT /api/parts`, `POST /api/inventory/stock-adjustments` | `parts` tab |
| Create Product / Update Product Stock | Product management | `GET/POST/PUT /api/products`, `POST /api/inventory/stock-adjustments` | `products` tab |
| Receive Quotation | Supplier quotation class | `GET/POST/PUT /api/quotations` | `quotations` tab |
| Confirm Supplier Order | Purchasing phase | `POST /api/purchase-orders/:quotationId/confirm` | Procurement workflow |
| Place Dealer Order | Dealer request class, order flow | `GET/POST /api/orders` | `orders` tab |
| Approve/Fulfill Order | State-chart phases | `PATCH /api/orders/:id/approve`, `PATCH /api/orders/:id/fulfill` | `orders` + billing side effects |
| Generate Bill | Billing module | `POST /api/billing`, `POST /api/orders/:id/fulfill` | `billing` tab |
| Log Transactions | Transaction class | `GET/POST /api/transactions` | dashboard summaries |
| Generate Reports | Management/reporting | `GET /api/reports/sales-report`, `GET /api/reports/stock-requirements` | `reports` tab |

## Workflow State Mapping

- `StockEvaluation` -> `GET /api/reports/stock-requirements`
- `PurchasingPhase` -> `POST /api/purchase-orders/:quotationId/confirm`
- `ManufacturingPhase` -> `waiting_for_production` order status in `dealer_requests`
- `BillingAndFulfillment` -> `PATCH /api/orders/:id/fulfill` with bill + transaction creation
