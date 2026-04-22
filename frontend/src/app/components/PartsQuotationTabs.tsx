"use client";
import { FormEvent, useState } from "react";
import {
  loadDb,
  saveDb,
  deleteItem,
  updateItem,
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
  onRefresh: () => void;
}) {
  const db = loadDb();
  const isAdmin = user.role === "administrator";
  const isInv = user.role === "inventory_manager";
  const canManage = isAdmin || isInv;
  const [msg, setMsg] = useState("");

  function addPart(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const qty = Number(f.get("quantity") || 0);
    const minStock = Number(f.get("min_stock") || 5);
    const db2 = loadDb();
    const newPart: Part = {
      id: `p-${Date.now()}`,
      name: String(f.get("name") || ""),
      sku: String(f.get("sku") || `SKU-${Date.now()}`),
      description: String(f.get("description") || ""),
      category: String(f.get("category") || "General"),
      unit_price: Number(f.get("unit_price") || 0),
      quantity: qty,
      min_stock: minStock,
      status: qty > minStock ? "in_stock" : qty > 0 ? "low_stock" : "out_of_stock",
      createdAt: new Date().toISOString(),
    };
    db2.parts.unshift(newPart);
    // Also add to inventory
    db2.inventory.unshift({
      id: `inv-${Date.now()}`,
      partId: newPart.id,
      partName: newPart.name,
      sku: newPart.sku,
      quantity: qty,
      min_stock: minStock,
      location: String(f.get("location") || "TBD"),
      last_updated: new Date().toISOString(),
    });
    saveDb(db2);
    e.currentTarget.reset();
    setMsg("Part added to inventory.");
    onRefresh();
  }

  function removePart(p: Part) {
    if (!confirm(`Delete part "${p.name}"?`)) return;
    deleteItem("parts", p.id);
    onRefresh();
  }

  function updateStock(p: Part) {
    const val = window.prompt("Enter new stock quantity:", String(p.quantity));
    if (val === null) return;
    const qty = Number(val);
    updateItem("parts", p.id, {
      quantity: qty,
      status: qty > p.min_stock ? "in_stock" : qty > 0 ? "low_stock" : "out_of_stock",
    });
    const inv = db.inventory.find((i) => i.partId === p.id);
    if (inv) {
      updateItem("inventory", inv.id, { quantity: qty, last_updated: new Date().toISOString() });
    }
    onRefresh();
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
  onRefresh: () => void;
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

  function submitQuote(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!mySupplier) {
      setMsg("No supplier profile found for your account.");
      return;
    }
    const f = new FormData(e.currentTarget);
    const partId = String(f.get("partId") || "");
    const part = db.parts.find((p) => p.id === partId);
    if (!part) {
      setMsg("Please select a valid part.");
      return;
    }
    const qty = Number(f.get("quantity") || 1);
    const unitPrice = Number(f.get("unit_price") || 0);
    submitQuotation({
      supplierId: mySupplier.id,
      supplierName: mySupplier.name,
      partId: part.id,
      partName: part.name,
      quantity: qty,
      unit_price: unitPrice,
      total_price: qty * unitPrice,
      validity_days: Number(f.get("validity_days") || 30),
      notes: String(f.get("notes") || ""),
    });
    e.currentTarget.reset();
    setMsg("Quotation submitted. Awaiting admin approval.");
    onRefresh();
  }

  function respond(qId: string, decision: "approved" | "rejected") {
    const note = adminNote[qId] || "";
    respondToQuotation(qId, decision, note);
    setMsg(`Quotation ${decision}.`);
    onRefresh();
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
