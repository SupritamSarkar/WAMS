"use client";

import { FormEvent, useState, useCallback, useEffect } from "react";
import { getSessionUser, login, logout, register, loadDb, generateReport, syncFromBackend, Role, AppUser } from "@/lib/localDb";
import { DealersTab, SuppliersTab } from "./components/DealerSupplierTabs";
import { PartsTab, QuotationsTab } from "./components/PartsQuotationTabs";
import { OrdersTab, BillingTab } from "./components/OrdersBillingTabs";
import { ReportsTab, InventoryTab } from "./components/ReportsInventoryTabs";

// ─── Tab config per role ──────────────────────────────────────────────────────
function getRoleTabs(role: Role) {
  switch (role) {
    case "dealer": return ["dashboard", "orders", "billing"];
    case "supplier": return ["dashboard", "quotations", "parts"];
    case "inventory_manager": return ["dashboard", "parts", "inventory", "orders", "reports"];
    case "management": return ["dashboard", "billing", "reports"];
    case "administrator": return ["dashboard", "dealers", "suppliers", "parts", "quotations", "orders", "billing", "inventory", "reports"];
    default: return ["dashboard"];
  }
}

const TAB_LABELS: Record<string, string> = {
  dashboard: "Dashboard", dealers: "Dealers", suppliers: "Suppliers",
  parts: "Parts", quotations: "Quotations", orders: "Orders",
  billing: "Billing", inventory: "Inventory", reports: "Reports",
};

