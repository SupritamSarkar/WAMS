const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DATA_FILE = path.join(DATA_DIR, "local-db.json");

function now() {
  return new Date().toISOString();
}

function hash(password) {
  return bcrypt.hashSync(password, 10);
}

function buildSeedData() {
  const created = now();
  return {
    users: [
      {
        id: "u-admin",
        email: "admin@wams.local",
        username: "admin",
        password: hash("admin123"),
        name: "Admin User",
        role: "administrator",
        created_at: created,
      },
      {
        id: "u-manager",
        email: "manager@wams.local",
        username: "inventory",
        password: hash("inv123"),
        name: "Inventory Manager",
        role: "inventory_manager",
        created_at: created,
      },
      {
        id: "u-supplier-1",
        email: "supplier1@wams.local",
        username: "supplier1",
        password: hash("sup123"),
        name: "Steel Works Ltd",
        role: "supplier",
        created_at: created,
      },
      {
        id: "u-dealer-1",
        email: "dealer1@wams.local",
        username: "dealer1",
        password: hash("deal123"),
        name: "Metro Dealers",
        role: "dealer",
        created_at: created,
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
        owner_user_id: "u-dealer-1",
        created_at: created,
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
        owner_user_id: "u-supplier-1",
        created_at: created,
      },
    ],
    parts: [
      {
        id: "p-1",
        name: "Gear Unit",
        part_number: "GU-001",
        sku: "GU-001",
        description: "Heavy-duty gear unit for industrial machinery",
        category: "Mechanical",
        quantity: 20,
        min_quantity: 5,
        min_stock: 5,
        unit_price: 2500,
        supplier_id: "s-1",
        location: "Shelf A-1",
        created_at: created,
      },
      {
        id: "p-2",
        name: "Hydraulic Pump",
        part_number: "HP-002",
        sku: "HP-002",
        description: "High-pressure hydraulic pump",
        category: "Hydraulics",
        quantity: 3,
        min_quantity: 5,
        min_stock: 5,
        unit_price: 8500,
        supplier_id: "s-1",
        location: "Shelf B-3",
        created_at: created,
      },
    ],
    products: [
      {
        id: "prod-1",
        name: "Industrial Gearbox",
        sku: "IG-100",
        description: "Finished gearbox assembly",
        quantity: 8,
        min_quantity: 4,
        unit_price: 18000,
        unit: "pcs",
        created_at: created,
      },
      {
        id: "prod-2",
        name: "Valve Controller",
        sku: "VC-200",
        description: "Controller unit for valve systems",
        quantity: 2,
        min_quantity: 6,
        unit_price: 24000,
        unit: "pcs",
        created_at: created,
      },
    ],
    quotations: [
      {
        id: "q-1",
        supplier_id: "s-1",
        part_id: "p-2",
        price: 7900,
        quantity: 10,
        delivery_date: created,
        valid_until: created,
        status: "pending",
        created_at: created,
      },
    ],
    dealer_requests: [
      {
        id: "req-1",
        dealer_id: "d-1",
        product_id: "prod-1",
        quantity: 2,
        notes: "Urgent delivery for workshop line A.",
        status: "pending",
        created_at: created,
      },
    ],
    billing: [
      {
        id: "bill-1",
        dealer_id: "d-1",
        invoice_number: "INV-1001",
        items: [{ product_id: "prod-1", quantity: 1, unit_price: 18000 }],
        total_amount: 18000,
        subtotal: 18000,
        tax: 0,
        total: 18000,
        payment_status: "unpaid",
        status: "pending",
        due_date: created,
        created_at: created,
      },
    ],
    transactions: [
      {
        id: "txn-1",
        product_id: "prod-1",
        dealer_id: "d-1",
        quantity: 1,
        unit_price: 18000,
        total_amount: 18000,
        status: "completed",
        transaction_type: "supply",
        created_at: created,
      },
    ],
    purchase_orders: [],
    stock_adjustments: [],
  };
}

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(buildSeedData(), null, 2));
  }
}

function loadState() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveState(state) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function idPrefix(table) {
  const prefixes = {
    users: "u",
    dealers: "d",
    suppliers: "s",
    parts: "p",
    products: "prod",
    quotations: "q",
    dealer_requests: "req",
    billing: "bill",
    transactions: "txn",
    purchase_orders: "po",
    stock_adjustments: "adj",
  };
  return prefixes[table] || table.slice(0, 3);
}

function inferId(record, relation) {
  const candidates = [
    `${relation.slice(0, -1)}_id`,
    `${relation.slice(0, -1)}Id`,
    relation === "dealers" ? "dealer_id" : null,
    relation === "suppliers" ? "supplier_id" : null,
    relation === "products" ? "product_id" : null,
    relation === "parts" ? "part_id" : null,
  ].filter(Boolean);
  for (const key of candidates) {
    if (record[key] !== undefined) return record[key];
  }
  return undefined;
}

function pickFields(record, fields) {
  const out = {};
  for (const field of fields) out[field] = record?.[field] ?? null;
  return out;
}

function decorateRelations(row, state, selectClause = "*") {
  const result = clone(row);
  const relationSpecs = [
    { name: "dealers", fields: ["name", "company_name"] },
    { name: "suppliers", fields: ["name", "company_name"] },
    { name: "products", fields: ["name", "sku", "unit_price"] },
    { name: "parts", fields: ["name", "part_number", "sku", "unit_price"] },
  ];

  for (const spec of relationSpecs) {
    if (!selectClause.includes(`${spec.name}(`)) continue;
    const relId = inferId(row, spec.name);
    const relRecord = (state[spec.name] || []).find((item) => item.id === relId) || null;
    result[spec.name] = relRecord ? pickFields(relRecord, spec.fields) : null;
  }

  return result;
}

