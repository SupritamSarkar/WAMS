import { apiRequest } from "./api";

export type Role =
  | "administrator"
  | "inventory_manager"
  | "supplier"
  | "dealer"
  | "management";

export type AppUser = {
  id: string;
  username?: string;
  email?: string;
  password?: string;
  role: Role;
  name: string;
};

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
  part_number?: string;
  description: string;
  category: string;
  unit_price: number;
  quantity: number;
  min_stock: number;
  min_quantity?: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  supplierId?: string;
  location?: string;
  createdAt: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  description: string;
  quantity: number;
  min_quantity: number;
  unit_price: number;
  unit?: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
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
  productId: string;
  productName: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  delivery_address: string;
  notes: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "fulfilled";
  createdAt: string;
  updatedAt: string;
};

export type Bill = {
  id: string;
  invoice_number: string;
  orderId?: string;
  dealerId: string;
  dealerName: string;
  partName: string;
  quantity: number;
  subtotal: number;
  tax: number;
  total: number;
  payment_status: "unpaid" | "paid" | "overdue" | "generated" | "pending";
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
  products: Product[];
  quotations: Quotation[];
  orders: Order[];
  billing: Bill[];
  inventory: InventoryItem[];
};

export type ReportData = {
  totalRevenue: number;
  totalUnpaid: number;
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  deliveredOrders: number;
  lowStockParts: number;
  outOfStockParts: number;
  pendingQuotations: number;
  approvedQuotations: number;
  topParts: { name: string; orders: number; revenue: number }[];
};

type ApiRecord = Record<string, unknown>;

const DB_KEY = "wams_api_cache_v1";
const SESSION_KEY = "wams_session_user_v1";
const TOKEN_KEY="***";

function defaultState(): WamsState {
  return {
    users: [],
    dealers: [],
    suppliers: [],
    parts: [],
    products: [],
    quotations: [],
    orders: [],
    billing: [],
    inventory: [],
  };
}

function computeStockStatus(quantity: number, min: number) {
  if (quantity <= 0) return "out_of_stock" as const;
  if (quantity <= min) return "low_stock" as const;
  return "in_stock" as const;
}

function saveCache(state: WamsState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DB_KEY, JSON.stringify(state));
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asOptionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" ? value : Number(value ?? fallback);
}

export function loadDb(): WamsState {
  if (typeof window === "undefined") return defaultState();
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) return defaultState();
  try {
    return JSON.parse(raw) as WamsState;
  } catch {
    return defaultState();
  }
}

function normalizeDealer(d: ApiRecord): Dealer {
  return {
    id: asString(d.id),
    name: asString(d.name),
    company_name: asString(d.company_name),
    email: asString(d.email),
    phone: asString(d.phone),
    address: asString(d.address),
    status: asString(d.status, "active") as Dealer["status"],
    ownerUserId: asOptionalString(d.owner_user_id),
    createdAt: asString(d.created_at, new Date().toISOString()),
  };
}

function normalizeSupplier(s: ApiRecord): Supplier {
  return {
    id: asString(s.id),
    name: asString(s.name),
    company_name: asString(s.company_name),
    email: asString(s.email),
    phone: asString(s.phone),
    address: asString(s.address),
    status: asString(s.status, "pending") as Supplier["status"],
    ownerUserId: asOptionalString(s.owner_user_id),
    createdAt: asString(s.created_at, new Date().toISOString()),
  };
}

function normalizePart(p: ApiRecord): Part {
  const min = asNumber(p.min_stock ?? p.min_quantity, 0);
  const quantity = asNumber(p.quantity, 0);
  return {
    id: asString(p.id),
    name: asString(p.name),
    sku: asString(p.sku ?? p.part_number ?? p.id),
    part_number: asOptionalString(p.part_number),
    description: asString(p.description),
    category: asString(p.category, "General"),
    unit_price: asNumber(p.unit_price, 0),
    quantity,
    min_stock: min,
    min_quantity: asNumber(p.min_quantity, min),
    status: computeStockStatus(quantity, min),
    supplierId: asOptionalString(p.supplier_id),
    location: asString(p.location, "Warehouse"),
    createdAt: asString(p.created_at, new Date().toISOString()),
  };
}