// ─── Dashboard summaries ──────────────────────────────────────────────────────
function DashboardTab({ user }: { user: AppUser }) {
  const db = loadDb();
  const role = user.role;
  const r = generateReport(db);

  const isDealer = role === "dealer";
  const isSupplier = role === "supplier";
  const isAdmin = role === "administrator";
  const isInv = role === "inventory_manager";
  const isMgmt = role === "management";

  const myDealer = isDealer ? db.dealers.find((d) => d.ownerUserId === user.id) : null;
  const mySupplier = isSupplier ? db.suppliers.find((s) => s.ownerUserId === user.id) : null;
  const myOrders = isDealer && myDealer ? db.orders.filter((o) => o.dealerId === myDealer.id) : [];
  const myBills = isDealer && myDealer ? db.billing.filter((b) => b.dealerId === myDealer.id) : [];
  const myQuotes = isSupplier && mySupplier ? db.quotations.filter((q) => q.supplierId === mySupplier.id) : [];

  const cards: { label: string; value: string | number; color?: string }[] = [];

  if (isDealer) {
    cards.push(
      { label: "My Orders", value: myOrders.length },
      { label: "Pending Orders", value: myOrders.filter((o) => o.status === "pending").length, color: "amber" },
      { label: "Total Spent", value: `₹${myOrders.reduce((s, o) => s + o.total_amount, 0).toLocaleString()}` },
      { label: "Unpaid Bills", value: myBills.filter((b) => b.payment_status === "unpaid").length, color: "red" },
    );
  } else if (isSupplier) {
    cards.push(
      { label: "My Quotations", value: myQuotes.length },
      { label: "Pending Approval", value: myQuotes.filter((q) => q.status === "pending").length, color: "amber" },
      { label: "Approved", value: myQuotes.filter((q) => q.status === "approved").length, color: "green" },
      { label: "Rejected", value: myQuotes.filter((q) => q.status === "rejected").length, color: "red" },
    );
  } else if (isInv) {
    cards.push(
      { label: "Total Parts", value: db.parts.length },
      { label: "Low Stock", value: r.lowStockParts, color: "amber" },
      { label: "Out of Stock", value: r.outOfStockParts, color: "red" },
      { label: "Pending Orders", value: r.pendingOrders },
    );
  } else if (isMgmt) {
    cards.push(
      { label: "Total Revenue", value: `₹${r.totalRevenue.toLocaleString()}`, color: "green" },
      { label: "Unpaid", value: `₹${r.totalUnpaid.toLocaleString()}`, color: "red" },
      { label: "Total Orders", value: r.totalOrders },
      { label: "Delivered", value: r.deliveredOrders, color: "green" },
    );
  } else if (isAdmin) {
    cards.push(
      { label: "Dealers", value: db.dealers.length },
      { label: "Suppliers", value: db.suppliers.length },
      { label: "Total Orders", value: r.totalOrders },
      { label: "Pending Quotations", value: r.pendingQuotations, color: "amber" },
      { label: "Revenue", value: `₹${r.totalRevenue.toLocaleString()}`, color: "green" },
      { label: "Unpaid", value: `₹${r.totalUnpaid.toLocaleString()}`, color: "red" },
      { label: "Low Stock", value: r.lowStockParts, color: "amber" },
      { label: "Out of Stock", value: r.outOfStockParts, color: "red" },
    );
  }

  return (
    <div className="tabSection">
      <div className="dashWelcome">
        <h2>Welcome back, {user.name}</h2>
        <p className="helperText">Role: <strong>{role.replace("_", " ")}</strong></p>
      </div>
      <div className="dashGrid">
        {cards.map((c) => (
          <div key={c.label} className="dashCard">
            <span className="dashLabel">{c.label}</span>
            <span className={`dashValue ${c.color ? `val-${c.color}` : ""}`}>{c.value}</span>
          </div>
        ))}
      </div>
      {/* Quick tips */}
      <div className="panel tipPanel">
        <h3>Quick Guide</h3>
        {isDealer && <p>Go to <strong>Orders</strong> to place new orders for parts. View your invoices in <strong>Billing</strong>.</p>}
        {isSupplier && <p>Go to <strong>Quotations</strong> to submit pricing for parts. The admin will approve or reject them.</p>}
        {isInv && <p>Manage stock in <strong>Parts</strong> and view real-time availability in <strong>Inventory</strong>.</p>}
        {isMgmt && <p>View full financial reports in <strong>Reports</strong>. Mark invoices as paid in <strong>Billing</strong>.</p>}
        {isAdmin && <p>Full access: manage dealers, approve suppliers, review quotations, process orders, and generate reports.</p>}
      </div>
    </div>
  );
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }: { onAuth: (u: AppUser) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [err, setErr] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const user = await login(String(f.get("username")), String(f.get("password")));
    if (!user) { setErr("Invalid credentials. Try: admin / admin123"); return; }
    onAuth(user);
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const res = await register({
      name: String(f.get("name")),
      username: String(f.get("username")),
      password: String(f.get("password")),
      role: String(f.get("role")) as Role,
    });
    if (res.error) { setErr(res.error); return; }
    if (res.user) onAuth(res.user);
  }

  return (
    <main className="authShell">
      <section className="authCard fadeIn">
        <div className="authBrand">
          <span className="brandIcon">⚙</span>
          <h1>WAMS</h1>
          <p className="helperText">Warehouse &amp; Auto Management System</p>
        </div>

        <div className="authTabs">
          <button className={`authTabBtn ${mode === "login" ? "active" : ""}`} onClick={() => { setMode("login"); setErr(""); }}>Login</button>
          <button className={`authTabBtn ${mode === "register" ? "active" : ""}`} onClick={() => { setMode("register"); setErr(""); }}>Register</button>
        </div>

        {mode === "login" ? (
          <form className="authForm" onSubmit={handleLogin}>
            <label>Username</label>
            <input name="username" required placeholder="e.g. admin" />
            <label>Password</label>
            <input name="password" type="password" required placeholder="Password" />
            <button type="submit" className="authSubmit">Login</button>
          </form>
        ) : (
          <form className="authForm" onSubmit={handleRegister}>
            <label>Full Name</label>
            <input name="name" required placeholder="Your full name" />
            <label>Username</label>
            <input name="username" required placeholder="Choose a username" />
            <label>Password</label>
            <input name="password" type="password" required placeholder="Password" />
            <label>Role</label>
            <select name="role" defaultValue="dealer">
              <option value="dealer">Dealer</option>
              <option value="supplier">Supplier</option>
              <option value="inventory_manager">Inventory Manager</option>
              <option value="management">Management</option>
            </select>
            <button type="submit" className="authSubmit">Create Account</button>
          </form>
        )}

        {err && <p className="errorText">{err}</p>}

        <div className="demoAccounts">
          <p className="helperText" style={{ fontSize: "0.8rem" }}>
            Demo accounts: <strong>admin</strong>/admin123 · <strong>supplier1</strong>/sup123 · <strong>dealer1</strong>/deal123 · <strong>inventory</strong>/inv123
          </p>
        </div>
      </section>
    </main>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [sessionUser, setSessionUser] = useState<AppUser | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [tick, setTick] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const init = async () => {
      setSessionUser(getSessionUser());
      try {
        await syncFromBackend();
      } catch {}
      setHydrated(true);
    };
    init();
  }, []);

  const refresh = useCallback(async () => {
    try {
      await syncFromBackend();
    } catch {}
    setTick((t) => t + 1);
  }, []);

  // Don't render anything until client-side hydration is done
  if (!hydrated) return null;

  if (!sessionUser) {
    return <AuthScreen onAuth={(u) => { setSessionUser(u); setActiveTab("dashboard"); }} />;
  }

  const role = sessionUser.role as Role;
  const tabs = getRoleTabs(role);
  const visibleTab = tabs.includes(activeTab) ? activeTab : "dashboard";

  return (
    <main className="shell fadeIn" key={tick}>
      <header className="topBar">
        <div className="topBarLeft">
          <span className="brandMark">⚙</span>
          <div>
            <p className="topBarWelcome">Welcome to WAMS</p>
            <span className="topBarSub">Warehouse &amp; Auto Management System</span>
          </div>
        </div>
        <div className="topBarRight">
          <div>
            <p className="topBarUser">{sessionUser.name}</p>
            <span className="roleBadge">{role.replace("_", " ")}</span>
          </div>
          <button className="logoutBtn" onClick={() => { logout(); setSessionUser(null); }}>Logout</button>
        </div>
      </header>

      <nav className="tabRow">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tabButton ${visibleTab === tab ? "active" : ""}`}
            onClick={() => { setActiveTab(tab); refresh(); }}
          >
            {TAB_LABELS[tab] || tab}
          </button>
        ))}
      </nav>

      <div className="contentArea">
        {visibleTab === "dashboard" && <DashboardTab user={sessionUser} />}
        {visibleTab === "dealers" && <DealersTab isAdmin={role === "administrator"} onRefresh={refresh} />}
        {visibleTab === "suppliers" && <SuppliersTab isAdmin={role === "administrator"} onRefresh={refresh} />}
        {visibleTab === "parts" && <PartsTab user={sessionUser} onRefresh={refresh} />}
        {visibleTab === "quotations" && <QuotationsTab user={sessionUser} onRefresh={refresh} />}
        {visibleTab === "orders" && <OrdersTab user={sessionUser} onRefresh={refresh} />}
        {visibleTab === "billing" && <BillingTab user={sessionUser} onRefresh={refresh} />}
        {visibleTab === "inventory" && <InventoryTab user={sessionUser} />}
        {visibleTab === "reports" && <ReportsTab user={sessionUser} />}
      </div>
    </main>
  );
}
