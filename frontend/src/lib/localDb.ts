export type Role =
  | "administrator"
  | "inventory_manager"
  | "supplier"
  | "dealer"
  | "management";

export type AppUser = {
  id: string;
  username: string;
  password: string;
  role: Role;
  name: string;
};

// ─── Domain Entities ────────────────────────────────────────────────────────

export type Dealer = {
  id: string;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  address: string;
  status: "active" | "inactive" | "suspended";
  ownerUserId?: string;
  createdAt: string;
};

export type Supplier = {
  id: string;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  address: string;
  status: "approved" | "pending" | "rejected";
  ownerUserId?: string;
  createdAt: string;
};

export type Part = {
  id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  unit_price: number;
  quantity: number;
  min_stock: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  supplierId?: string;
  createdAt: string;
};

export type Quotation = {
  id: string;
  supplierId: string;
  supplierName: string;
  partId: string;
  partName: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  validity_days: number;
  notes: string;
  status: "pending" | "approved" | "rejected" | "expired";
  adminNote?: string;
  createdAt: string;
  respondedAt?: string;
};

export type Order = {
  id: string;
  dealerId: string;
  dealerName: string;
  partId: string;
  partName: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  delivery_address: string;
  notes: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  updatedAt: string;
};

export type Bill = {
  id: string;
  invoice_number: string;
  orderId: string;
  dealerId: string;
  dealerName: string;
  partName: string;
  quantity: number;
  subtotal: number;
  tax: number;
  total: number;
  payment_status: "unpaid" | "paid" | "overdue";
  due_date: string;
  paid_date?: string;
  createdAt: string;
};

export type InventoryItem = {
  id: string;
  partId: string;
  partName: string;
  sku: string;
  quantity: number;
  min_stock: number;
  location: string;
  last_updated: string;
};

export type WamsState = {
  users: AppUser[];
  dealers: Dealer[];
  suppliers: Supplier[];
  parts: Part[];
  quotations: Quotation[];
  orders: Order[];
  billing: Bill[];
  inventory: InventoryItem[];
};

// ─── Storage Keys ────────────────────────────────────────────────────────────

const DB_KEY = "wams_local_db_v2";
const SESSION_KEY = "wams_session_user";

// ─── Default State ───────────────────────────────────────────────────────────

const now = new Date().toISOString();