function normalizeProduct(p: ApiRecord): Product {
  const min = asNumber(p.min_quantity, 0);
  const quantity = asNumber(p.quantity, 0);
  return {
    id: asString(p.id),
    name: asString(p.name),
    sku: asString(p.sku ?? p.id),
    description: asString(p.description),
    quantity,
    min_quantity: min,
    unit_price: asNumber(p.unit_price, 0),
    unit: asString(p.unit, "pcs"),
    status: computeStockStatus(quantity, min),
    createdAt: asString(p.created_at, new Date().toISOString()),
  };
}

function normalizeQuotation(q: ApiRecord, suppliers: Supplier[], parts: Part[]): Quotation {
  const supplier = suppliers.find((s) => s.id === asString(q.supplier_id));
  const part = parts.find((p) => p.id === asString(q.part_id));
  const quantity = asNumber(q.quantity, 0);
  const unitPrice = asNumber(q.unit_price ?? q.price, 0);
  const created = asString(q.created_at, new Date().toISOString());
  const validUntil = q.valid_until ? new Date(asString(q.valid_until, created)).getTime() : new Date(created).getTime();
  const validityDays = Math.max(1, Math.round((validUntil - new Date(created).getTime()) / (1000 * 60 * 60 * 24)) || 30);
  return {
    id: asString(q.id),
    supplierId: asString(q.supplier_id),
    supplierName: supplier?.name || asString((q.suppliers as ApiRecord | undefined)?.name, "Unknown Supplier"),
    partId: asString(q.part_id),
    partName: part?.name || asString((q.parts as ApiRecord | undefined)?.name, "Unknown Part"),
    quantity,
    unit_price: unitPrice,
    total_price: asNumber(q.total_price, quantity * unitPrice),
    validity_days: validityDays,
    notes: asString(q.notes),
    status: (asString(q.status, "pending") === "accepted" ? "approved" : asString(q.status, "pending")) as Quotation["status"],
    adminNote: asString(q.admin_note),
    createdAt: created,
    respondedAt: asOptionalString(q.updated_at),
  };
}

function normalizeOrder(o: ApiRecord, dealers: Dealer[], products: Product[]): Order {
  const dealer = dealers.find((d) => d.id === asString(o.dealer_id));
  const nestedProduct = o.products as ApiRecord | undefined;
  const product = products.find((p) => p.id === asString(o.product_id));
  const quantity = asNumber(o.quantity, 0);
  const unitPrice = asNumber(product?.unit_price ?? nestedProduct?.unit_price, 0);
  return {
    id: asString(o.id),
    dealerId: asString(o.dealer_id),
    dealerName: dealer?.name || asString((o.dealers as ApiRecord | undefined)?.name, "Unknown Dealer"),
    productId: asString(o.product_id),
    productName: product?.name || asString(nestedProduct?.name, "Unknown Product"),
    quantity,
    unit_price: unitPrice,
    total_amount: quantity * unitPrice,
    delivery_address: asString(o.delivery_address, dealer?.address || ""),
    notes: asString(o.notes),
    status: asString(o.status, "pending") as Order["status"],
    createdAt: asString(o.created_at, new Date().toISOString()),
    updatedAt: asString(o.updated_at, asString(o.created_at, new Date().toISOString())),
  };
}

function normalizeBill(b: ApiRecord, dealers: Dealer[], products: Product[]): Bill {
  const dealer = dealers.find((d) => d.id === asString(b.dealer_id));
  const item = (Array.isArray(b.items) ? b.items[0] : undefined) as ApiRecord | undefined;
  const product = item ? products.find((p) => p.id === asString(item.product_id)) : undefined;
  const subtotal = asNumber(b.subtotal ?? b.total_amount ?? b.total, 0);
  const total = asNumber(b.total ?? b.total_amount, subtotal);
  const quantity = asNumber(item?.quantity, 0);
  return {
    id: asString(b.id),
    invoice_number: asString(b.invoice_number),
    orderId: asOptionalString(b.order_id),
    dealerId: asString(b.dealer_id),
    dealerName: dealer?.name || asString((b.dealers as ApiRecord | undefined)?.name, "Unknown Dealer"),
    partName: product?.name || "Product",
    quantity,
    subtotal,
    tax: asNumber(b.tax, Math.max(0, total - subtotal)),
    total,
    payment_status: asString(b.payment_status ?? b.status, "pending") as Bill["payment_status"],
    due_date: asString(b.due_date, "—"),
    paid_date: asOptionalString(b.paid_date),
    createdAt: asString(b.created_at, new Date().toISOString()),
  };
}

