"use client";
import { FormEvent, useState } from "react";
import { Dealer, Supplier, loadDb, createDealer, updateDealer, deleteDealer, createSupplier, updateSupplier, deleteSupplier } from "@/lib/localDb";

// ─── Dealers Tab ─────────────────────────────────────────────────────────────
export function DealersTab({
  isAdmin,
  onRefresh,
}: {
  isAdmin: boolean;
  onRefresh: () => Promise<void>;
}) {
  const db = loadDb();
  const dealers = db.dealers;
  const [msg, setMsg] = useState("");

  async function handleCreateDealer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await createDealer({
      name: String(f.get("name") || ""),
      company_name: String(f.get("company_name") || ""),
      email: String(f.get("email") || ""),
      phone: String(f.get("phone") || ""),
      address: String(f.get("address") || ""),
      status: "active",
    });
    e.currentTarget.reset();
    setMsg("Dealer added successfully.");
    await onRefresh();
  }

  async function toggleStatus(d: Dealer) {
    await updateDealer(d.id, { status: d.status === "active" ? "inactive" : "active" });
    await onRefresh();
  }

  async function remove(d: Dealer) {
    if (!confirm(`Delete dealer "${d.name}"?`)) return;
    await deleteDealer(d.id);
    await onRefresh();
  }

  return (
    <div className="tabSection">
      {isAdmin && (
        <div className="panel">
          <h2>Register New Dealer</h2>
          {msg && <p className="successText">{msg}</p>}
          <form className="formGrid" onSubmit={handleCreateDealer}>
            <input name="name" required placeholder="Contact name" />
            <input name="company_name" required placeholder="Company name" />
            <input name="email" type="email" required placeholder="Email" />
            <input name="phone" placeholder="Phone" />
            <input name="address" placeholder="Address" />
            <button type="submit">Add Dealer</button>
          </form>
        </div>
      )}
      <div className="panel">
        <h2>Dealers List</h2>
        {dealers.length === 0 ? (
          <p className="helperText">No dealers registered.</p>
        ) : (
          <div className="tableWrap">
            <table className="dataTable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {dealers.map((d) => (
                  <tr key={d.id}>
                    <td>{d.name}</td>
                    <td>{d.company_name}</td>
                    <td>{d.email}</td>
                    <td>{d.phone || "—"}</td>
                    <td>
                      <span className={`statusPill status-${d.status}`}>{d.status}</span>
                    </td>
                    {isAdmin && (
                      <td className="actionsTd">
                        <button className="smBtn" onClick={() => toggleStatus(d)}>
                          {d.status === "active" ? "Suspend" : "Activate"}
                        </button>
                        <button className="smBtn dangerBtn" onClick={() => remove(d)}>
                          Delete
                        </button>
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

// ─── Suppliers Tab ────────────────────────────────────────────────────────────
export function SuppliersTab({
  isAdmin,
  onRefresh,
}: {
  isAdmin: boolean;
  onRefresh: () => Promise<void>;
}) {
  const db = loadDb();
  const suppliers = db.suppliers;
  const [msg, setMsg] = useState("");

  async function handleCreateSupplier(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await createSupplier({
      name: String(f.get("name") || ""),
      company_name: String(f.get("company_name") || ""),
      email: String(f.get("email") || ""),
      phone: String(f.get("phone") || ""),
      address: String(f.get("address") || ""),
      status: "pending",
    });
    e.currentTarget.reset();
    setMsg("Supplier registration submitted for approval.");
    await onRefresh();
  }

  async function approveSupplier(s: Supplier) {
    await updateSupplier(s.id, { status: "approved" });
    await onRefresh();
  }

  async function rejectSupplier(s: Supplier) {
    await updateSupplier(s.id, { status: "rejected" });
    await onRefresh();
  }

  async function remove(s: Supplier) {
    if (!confirm(`Delete supplier "${s.name}"?`)) return;
    await deleteSupplier(s.id);
    await onRefresh();
  }

  return (
    <div className="tabSection">
      {isAdmin && (
        <div className="panel">
          <h2>Register New Supplier</h2>
          {msg && <p className="successText">{msg}</p>}
          <form className="formGrid" onSubmit={handleCreateSupplier}>
            <input name="name" required placeholder="Contact name" />
            <input name="company_name" required placeholder="Company name" />
            <input name="email" type="email" required placeholder="Email" />
            <input name="phone" placeholder="Phone" />
            <input name="address" placeholder="Address" />
            <button type="submit">Add Supplier</button>
          </form>
        </div>
      )}
      <div className="panel">
        <h2>Suppliers List</h2>
        <div className="tableWrap">
          <table className="dataTable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.company_name}</td>
                  <td>{s.email}</td>
                  <td>
                    <span className={`statusPill status-${s.status}`}>{s.status}</span>
                  </td>
                  {isAdmin && (
                    <td className="actionsTd">
                      {s.status === "pending" && (
                        <>
                          <button className="smBtn successBtn" onClick={() => approveSupplier(s)}>Approve</button>
                          <button className="smBtn dangerBtn" onClick={() => rejectSupplier(s)}>Reject</button>
                        </>
                      )}
                      <button className="smBtn dangerBtn" onClick={() => remove(s)}>Delete</button>
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