const defaultState: WamsState = {
  users: [
    {
      id: "u-admin",
      username: "admin",
      password: "admin123",
      role: "administrator",
      name: "Admin User",
    },
    {
      id: "u-inv",
      username: "inventory",
      password: "inv123",
      role: "inventory_manager",
      name: "Inventory Manager",
    },
    {
      id: "u-sup1",
      username: "supplier1",
      password: "sup123",
      role: "supplier",
      name: "Steel Works Ltd",
    },
    {
      id: "u-dealer1",
      username: "dealer1",
      password: "deal123",
      role: "dealer",
      name: "Metro Dealers",
    },
  ],
  dealers: [
    {
      id: "d-1",
      name: "Metro Dealers",
      company_name: "Metro Automotive Pvt Ltd",
      email: "metro@dealer.com",
      phone: "+91-9876543210",
      address: "12 Industrial Road, Mumbai",
      status: "active",
      ownerUserId: "u-dealer1",
      createdAt: now,
    },
  ],
  suppliers: [
    {
      id: "s-1",
      name: "Steel Works Ltd",
      company_name: "Steel Works Manufacturing",
      email: "info@steelworks.com",
      phone: "+91-9123456789",
      address: "45 Factory Lane, Pune",
      status: "approved",
      ownerUserId: "u-sup1",
      createdAt: now,
    },
  ],
  parts: [
    {
      id: "p-1",
      name: "Gear Unit",
      sku: "GU-001",
      description: "Heavy-duty gear unit for industrial machinery",
      category: "Mechanical",
      unit_price: 2500,
      quantity: 20,
      min_stock: 5,
      status: "in_stock",
      supplierId: "s-1",
      createdAt: now,
    },
    {
      id: "p-2",
      name: "Hydraulic Pump",
      sku: "HP-002",
      description: "High-pressure hydraulic pump",
      category: "Hydraulics",
      unit_price: 8500,
      quantity: 3,
      min_stock: 5,
      status: "low_stock",
      supplierId: "s-1",
      createdAt: now,
    },
    {
      id: "p-3",
      name: "Control Valve",
      sku: "CV-003",
      description: "Precision control valve",
      category: "Controls",
      unit_price: 1200,
      quantity: 0,
      min_stock: 10,
      status: "out_of_stock",
      createdAt: now,
    },
  ],
  quotations: [
    {
      id: "q-1",
      supplierId: "s-1",
      supplierName: "Steel Works Ltd",
      partId: "p-1",
      partName: "Gear Unit",
      quantity: 50,
      unit_price: 2200,
      total_price: 110000,
      validity_days: 30,
      notes: "Bulk discount applied. Delivery within 7 working days.",
      status: "pending",
      createdAt: now,
    },
  ],
  orders: [
    {
      id: "o-1",
      dealerId: "d-1",
      dealerName: "Metro Dealers",
      partId: "p-1",
      partName: "Gear Unit",
      quantity: 5,
      unit_price: 2500,
      total_amount: 12500,
      delivery_address: "12 Industrial Road, Mumbai",
      notes: "Urgent delivery required",
      status: "confirmed",
      createdAt: now,
      updatedAt: now,
    },
  ],
  billing: [
    {
      id: "b-1",
      invoice_number: "INV-20260001",
      orderId: "o-1",
      dealerId: "d-1",
      dealerName: "Metro Dealers",
      partName: "Gear Unit",
      quantity: 5,
      subtotal: 12500,
      tax: 2250,
      total: 14750,
      payment_status: "unpaid",
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      createdAt: now,
    },
  ],
  inventory: [
    {
      id: "inv-1",
      partId: "p-1",
      partName: "Gear Unit",
      sku: "GU-001",
      quantity: 20,
      min_stock: 5,
      location: "Shelf A-1",
      last_updated: now,
    },
    {
      id: "inv-2",
      partId: "p-2",
      partName: "Hydraulic Pump",
      sku: "HP-002",
      quantity: 3,
      min_stock: 5,
      location: "Shelf B-3",
      last_updated: now,
    },
    {
      id: "inv-3",
      partId: "p-3",
      partName: "Control Valve",
      sku: "CV-003",
      quantity: 0,
      min_stock: 10,
      location: "Shelf C-2",
      last_updated: now,
    },
  ],
};

// ─── Core DB Functions ───────────────────────────────────────────────────────

export function loadDb(): WamsState {
  if (typeof window === "undefined") return defaultState;
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    localStorage.setItem(DB_KEY, JSON.stringify(defaultState));
    return JSON.parse(JSON.stringify(defaultState)) as WamsState;
  }
  try {
    const parsed = JSON.parse(raw) as WamsState;
    // Merge to ensure new default fields exist
    return {
      users: parsed.users?.length ? parsed.users : defaultState.users,
      dealers: parsed.dealers ?? defaultState.dealers,
      suppliers: parsed.suppliers ?? defaultState.suppliers,
      parts: parsed.parts ?? defaultState.parts,
      quotations: parsed.quotations ?? defaultState.quotations,
      orders: parsed.orders ?? defaultState.orders,
      billing: parsed.billing ?? defaultState.billing,
      inventory: parsed.inventory ?? defaultState.inventory,
    };
  } catch {
    localStorage.setItem(DB_KEY, JSON.stringify(defaultState));
    return JSON.parse(JSON.stringify(defaultState)) as WamsState;
  }
}

export function saveDb(state: WamsState) {
  localStorage.setItem(DB_KEY, JSON.stringify(state));
}

export function resetDb() {
  localStorage.removeItem(DB_KEY);
}

// ─── Session ─────────────────────────────────────────────────────────────────

export function getSessionUser(): AppUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