export async function syncFromBackend() {
  const [dealersRaw, suppliersRaw, partsRaw, productsRaw, quotationsRaw, ordersRaw, billingRaw] = await Promise.all([
    apiRequest("/dealers"),
    apiRequest("/suppliers"),
    apiRequest("/parts"),
    apiRequest("/products"),
    apiRequest("/quotations"),
    apiRequest("/orders"),
    apiRequest("/billing"),
  ]);

  const dealers = (dealersRaw || []).map(normalizeDealer);
  const suppliers = (suppliersRaw || []).map(normalizeSupplier);
  const parts = (partsRaw || []).map(normalizePart);
  const products = (productsRaw || []).map(normalizeProduct);
  const quotations = ((quotationsRaw || []) as ApiRecord[]).map((q) => normalizeQuotation(q, suppliers, parts));
  const orders = ((ordersRaw || []) as ApiRecord[]).map((o) => normalizeOrder(o, dealers, products));
  const billing = ((billingRaw || []) as ApiRecord[]).map((b) => normalizeBill(b, dealers, products));
  const inventory = parts.map((p: Part) => ({
    id: `inv-${p.id}`,
    partId: p.id,
    partName: p.name,
    sku: p.sku,
    quantity: p.quantity,
    min_stock: p.min_stock,
    location: p.location || "Warehouse",
    last_updated: p.createdAt,
  }));

  const state: WamsState = {
    users: [],
    dealers,
    suppliers,
    parts,
    products,
    quotations,
    orders,
    billing,
    inventory,
  };

  saveCache(state);
  return state;
}

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

export async function login(username: string, password: string): Promise<AppUser | null> {
  try {
    const payload = username.includes("@") ? { email: username, password } : { username, password };
    const result = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const user = result.user as AppUser;
    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_KEY, result.token || "");
    }
    await syncFromBackend();
    return user;
  } catch {
    return null;
  }
}

export async function register(input: {
  name: string;
  username: string;
  password: string;
  role: Role;
}): Promise<{ user?: AppUser; error?: string }> {
  try {
    const email = `${input.username}@wams.local`;
    const result = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ ...input, email }),
    });
    const user = result.user as AppUser;
    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_KEY, result.token || "");
    }
    await syncFromBackend();
    return { user };
   } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Registration failed." };
  }
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export async function createDealer(input: Omit<Dealer, "id" | "createdAt">) {
  await apiRequest("/dealers", { method: "POST", body: JSON.stringify(input) });
  return syncFromBackend();
}

export async function updateDealer(id: string, patch: Partial<Dealer>) {
  const current = loadDb().dealers.find((d) => d.id === id);
  await apiRequest(`/dealers/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ...current, ...patch }),
  });
  return syncFromBackend();
}

export async function deleteDealer(id: string) {
  await apiRequest(`/dealers/${id}`, { method: "DELETE" });
  return syncFromBackend();
}

export async function createSupplier(input: Omit<Supplier, "id" | "createdAt">) {
  await apiRequest("/suppliers", { method: "POST", body: JSON.stringify(input) });
  return syncFromBackend();
}

export async function updateSupplier(id: string, patch: Partial<Supplier>) {
  const current = loadDb().suppliers.find((s) => s.id === id);
  await apiRequest(`/suppliers/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ...current, ...patch }),
  });
  return syncFromBackend();
}

export async function deleteSupplier(id: string) {
  await apiRequest(`/suppliers/${id}`, { method: "DELETE" });
  return syncFromBackend();
}

export async function createPart(input: {
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  unit_price?: number;
  quantity?: number;
  min_stock?: number;
  location?: string;
}) {
  await apiRequest("/parts", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      part_number: input.sku || input.name,
      description: input.description || "",
      quantity: Number(input.quantity || 0),
      min_quantity: Number(input.min_stock || 0),
      unit_price: Number(input.unit_price || 0),
      category: input.category || "General",
      location: input.location || "Warehouse",
    }),
  });
  return syncFromBackend();
}

