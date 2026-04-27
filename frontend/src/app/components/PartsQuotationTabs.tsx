"use client";
import { FormEvent, useState } from "react";
import {
  loadDb,
  createPart,
  deletePart,
  updatePartQuantity,
  submitQuotation,
  respondToQuotation,
  AppUser,
  Part,
} from "@/lib/localDb";

// ─── Parts Tab ────────────────────────────────────────────────────────────────
export function PartsTab({
  user,
  onRefresh,
}: {
  user: AppUser;
  onRefresh: () => Promise<void>;
}) {
  const db = loadDb();
  const isAdmin = user.role === "administrator";
  const isInv = user.role === "inventory_manager";
  const canManage = isAdmin || isInv;
  const [msg, setMsg] = useState("");

  async function addPart(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    await createPart({
      name: String(f.get("name") || ""),
      sku: String(f.get("sku") || `SKU-${Date.now()}`),
      description: String(f.get("description") || ""),
      category: String(f.get("category") || "General"),
      unit_price: Number(f.get("unit_price") || 0),
      quantity: Number(f.get("quantity") || 0),
      min_stock: Number(f.get("min_stock") || 5),
      location: String(f.get("location") || "TBD"),
    });
    form.reset();
    setMsg("Part added to inventory.");
    await onRefresh();
  }

  async function removePart(p: Part) {
    if (!confirm(`Delete part "${p.name}"?`)) return;
    await deletePart(p.id);
    await onRefresh();
  }

  async function updateStock(p: Part) {
    const val = window.prompt("Enter new stock quantity:", String(p.quantity));
    if (val === null) return;
    const qty = Number(val);
    await updatePartQuantity(p.id, qty);
    await onRefresh();
  }

  return (
    <div className="tabSection">
      {canManage && (
        <div className="panel">
          <h2>Add New Part / Product Definition</h2>
          {msg && <p className="successText">{msg}</p>}
          <form className="formGrid" onSubmit={addPart}>
            <input name="name" required placeholder="Part name" />
            <input name="sku" placeholder="SKU (auto if blank)" />
            <input name="category" placeholder="Category" />
            <input name="unit_price" type="number" min="0" placeholder="Unit price (Rs)" />
            <input name="quantity" type="number" min="0" placeholder="Initial stock qty" />
            <input name="min_stock" type="number" min="0" placeholder="Min stock level" />
            <input name="location" placeholder="Warehouse location" />
            <input name="description" placeholder="Description" />
            <button type="submit">Add Part</button>
          </form>
        </div>
      )}
      <div className="panel">
        <h2>Parts Catalogue</h2>
        <div className="tableWrap">
          <table className="dataTable">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Min Stock</th>
                <th>Status</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {db.parts.map((p) => (
                <tr key={p.id}>
                  <td><code>{p.sku}</code></td>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>₹{p.unit_price.toLocaleString()}</td>
                  <td>{p.quantity}</td>
                  <td>{p.min_stock}</td>
                  <td>
                    <span className={`statusPill status-${p.status}`}>
                      {p.status.replace("_", " ")}
                    </span>
                  </td>
                  {canManage && (
                    <td className="actionsTd">
                      <button className="smBtn" onClick={() => updateStock(p)}>Update Stock</button>
                      {isAdmin && (
                        <button className="smBtn dangerBtn" onClick={() => removePart(p)}>Delete</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Quotations Tab ────────────────────────────────────────────────────────────
export function QuotationsTab({
  user,
  onRefresh,
}: {
  user: AppUser;
  onRefresh: () => Promise<void>;
}) {
  const db = loadDb();
  const isAdmin = user.role === "administrator";
  const isSupplier = user.role === "supplier";
  const [msg, setMsg] = useState("");
  const [adminNote, setAdminNote] = useState<Record<string, string>>({});

  // Supplier sees only their own quotations
  const mySupplier = isSupplier
    ? db.suppliers.find((s) => s.ownerUserId === user.id)
    : null;

  const quotations = isSupplier && mySupplier
    ? db.quotations.filter((q) => q.supplierId === mySupplier.id)
    : db.quotations;

  async function submitQuote(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!mySupplier) {
      setMsg("No supplier profile found for your account.");
      return;
    }
    const f = new FormData(form);
    const partId = String(f.get("partId") || "");
    const part = db.parts.find((p) => p.id === partId);
    if (!part) {
      setMsg("Please select a valid part.");
      return;
    }
    const qty = Number(f.get("quantity") || 1);
    const unitPrice = Number(f.get("unit_price") || 0);
    await submitQuotation({
      supplierId: mySupplier.id,
      partId: part.id,
      quantity: qty,
      unit_price: unitPrice,
      validity_days: Number(f.get("validity_days") || 30),
      notes: String(f.get("notes") || ""),
    });
    form.reset();
    setMsg("Quotation submitted. Awaiting admin approval.");
    await onRefresh();
  }

  async function respond(qId: string, decision: "approved" | "rejected") {
    const note = adminNote[qId] || "";
    await respondToQuotation(qId, decision, note);
    setMsg(`Quotation ${decision}.`);
    await onRefresh();
  }

  return (
    <div className="tabSection">
      {isSupplier && (
        <div className="panel">
          <h2>Submit New Quotation</h2>
          <p className="helperText">Provide pricing for a part. Admin will review and approve.</p>
          {msg && <p className="successText">{msg}</p>}
          <form className="formGrid" onSubmit={submitQuote}>
            <select name="partId" required>
              <option value="">Select Part…</option>
              {db.parts.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
            <input name="quantity" type="number" min="1" required placeholder="Quantity offered" />
            <input name="unit_price" type="number" min="0" required placeholder="Unit price (Rs)" />
            <input name="validity_days" type="number" min="1" placeholder="Validity (days)" defaultValue="30" />
            <input name="notes" placeholder="Notes / terms" />
            <button type="submit">Submit Quotation</button>
          </form>
        </div>
      )}
      <div className="panel">
        <h2>{isAdmin ? "All Quotations (Admin Review)" : "My Quotations"}</h2>
        {isAdmin && msg && <p className="successText">{msg}</p>}
        {quotations.length === 0 ? (
          <p className="helperText">No quotations found.</p>
        ) : (
          <div className="tableWrap">
            <table className="dataTable">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Part</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th>Validity</th>
                  <th>Status</th>
                  <th>Notes</th>
                  {isAdmin && <th>Admin Actions</th>}
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => (
                  <tr key={q.id}>
                    <td>{q.supplierName}</td>
                    <td>{q.partName}</td>
                    <td>{q.quantity}</td>
                    <td>₹{q.unit_price.toLocaleString()}</td>
                    <td>₹{q.total_price.toLocaleString()}</td>
                    <td>{q.validity_days}d</td>
                    <td>
                      <span className={`statusPill status-${q.status}`}>{q.status}</span>
                    </td>
                    <td>{q.notes || "—"}</td>
                    {isAdmin && q.status === "pending" && (
                      <td className="actionsTd" style={{ minWidth: 260 }}>
                        <input
                          className="smInput"
                          placeholder="Admin note…"
                          value={adminNote[q.id] || ""}
                          onChange={(e) => setAdminNote({ ...adminNote, [q.id]: e.target.value })}
                        />
                        <button className="smBtn successBtn" onClick={() => respond(q.id, "approved")}>Approve</button>
                        <button className="smBtn dangerBtn" onClick={() => respond(q.id, "rejected")}>Reject</button>
                      </td>
                    )}
                    {isAdmin && q.status !== "pending" && (
                      <td>
                        <span className="helperText">{q.adminNote || "—"}</span>
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