export function login(username: string, password: string): AppUser | null {
  const db = loadDb();
  const user = db.users.find((u) => u.username === username && u.password === password);
  if (!user) return null;
  ensureRoleProfile(db, user);
  saveDb(db);
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export function register(input: {
  name: string;
  username: string;
  password: string;
  role: Role;
}): { user?: AppUser; error?: string } {
  const db = loadDb();
  if (db.users.some((u) => u.username === input.username)) {
    return { error: "Username already exists." };
  }
  const user: AppUser = {
    id: `u-${Date.now()}`,
    name: input.name,
    username: input.username,
    password: input.password,
    role: input.role,
  };
  db.users.unshift(user);
  ensureRoleProfile(db, user);
  saveDb(db);
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return { user };
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

// ─── Generic CRUD helpers ────────────────────────────────────────────────────

export function insertItem<K extends keyof WamsState>(
  key: K,
  item: WamsState[K] extends Array<infer T> ? T : never
) {
  const db = loadDb();
  const list = db[key];
  if (Array.isArray(list)) {
    (list as unknown[]).unshift(item as unknown);
    saveDb(db);
  }
}

export function updateItem<K extends keyof WamsState>(
  key: K,
  id: string,
  patch: Partial<WamsState[K] extends Array<infer T> ? T : never>
) {
  const db = loadDb();
  const list = db[key];
  if (!Array.isArray(list)) return;
  const idx = (list as Array<{ id: string }>).findIndex((row) => row.id === id);
  if (idx < 0) return;
  (list as Array<Record<string, unknown>>)[idx] = {
    ...(list as Array<Record<string, unknown>>)[idx],
    ...(patch as Record<string, unknown>),
  };
  saveDb(db);
}

export function deleteItem<K extends keyof WamsState>(key: K, id: string) {
  const db = loadDb();
  const list = db[key];
  if (!Array.isArray(list)) return;
  db[key] = (list as Array<{ id: string }>).filter((row) => row.id !== id) as WamsState[K];
  saveDb(db);
}

// ─── Domain Workflow Functions ────────────────────────────────────────────────

/** Supplier submits a quotation for a part */
export function submitQuotation(data: Omit<Quotation, "id" | "status" | "createdAt">): Quotation {
  const q: Quotation = {
    ...data,
    id: `q-${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  insertItem("quotations", q);
  return q;
}

/** Admin approves or rejects a quotation */
export function respondToQuotation(
  quotationId: string,
  decision: "approved" | "rejected",
  adminNote: string
) {
  updateItem("quotations", quotationId, {
    status: decision,
    adminNote,
    respondedAt: new Date().toISOString(),
  });
  // If approved, update part price from supplier quotation
  if (decision === "approved") {
    const db = loadDb();
    const q = db.quotations.find((q) => q.id === quotationId);
    if (q) {
      // Update inventory stock when quotation is approved (supplier delivers goods)
      const inv = db.inventory.find((i) => i.partId === q.partId);
      if (inv) {
        updateItem("inventory", inv.id, {
          quantity: inv.quantity + q.quantity,
          last_updated: new Date().toISOString(),
        });
      }
      // Update part stock
      const part = db.parts.find((p) => p.id === q.partId);
      if (part) {
        const newQty = part.quantity + q.quantity;
        updateItem("parts", q.partId, {
          quantity: newQty,
          unit_price: q.unit_price,
          status: newQty > part.min_stock ? "in_stock" : newQty > 0 ? "low_stock" : "out_of_stock",
        });
      }
    }
  }
}

/** Dealer places an order for a part */
export function placeOrder(data: Omit<Order, "id" | "status" | "createdAt" | "updatedAt">): { order?: Order; error?: string } {
  const db = loadDb();
  const part = db.parts.find((p) => p.id === data.partId);
  if (!part) return { error: "Part not found." };
  if (part.quantity < data.quantity) {
    return { error: `Insufficient stock. Available: ${part.quantity}` };
  }
  const order: Order = {
    ...data,
    id: `o-${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  insertItem("orders", order);
  return { order };
}

/** Admin/Inventory Manager processes an order: confirms, reserves stock, generates billing */
export function processOrder(orderId: string): { bill?: Bill; error?: string } {
  const db = loadDb();
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) return { error: "Order not found." };
  if (order.status !== "pending" && order.status !== "confirmed") {
    return { error: "Order cannot be processed in its current status." };
  }

  const part = db.parts.find((p) => p.id === order.partId);
  if (!part) return { error: "Part not found." };
  if (part.quantity < order.quantity) {
    return { error: `Insufficient stock. Available: ${part.quantity}` };
  }

  // Deduct stock
  const newQty = part.quantity - order.quantity;
  updateItem("parts", part.id, {
    quantity: newQty,
    status: newQty > part.min_stock ? "in_stock" : newQty > 0 ? "low_stock" : "out_of_stock",
  });
  // Update inventory
  const inv = db.inventory.find((i) => i.partId === part.id);
  if (inv) {
    updateItem("inventory", inv.id, { quantity: newQty, last_updated: new Date().toISOString() });
  }

  // Update order to processing
  updateItem("orders", orderId, { status: "processing", updatedAt: new Date().toISOString() });

  // Generate bill
  const subtotal = order.total_amount;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;
  const invoiceNum = `INV-${new Date().getFullYear()}${String(db.billing.length + 1).padStart(4, "0")}`;
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const bill: Bill = {
    id: `b-${Date.now()}`,
    invoice_number: invoiceNum,
    orderId: order.id,
    dealerId: order.dealerId,
    dealerName: order.dealerName,
    partName: order.partName,
    quantity: order.quantity,
    subtotal,
    tax,
    total,
    payment_status: "unpaid",
    due_date: dueDate,
    createdAt: new Date().toISOString(),
  };
  insertItem("billing", bill);
  return { bill };
}

/** Mark a bill as paid */
export function markBillPaid(billId: string) {
  updateItem("billing", billId, {
    payment_status: "paid",
    paid_date: new Date().toISOString().slice(0, 10),
  });
}

/** Update order status */
export function updateOrderStatus(orderId: string, status: Order["status"]) {
  updateItem("orders", orderId, { status, updatedAt: new Date().toISOString() });
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export type ReportData = {
  totalRevenue: number;
  totalOrders: number;
  totalPaid: number;
  totalUnpaid: number;
  pendingOrders: number;
  processingOrders: number;
  deliveredOrders: number;
  lowStockParts: number;
  outOfStockParts: number;
  pendingQuotations: number;
  approvedQuotations: number;
  topParts: { name: string; orders: number; revenue: number }[];
};

export function generateReport(db: WamsState): ReportData {
  const paidBills = db.billing.filter((b) => b.payment_status === "paid");
  const unpaidBills = db.billing.filter((b) => b.payment_status !== "paid");
  const totalRevenue = paidBills.reduce((s, b) => s + b.total, 0);
  const totalPaid = paidBills.reduce((s, b) => s + b.total, 0);
  const totalUnpaid = unpaidBills.reduce((s, b) => s + b.total, 0);

  const partOrderCount: Record<string, { orders: number; revenue: number }> = {};
  db.orders.forEach((o) => {
    if (!partOrderCount[o.partName]) partOrderCount[o.partName] = { orders: 0, revenue: 0 };
    partOrderCount[o.partName].orders += 1;
    partOrderCount[o.partName].revenue += o.total_amount;
  });
  const topParts = Object.entries(partOrderCount)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    totalRevenue,
    totalOrders: db.orders.length,
    totalPaid,
    totalUnpaid,
    pendingOrders: db.orders.filter((o) => o.status === "pending").length,
    processingOrders: db.orders.filter((o) => o.status === "processing").length,
    deliveredOrders: db.orders.filter((o) => o.status === "delivered").length,
    lowStockParts: db.parts.filter((p) => p.status === "low_stock").length,
    outOfStockParts: db.parts.filter((p) => p.status === "out_of_stock").length,
    pendingQuotations: db.quotations.filter((q) => q.status === "pending").length,
    approvedQuotations: db.quotations.filter((q) => q.status === "approved").length,
    topParts,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ensureRoleProfile(db: WamsState, user: AppUser) {
  if (user.role === "dealer") {
    const exists = db.dealers.some((d) => d.ownerUserId === user.id);
    if (!exists) {
      db.dealers.unshift({
        id: `d-${Date.now()}`,
        name: user.name,
        company_name: `${user.name} Ltd`,
        email: `${user.username}@dealer.local`,
        phone: "",
        address: "",
        status: "active",
        ownerUserId: user.id,
        createdAt: new Date().toISOString(),
      });
    }
  }
  if (user.role === "supplier") {
    const exists = db.suppliers.some((s) => s.ownerUserId === user.id);
    if (!exists) {
      db.suppliers.unshift({
        id: `s-${Date.now()}`,
        name: user.name,
        company_name: `${user.name} Ltd`,
        email: `${user.username}@supplier.local`,
        phone: "",
        address: "",
        status: "approved",
        ownerUserId: user.id,
        createdAt: new Date().toISOString(),
      });
    }
  }
}
