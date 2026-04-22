"use client";
import { loadDb, generateReport, AppUser } from "@/lib/localDb";

export function ReportsTab({ user }: { user: AppUser }) {
  const db = loadDb();
  const r = generateReport(db);
  const isMgmt = user.role === "management";
  const isAdmin = user.role === "administrator";

  return (
    <div className="tabSection">
      <div className="statsRow">
        <div className="statCard">
          <span className="statLabel">Total Revenue</span>
          <span className="statValue greenVal">₹{r.totalRevenue.toLocaleString()}</span>
        </div>
        <div className="statCard">
          <span className="statLabel">Unpaid</span>
          <span className="statValue redVal">₹{r.totalUnpaid.toLocaleString()}</span>
        </div>
        <div className="statCard">
          <span className="statLabel">Total Orders</span>
          <span className="statValue">{r.totalOrders}</span>
        </div>
        <div className="statCard">
          <span className="statLabel">Delivered</span>
          <span className="statValue greenVal">{r.deliveredOrders}</span>
        </div>
      </div>

      <div className="reportGrid">
        {/* Order Status Breakdown */}
        <div className="panel">
          <h2>Order Status Breakdown</h2>
          <div className="reportRows">
            <div className="reportRow">
              <span>Pending</span>
              <span className="statusPill status-pending">{r.pendingOrders}</span>
            </div>
            <div className="reportRow">
              <span>Processing</span>
              <span className="statusPill status-processing">{r.processingOrders}</span>
            </div>
            <div className="reportRow">
              <span>Delivered</span>
              <span className="statusPill status-delivered">{r.deliveredOrders}</span>
            </div>
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="panel">
          <h2>Inventory Alerts</h2>
          <div className="reportRows">
            <div className="reportRow">
              <span>Low Stock Parts</span>
              <span className="statusPill status-pending">{r.lowStockParts}</span>
            </div>
            <div className="reportRow">
              <span>Out of Stock</span>
              <span className="statusPill status-cancelled">{r.outOfStockParts}</span>
            </div>
          </div>
          <div className="tableWrap" style={{ marginTop: "1rem" }}>
            <table className="dataTable">
              <thead>
                <tr>
                  <th>Part</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Alert</th>
                </tr>
              </thead>
              <tbody>
                {db.parts
                  .filter((p) => p.status !== "in_stock")
                  .map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td><code>{p.sku}</code></td>
                      <td>{p.quantity}</td>
                      <td>
                        <span className={`statusPill status-${p.status === "low_stock" ? "pending" : "cancelled"}`}>
                          {p.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quotation Summary */}
        <div className="panel">
          <h2>Quotation Summary</h2>
          <div className="reportRows">
            <div className="reportRow">
              <span>Pending Review</span>
              <span className="statusPill status-pending">{r.pendingQuotations}</span>
            </div>
            <div className="reportRow">
              <span>Approved</span>
              <span className="statusPill status-delivered">{r.approvedQuotations}</span>
            </div>
          </div>
        </div>

        {/* Top Parts by Revenue */}
        {(isAdmin || isMgmt) && r.topParts.length > 0 && (
          <div className="panel">
            <h2>Top Parts by Revenue</h2>
            <div className="tableWrap">
              <table className="dataTable">
                <thead>
                  <tr>
                    <th>Part</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {r.topParts.map((p, i) => (
                    <tr key={i}>
                      <td>{p.name}</td>
                      <td>{p.orders}</td>
                      <td>₹{p.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Full Billing Log */}
        {(isAdmin || isMgmt) && (
          <div className="panel" style={{ gridColumn: "1 / -1" }}>
            <h2>Financial Data — Billing Log</h2>
            <div className="tableWrap">
              <table className="dataTable">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Dealer</th>
                    <th>Part</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {db.billing.map((b) => (
                    <tr key={b.id}>
                      <td><code>{b.invoice_number}</code></td>
                      <td>{b.dealerName}</td>
                      <td>{b.partName}</td>
                      <td>₹{b.total.toLocaleString()}</td>
                      <td>
                        <span className={`statusPill ${b.payment_status === "paid" ? "status-delivered" : "status-pending"}`}>
                          {b.payment_status}
                        </span>
                      </td>
                      <td>{b.createdAt.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Inventory Tab ────────────────────────────────────────────────────────────
export function InventoryTab({ user }: { user: AppUser }) {
  const db = loadDb();
  const isInv = user.role === "inventory_manager";
  const isAdmin = user.role === "administrator";

  return (
    <div className="tabSection">
      <div className="statsRow">
        <div className="statCard">
          <span className="statLabel">Total Parts</span>
          <span className="statValue">{db.inventory.length}</span>
        </div>
        <div className="statCard">
          <span className="statLabel">In Stock</span>
          <span className="statValue greenVal">{db.parts.filter((p) => p.status === "in_stock").length}</span>
        </div>
        <div className="statCard">
          <span className="statLabel">Low Stock</span>
          <span className="statValue" style={{ color: "#f7c948" }}>{db.parts.filter((p) => p.status === "low_stock").length}</span>
        </div>
        <div className="statCard">
          <span className="statLabel">Out of Stock</span>
          <span className="statValue redVal">{db.parts.filter((p) => p.status === "out_of_stock").length}</span>
        </div>
      </div>

      <div className="panel">
        <h2>Inventory Dataset</h2>
        <div className="tableWrap">
          <table className="dataTable">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Part Name</th>
                <th>Location</th>
                <th>Qty</th>
                <th>Min Stock</th>
                <th>Status</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {db.inventory.map((inv) => {
                const part = db.parts.find((p) => p.id === inv.partId);
                return (
                  <tr key={inv.id}>
                    <td><code>{inv.sku}</code></td>
                    <td>{inv.partName}</td>
                    <td>{inv.location}</td>
                    <td>{inv.quantity}</td>
                    <td>{inv.min_stock}</td>
                    <td>
                      <span className={`statusPill status-${part?.status || "pending"}`}>
                        {part?.status?.replace("_", " ") || "unknown"}
                      </span>
                    </td>
                    <td>{inv.last_updated.slice(0, 10)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