class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.mode = "select";
    this.filters = [];
    this.sort = null;
    this.limitValue = null;
    this.singleResult = false;
    this.selectClause = "*";
    this.selectOptions = {};
    this.payload = null;
  }

  select(columns = "*", options = {}) {
    this.mode = this.mode || "select";
    this.selectClause = columns;
    this.selectOptions = options;
    return this;
  }

  insert(rows) {
    this.mode = "insert";
    this.payload = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  update(values) {
    this.mode = "update";
    this.payload = values;
    return this;
  }

  delete() {
    this.mode = "delete";
    this.payload = null;
    return this;
  }

  eq(field, value) {
    this.filters.push({ type: "eq", field, value });
    return this;
  }

  lt(field, value) {
    this.filters.push({ type: "lt", field, value });
    return this;
  }

  gte(field, value) {
    this.filters.push({ type: "gte", field, value });
    return this;
  }

  order(field, { ascending = true } = {}) {
    this.sort = { field, ascending };
    return this;
  }

  limit(value) {
    this.limitValue = value;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  matches(row) {
    return this.filters.every((filter) => {
      const left = row?.[filter.field];
      const right = typeof filter.value === "string" && row?.[filter.value] !== undefined ? row[filter.value] : filter.value;
      if (filter.type === "eq") return left === right;
      if (filter.type === "lt") return Number(left ?? 0) < Number(right ?? 0);
      if (filter.type === "gte") return String(left ?? "") >= String(right ?? "");
      return true;
    });
  }

  applyFilters(rows) {
    let result = rows.filter((row) => this.matches(row));
    if (this.sort) {
      const { field, ascending } = this.sort;
      result = result.sort((a, b) => {
        const av = a?.[field];
        const bv = b?.[field];
        if (av === bv) return 0;
        if (av === undefined || av === null) return ascending ? 1 : -1;
        if (bv === undefined || bv === null) return ascending ? -1 : 1;
        return ascending ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
      });
    }
    if (typeof this.limitValue === "number") result = result.slice(0, this.limitValue);
    return result;
  }

  finalizeRows(rows, state) {
    const decorated = rows.map((row) => decorateRelations(row, state, this.selectClause));
    if (this.selectOptions?.head && this.selectOptions?.count === "exact") {
      return { data: null, count: rows.length, error: null };
    }
    if (this.singleResult) {
      if (decorated.length === 0) {
        return { data: null, error: { message: `${this.table} record not found` } };
      }
      return { data: decorated[0], error: null };
    }
    return { data: decorated, error: null };
  }

  executeInsert(state) {
    const tableRows = state[this.table] || [];
    const inserted = this.payload.map((row, idx) => {
      const timestamp = now();
      const base = clone(row);
      if (!base.id) base.id = `${idPrefix(this.table)}-${Date.now()}-${idx}`;
      if (!base.created_at) base.created_at = timestamp;
      if (this.table === "billing") {
        if (base.status && !base.payment_status) base.payment_status = base.status;
        if (base.payment_status && !base.status) base.status = base.payment_status;
        if (base.total_amount !== undefined && base.total === undefined) base.total = base.total_amount;
        if (base.total !== undefined && base.total_amount === undefined) base.total_amount = base.total;
        if (base.subtotal === undefined) base.subtotal = base.total_amount ?? 0;
        if (base.tax === undefined) base.tax = 0;
      }
      tableRows.unshift(base);
      return base;
    });
    state[this.table] = tableRows;
    saveState(state);
    return this.finalizeRows(inserted, state);
  }

  executeUpdate(state) {
    const tableRows = state[this.table] || [];
    const matching = this.applyFilters(tableRows);
    const updated = matching.map((row) => {
      Object.assign(row, this.payload, { updated_at: now() });
      if (this.table === "billing") {
        if (row.status && !row.payment_status) row.payment_status = row.status;
        if (row.payment_status && !row.status) row.status = row.payment_status;
        if (row.total_amount !== undefined && row.total === undefined) row.total = row.total_amount;
        if (row.total !== undefined && row.total_amount === undefined) row.total_amount = row.total;
      }
      return row;
    });
    saveState(state);
    return this.finalizeRows(updated, state);
  }

  executeDelete(state) {
    const tableRows = state[this.table] || [];
    const toDelete = new Set(this.applyFilters(tableRows).map((row) => row.id));
    state[this.table] = tableRows.filter((row) => !toDelete.has(row.id));
    saveState(state);
    return { data: null, error: null };
  }

  executeSelect(state) {
    const tableRows = clone(state[this.table] || []);
    const rows = this.applyFilters(tableRows);
    return this.finalizeRows(rows, state);
  }

  async execute() {
    try {
      const state = loadState();
      if (!Array.isArray(state[this.table])) state[this.table] = [];
      if (this.mode === "insert") return this.executeInsert(state);
      if (this.mode === "update") return this.executeUpdate(state);
      if (this.mode === "delete") return this.executeDelete(state);
      return this.executeSelect(state);
    } catch (error) {
      return { data: null, error: { message: error.message } };
    }
  }
}

function createLocalClient() {
  ensureDataFile();
  return {
    from(table) {
      return new QueryBuilder(table);
    },
  };
}

module.exports = {
  DATA_FILE,
  buildSeedData,
  createLocalClient,
  ensureDataFile,
  loadState,
  saveState,
};
