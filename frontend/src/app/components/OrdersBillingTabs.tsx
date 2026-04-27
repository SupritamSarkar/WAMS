"use client";
import { FormEvent, useState } from "react";
import {
  loadDb,
  placeOrder,
  processOrder,
  updateOrderStatus,
  markBillPaid,
  AppUser,
  Order,
  Bill,
} from "@/lib/localDb";

// ─── Orders Tab ───────────────────────────────────────────────────────────────
export function OrdersTab({
  user,
  onRefresh,
}: {
  user: AppUser;
  onRefresh: () => Promise<void>;
}) {
  const db = loadDb();
  const isDealer = user.role === "dealer";
  const isAdmin = user.role === "administrator";
  const isInv = user.role === "inventory_manager";
  const canProcess = isAdmin || isInv;
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const myDealer = isDealer ? db.dealers.find((d) => d.ownerUserId === user.id) : null;
  const orders = isDealer && myDealer
    ? db.orders.filter((o) => o.dealerId === myDealer.id)
    : db.orders;

  async function submitOrder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    if (!myDealer) { setErr("No dealer profile found."); return; }
    const formEl = e.currentTarget;
    const f = new FormData(formEl);
    const productId = String(f.get("productId") || "");
    const product = db.products.find((p) => p.id === productId);
    if (!product) { setErr("Select a valid product."); return; }
    const qty = Number(f.get("quantity") || 1);
    const result = await placeOrder({
      dealerId: myDealer.id,
      productId: product.id,
      quantity: qty,
      delivery_address: String(f.get("delivery_address") || myDealer.address),
      notes: String(f.get("notes") || ""),
    });
    if (result.error) { setErr(result.error); return; }
    formEl.reset();
    setMsg("Order placed successfully! Awaiting confirmation.");
    await onRefresh();
  }

  async function advanceStatus(o: Order) {
    const flow: Order["status"][] = ["pending", "confirmed", "processing", "shipped", "delivered"];
    const next = flow[flow.indexOf(o.status) + 1];
    if (next) { await updateOrderStatus(o.id, next); await onRefresh(); }
  }

  async function cancelOrder(o: Order) {
    if (!confirm("Cancel this order?")) return;
    await updateOrderStatus(o.id, "cancelled");
    await onRefresh();
  }

  async function doProcess(o: Order) {
    const result = await processOrder(o.id);
    if (result.error) { setErr(result.error); return; }
    setMsg(`Order processed. Invoice ${result.bill?.invoice_number} generated.`);
    await onRefresh();
  }

  const statusColors: Record<string, string> = {
    pending: "status-pending",
    confirmed: "status-approved",
    processing: "status-processing",
    shipped: "status-shipped",
    delivered: "status-delivered",
    cancelled: "status-cancelled",
  };

  return (
    <div className="tabSection">
      {isDealer && (
        <div className="panel">
          <h2>Place New Order</h2>
          <p className="helperText">Select a product and quantity. We&apos;ll check stock availability.</p>
          {err && <p className="errorText">{err}</p>}
          {msg && <p className="successText">{msg}</p>}
          <form className="formGrid" onSubmit={submitOrder}>
            <select name="productId" required>
              <option value="">Select Product…</option>
              {db.products.filter((p) => p.quantity > 0).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ₹{p.unit_price.toLocaleString()} (Stock: {p.quantity})
                </option>
              ))}
            </select>
            <input name="quantity" type="number" min="1" required placeholder="Quantity" />
            <input name="delivery_address" placeholder="Delivery address" />
            <input name="notes" placeholder="Special notes" />
            <button type="submit">Place Order</button>
          </form>
        </div>
      )}
      <div className="panel">
        <h2>{isDealer ? "My Orders" : "All Orders"}</h2>
        {canProcess && err && <p className="errorText">{err}</p>}
        {canProcess && msg && <p className="successText">{msg}</p>}
        {orders.length === 0 ? (
          <p className="helperText">No orders found.</p>
        ) : (
          <div className="tableWrap">
            <table className="dataTable">
              <thead>
                <tr>
                  <th>Dealer</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.dealerName}</td>
                    <td>{o.productName}</td>
                    <td>{o.quantity}</td>
                    <td>₹{o.total_amount.toLocaleString()}</td>
                    <td>
                      <span className={`statusPill ${statusColors[o.status] || ""}`}>
                        {o.status}
                      </span>
                    </td>
                    <td>{o.createdAt.slice(0, 10)}</td>
                    <td className="actionsTd">
                      {canProcess && o.status === "pending" && (
                        <button className="smBtn successBtn" onClick={() => doProcess(o)}>
                          Process &amp; Bill
                        </button>
                      )}
                      {canProcess && ["confirmed", "processing", "shipped"].includes(o.status) && (
                        <button className="smBtn" onClick={() => advanceStatus(o)}>
                          Advance Status
                        </button>
                      )}
                      {(isDealer || isAdmin) && o.status === "pending" && (
                        <button className="smBtn dangerBtn" onClick={() => cancelOrder(o)}>Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Billing Tab ──────────────────────────────────────────────────────────────
export function BillingTab({
  user,
  onRefresh,
}: {
  user: AppUser;
  onRefresh: () => Promise<void>;
}) {
  const db = loadDb();
  const isAdmin = user.role === "administrator";
  const isDealer = user.role === "dealer";
  const isMgmt = user.role === "management";
  const [msg, setMsg] = useState("");

  const myDealer = isDealer ? db.dealers.find((d) => d.ownerUserId === user.id) : null;
  const bills: Bill[] = isDealer && myDealer
    ? db.billing.filter((b) => b.dealerId === myDealer.id)
    : db.billing;

  const totalRevenue = bills.filter((b) => b.payment_status === "paid").reduce((s, b) => s + b.total, 0);
  const totalUnpaid = bills.filter((b) => b.payment_status === "unpaid").reduce((s, b) => s + b.total, 0);

  async function markPaid(b: Bill) {
    await markBillPaid(b.id);
    setMsg(`Invoice ${b.invoice_number} marked as paid.`);
    await onRefresh();
  }

  const payColors: Record<string, string> = {
    paid: "status-delivered",
    unpaid: "status-pending",
    overdue: "status-cancelled",
  };

  return (
    <div className="tabSection">
      <div className="statsRow">
        <div className="statCard">
          <span className="statLabel">Total Billed</span>
          <span className="statValue">₹{(totalRevenue + totalUnpaid).toLocaleString()}</span>
        </div>
        <div className="statCard">
          <span className="statLabel">Paid</span>
          <span className="statValue greenVal">₹{totalRevenue.toLocaleString()}</span>
        </div>
        <div className="statCard">
          <span className="statLabel">Unpaid</span>
          <span className="statValue redVal">₹{totalUnpaid.toLocaleString()}</span>
        </div>
      </div>

      <div className="panel">
        <h2>{isDealer ? "My Invoices" : "All Invoices"}</h2>
        {msg && <p className="successText">{msg}</p>}
        {bills.length === 0 ? (
          <p className="helperText">No invoices found.</p>
        ) : (
          <div className="tableWrap">
            <table className="dataTable">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Dealer</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                  <th>Tax (18%)</th>
                  <th>Total</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  {(isAdmin || isMgmt) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b.id}>
                    <td><code>{b.invoice_number}</code></td>
                    <td>{b.dealerName}</td>
                    <td>{b.partName}</td>
                    <td>{b.quantity}</td>
                    <td>₹{b.subtotal.toLocaleString()}</td>
                    <td>₹{b.tax.toLocaleString()}</td>
                    <td><strong>₹{b.total.toLocaleString()}</strong></td>
                    <td>{b.due_date}</td>
                    <td>
                      <span className={`statusPill ${payColors[b.payment_status] || ""}`}>
                        {b.payment_status}
                      </span>
                    </td>
                    {(isAdmin || isMgmt) && (
                      <td className="actionsTd">
                        {b.payment_status === "unpaid" && (
                          <button className="smBtn successBtn" onClick={() => markPaid(b)}>
                            Mark Paid
                          </button>
                        )}
                        {b.payment_status === "paid" && (
                          <span className="helperText">Paid {b.paid_date}</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