export async function updatePartQuantity(id: string, quantity: number) {
  const part = loadDb().parts.find((p) => p.id === id);
  if (!part) throw new Error("Part not found");
  await apiRequest(`/parts/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: part.name,
      part_number: part.part_number || part.sku,
      description: part.description,
      quantity,
      min_quantity: part.min_quantity ?? part.min_stock,
      unit_price: part.unit_price,
      supplier_id: part.supplierId,
      category: part.category,
      location: part.location,
    }),
  });
  return syncFromBackend();
}

export async function deletePart(id: string) {
  await apiRequest(`/parts/${id}`, { method: "DELETE" });
  return syncFromBackend();
}

export async function submitQuotation(data: {
  supplierId: string;
  partId: string;
  quantity: number;
  unit_price: number;
  validity_days: number;
  notes: string;
}) {
  const validUntil = new Date(Date.now() + data.validity_days * 24 * 60 * 60 * 1000).toISOString();
  await apiRequest("/quotations", {
    method: "POST",
    body: JSON.stringify({
      supplier_id: data.supplierId,
      part_id: data.partId,
      quantity: data.quantity,
      unit_price: data.unit_price,
      price: data.unit_price,
      valid_until: validUntil,
      notes: data.notes,
      status: "pending",
    }),
  });
  return syncFromBackend();
}

export async function respondToQuotation(id: string, decision: "approved" | "rejected", adminNote = "") {
  await apiRequest(`/quotations/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: decision, admin_note: adminNote }),
  });
  return syncFromBackend();
}

export async function placeOrder(data: {
  dealerId: string;
  productId: string;
  quantity: number;
  notes: string;
  delivery_address?: string;
}) {
  try {
    await apiRequest("/orders", {
      method: "POST",
      body: JSON.stringify({ dealer_id: data.dealerId, product_id: data.productId, quantity: data.quantity, notes: data.notes }),
    });
    const state = await syncFromBackend();
    const order = state.orders[0];
    return { order };
   } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Order failed" };
  }
}

export async function processOrder(orderId: string) {
  try {
    const result = await apiRequest(`/orders/${orderId}/fulfill`, { method: "PATCH" });
    await syncFromBackend();
    return { bill: result.bill as Bill };
   } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Could not process order" };
  }
}

export async function updateOrderStatus(orderId: string, status: Order["status"]) {
  await apiRequest(`/requests/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return syncFromBackend();
}

export async function markBillPaid(billId: string) {
  await apiRequest(`/billing/${billId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "paid", payment_status: "paid" }),
  });
  return syncFromBackend();
}

export function generateReport(db: WamsState): ReportData {
  const totalRevenue = db.billing.filter((b) => b.payment_status === "paid").reduce((sum, b) => sum + b.total, 0);
  const totalUnpaid = db.billing.filter((b) => b.payment_status !== "paid").reduce((sum, b) => sum + b.total, 0);
  const totalOrders = db.orders.length;
  const pendingOrders = db.orders.filter((o) => o.status === "pending" || o.status === "confirmed").length;
  const processingOrders = db.orders.filter((o) => o.status === "processing" || o.status === "shipped").length;
  const deliveredOrders = db.orders.filter((o) => o.status === "fulfilled" || o.status === "delivered").length;
  const lowStockParts = db.parts.filter((p) => p.status === "low_stock").length;
  const outOfStockParts = db.parts.filter((p) => p.status === "out_of_stock").length;
  const pendingQuotations = db.quotations.filter((q) => q.status === "pending").length;
  const approvedQuotations = db.quotations.filter((q) => q.status === "approved").length;

  const topParts = Object.values(
    db.billing.reduce((acc, bill) => {
      const key = bill.partName;
      if (!acc[key]) acc[key] = { name: key, orders: 0, revenue: 0 };
      acc[key].orders += 1;
      acc[key].revenue += bill.total;
      return acc;
    }, {} as Record<string, { name: string; orders: number; revenue: number }>)
  ).sort((a, b) => b.revenue - a.revenue);

  return {
    totalRevenue,
    totalUnpaid,
    totalOrders,
    pendingOrders,
    processingOrders,
    deliveredOrders,
    lowStockParts,
    outOfStockParts,
    pendingQuotations,
    approvedQuotations,
    topParts,
  };
}
