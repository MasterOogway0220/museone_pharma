import { relations } from "drizzle-orm";
import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  boolean,
  index,
  int,
  date,
  decimal,
  mysqlEnum,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// A tenant is one pharmacy. Created only by the super admin.
export const tenants = mysqlTable("tenants", {
  id: varchar("id", { length: 36 }).primaryKey(),
  slug: varchar("slug", { length: 48 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  ownerName: varchar("owner_name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  city: varchar("city", { length: 60 }).notNull().default("Mumbai"),
  gstin: varchar("gstin", { length: 15 }),
  plan: mysqlEnum("plan", ["trial", "basic", "pro"]).notNull().default("trial"),
  suspended: boolean("suspended").notNull().default(false),
  // Access rules from this date live in src/lib/subscription.ts.
  paidUntil: date("paid_until", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
});

// Manual payments recorded by the super admin (no payment gateway in v1).
export const tenantPayments = mysqlTable(
  "tenant_payments",
  {
    id: int("id").autoincrement().primaryKey(),
    // Set by the form; a resubmitted form hits the unique key instead of paying twice.
    requestId: varchar("request_id", { length: 36 }).notNull().unique(),
    tenantId: varchar("tenant_id", { length: 36 })
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    months: int("months").notNull(),
    method: mysqlEnum("method", ["upi", "bank", "cash", "cheque", "other"]).notNull(),
    reference: varchar("reference", { length: 120 }),
    paidUntilBefore: date("paid_until_before", { mode: "string" }).notNull(),
    paidUntilAfter: date("paid_until_after", { mode: "string" }).notNull(),
    recordedBy: varchar("recorded_by", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [index("tenant_payments_tenant_idx").on(table.tenantId)],
);

export const user = mysqlTable("user", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { fsp: 3 })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  username: varchar("username", { length: 255 }).unique(),
  displayUsername: text("display_username"),
  tenantId: varchar("tenant_id", { length: 36 }).references(() => tenants.id, {
    onDelete: "restrict",
  }),
  role: varchar("role", { length: 20 }).default("cashier").notNull(),
  permProducts: boolean("perm_products").default(false).notNull(),
  permCategories: boolean("perm_categories").default(false).notNull(),
  permTransactions: boolean("perm_transactions").default(false).notNull(),
  permUsers: boolean("perm_users").default(false).notNull(),
  permSettings: boolean("perm_settings").default(false).notNull(),
  // Staff who leave are disabled, not deleted: their past bills still point to them.
  disabled: boolean("disabled").default(false).notNull(),
});

export const session = mysqlTable(
  "session",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    expiresAt: timestamp("expires_at", { fsp: 3 }).notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { fsp: 3 })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = mysqlTable(
  "account",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { fsp: 3 }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { fsp: 3 }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { fsp: 3 })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = mysqlTable(
  "verification",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { fsp: 3 }).notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { fsp: 3 })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// ---------- Tenant data. Every table has tenant_id; queries go through src/lib/tenant-db.ts. ----------

const tenantId = () =>
  varchar("tenant_id", { length: 36 })
    .notNull()
    .references(() => tenants.id, { onDelete: "restrict" });

const money = (name: string) => decimal(name, { precision: 12, scale: 2 });

export const categories = mysqlTable(
  "categories",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: tenantId(),
    name: varchar("name", { length: 80 }).notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("categories_tenant_name_uq").on(t.tenantId, t.name)],
);

export const products = mysqlTable(
  "products",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: tenantId(),
    name: varchar("name", { length: 160 }).notNull(),
    // Scanned code: manufacturer EAN, or a generated code printed on a label.
    barcode: varchar("barcode", { length: 90 }).notNull(), // 48 + "#" + id once removed
    categoryId: varchar("category_id", { length: 36 }).references(() => categories.id, { onDelete: "set null" }),
    hsn: varchar("hsn", { length: 8 }),
    gstRate: decimal("gst_rate", { precision: 4, scale: 2 }).notNull().default("12.00"),
    mrp: money("mrp").notNull(),
    // Selling price, GST inclusive (Indian retail convention). Cannot exceed MRP.
    price: money("price").notNull(),
    supplier: varchar("supplier", { length: 120 }),
    minStock: int("min_stock").notNull().default(0),
    trackStock: boolean("track_stock").notNull().default(true),
    schedule: mysqlEnum("schedule", ["none", "H", "H1", "X"]).notNull().default("none"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { fsp: 3 })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    uniqueIndex("products_tenant_barcode_uq").on(t.tenantId, t.barcode),
    index("products_tenant_name_idx").on(t.tenantId, t.name),
  ],
);

// Stock is a ledger: current stock = SUM(qty). Never update a row; add a new one.
export const stockMovements = mysqlTable(
  "stock_movements",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: tenantId(),
    productId: varchar("product_id", { length: 36 })
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    batch: varchar("batch", { length: 40 }).notNull().default(""),
    expiry: date("expiry", { mode: "string" }),
    qty: int("qty").notNull(),
    reason: mysqlEnum("reason", ["purchase", "sale", "return", "adjust", "expired"]).notNull(),
    // Purchase cost per unit, for profit reports. Null for sales and adjustments.
    unitCost: money("unit_cost"),
    saleId: varchar("sale_id", { length: 36 }),
    note: varchar("note", { length: 200 }),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (t) => [
    index("stock_tenant_product_idx").on(t.tenantId, t.productId, t.batch),
    index("stock_tenant_expiry_idx").on(t.tenantId, t.expiry),
    index("stock_sale_idx").on(t.saleId),
  ],
);

export const customers = mysqlTable(
  "customers",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: tenantId(),
    name: varchar("name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 10 }),
    email: varchar("email", { length: 160 }),
    address: varchar("address", { length: 255 }),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (t) => [index("customers_tenant_phone_idx").on(t.tenantId, t.phone)],
);

// Shown on bills. One row per tenant, created on first save.
export const tenantSettings = mysqlTable("tenant_settings", {
  tenantId: varchar("tenant_id", { length: 36 })
    .primaryKey()
    .references(() => tenants.id, { onDelete: "restrict" }),
  address: varchar("address", { length: 255 }).notNull().default(""),
  phone: varchar("phone", { length: 20 }).notNull().default(""),
  drugLicence: varchar("drug_licence", { length: 80 }).notNull().default(""),
  footer: varchar("footer", { length: 255 }).notNull().default("Get well soon."),
  defaultDiscountPct: decimal("default_discount_pct", { precision: 5, scale: 2 }).notNull().default("0.00"),
});

// One per billing device. The code prefixes that device's invoice numbers, so devices
// can number bills offline without colliding.
export const tills = mysqlTable(
  "tills",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: tenantId(),
    code: varchar("code", { length: 4 }).notNull(),
    name: varchar("name", { length: 60 }).notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("tills_tenant_code_uq").on(t.tenantId, t.code)],
);

export const sales = mysqlTable(
  "sales",
  {
    // Generated on the till, so a retried sync is a no-op.
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: tenantId(),
    invoiceNo: varchar("invoice_no", { length: 20 }).notNull(),
    tillCode: varchar("till_code", { length: 4 }).notNull(),
    customerId: varchar("customer_id", { length: 36 }).references(() => customers.id, { onDelete: "set null" }),
    customerName: varchar("customer_name", { length: 120 }),
    customerPhone: varchar("customer_phone", { length: 10 }),
    doctorName: varchar("doctor_name", { length: 120 }),
    patientName: varchar("patient_name", { length: 120 }),
    discountPct: decimal("discount_pct", { precision: 5, scale: 2 }).notNull(),
    gross: money("gross").notNull(),
    discount: money("discount").notNull(),
    taxable: money("taxable").notNull(),
    cgst: money("cgst").notNull(),
    sgst: money("sgst").notNull(),
    roundOff: money("round_off").notNull(),
    payable: money("payable").notNull(),
    paymentMethod: mysqlEnum("payment_method", ["cash", "upi", "card", "credit"]).notNull(),
    tendered: money("tendered"),
    status: mysqlEnum("status", ["completed", "returned"]).notNull().default("completed"),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    // When the bill was made on the till (may be earlier than createdAt if it was offline).
    soldAt: timestamp("sold_at", { fsp: 3 }).notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("sales_tenant_invoice_uq").on(t.tenantId, t.invoiceNo),
    index("sales_tenant_sold_idx").on(t.tenantId, t.soldAt),
    index("sales_tenant_customer_idx").on(t.tenantId, t.customerId),
  ],
);

export const saleItems = mysqlTable(
  "sale_items",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: tenantId(),
    saleId: varchar("sale_id", { length: 36 })
      .notNull()
      .references(() => sales.id, { onDelete: "cascade" }),
    productId: varchar("product_id", { length: 36 })
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    // Snapshot at time of sale: later product edits don't change old bills.
    name: varchar("name", { length: 160 }).notNull(),
    hsn: varchar("hsn", { length: 8 }),
    schedule: mysqlEnum("schedule", ["none", "H", "H1", "X"]).notNull(),
    batch: varchar("batch", { length: 40 }).notNull(),
    expiry: date("expiry", { mode: "string" }),
    qty: int("qty").notNull(),
    mrp: money("mrp").notNull(),
    price: money("price").notNull(),
    gstRate: decimal("gst_rate", { precision: 4, scale: 2 }).notNull(),
    discount: money("discount").notNull(),
    taxable: money("taxable").notNull(),
    cgst: money("cgst").notNull(),
    sgst: money("sgst").notNull(),
    net: money("net").notNull(),
  },
  (t) => [index("sale_items_sale_idx").on(t.saleId), index("sale_items_tenant_product_idx").on(t.tenantId, t.productId)],
);

// Bills parked mid-way ("hold"), visible to every till in the pharmacy.
export const heldCarts = mysqlTable(
  "held_carts",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: tenantId(),
    label: varchar("label", { length: 80 }).notNull(),
    cart: text("cart").notNull(), // JSON of the till's cart
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (t) => [index("held_carts_tenant_idx").on(t.tenantId)],
);
