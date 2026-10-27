import { z } from "zod";

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/, "3 to 48 characters: lowercase letters, numbers and hyphens.");

// No dots: the stored login is "<slug>.<username>".
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,30}$/, "3 to 30 characters: letters, numbers and underscore.");

export const passwordSchema = z.string().min(8, "At least 8 characters.").max(128);

// Indian mobile, with or without +91 / 0 prefix. Stored as 10 digits.
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|0)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a 10 digit mobile number."));

export const gstinSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, "Enter a valid 15 character GSTIN.");

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.");

export const createTenantSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: slugSchema,
  ownerName: z.string().trim().min(2).max(120),
  phone: phoneSchema,
  city: z.string().trim().min(2).max(60),
  gstin: z.union([z.literal(""), gstinSchema]).transform((v) => v || null),
  plan: z.enum(["trial", "basic", "pro"]),
  paidUntil: dateSchema,
  ownerUsername: usernameSchema,
  ownerPassword: passwordSchema,
});

export const recordPaymentSchema = z.object({
  requestId: z.uuid(),
  tenantId: z.string().length(36),
  amount: z.coerce.number().positive().max(10_000_000),
  months: z.coerce.number().int().min(1).max(36),
  method: z.enum(["upi", "bank", "cash", "cheque", "other"]),
  reference: z.string().trim().max(120).optional(),
});

// Turns a zod error into { field: "first message" } for forms.
export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

const optionalText = (max: number) =>
  z.string().trim().max(max).transform((v) => v || null);
const rupees = z.coerce.number().min(0).max(10_000_000);

export const productSchema = z
  .object({
    name: z.string().trim().min(2, "Enter the medicine name.").max(160),
    barcode: z.string().trim().min(3, "Scan or type a barcode.").max(48),
    categoryId: z.string().trim().max(36).transform((v) => v || null),
    hsn: z.union([z.literal(""), z.string().trim().regex(/^\d{4,8}$/, "HSN is 4 to 8 digits.")]).transform((v) => v || null),
    gstRate: z.enum(["0", "5", "12", "18", "28"]),
    mrp: rupees.positive("Enter MRP."),
    price: rupees.positive("Enter selling price."),
    supplier: optionalText(120),
    minStock: z.coerce.number().int().min(0).max(100_000),
    trackStock: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
    schedule: z.enum(["none", "H", "H1", "X"]),
  })
  .refine((p) => p.price <= p.mrp, { path: ["price"], message: "Selling price cannot be above MRP." });

export const stockInSchema = z.object({
  productId: z.string().length(36),
  batch: z.string().trim().min(1, "Enter the batch number.").max(40),
  expiry: dateSchema,
  qty: z.coerce.number().int().min(1, "At least 1.").max(100_000),
  unitCost: rupees,
});

export const categorySchema = z.object({ name: z.string().trim().min(2).max(80) });

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Enter the customer name.").max(120),
  phone: z.union([z.literal(""), phoneSchema]).transform((v) => v || null),
  email: z.union([z.literal(""), z.email("Enter a valid email.")]).transform((v) => v || null),
  address: optionalText(255),
});

export const saleLineSchema = z.object({
  productId: z.string().length(36),
  batch: z.string().max(40),
  expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  qty: z.number().int().min(1).max(10_000),
  price: z.number().positive().max(10_000_000),
});

const optionalName = z.string().trim().max(120).nullish().transform((v) => v || null);

// Sent by the till, online or later from the offline outbox.
export const saleSchema = z.object({
  id: z.uuid(),
  invoiceNo: z.string().regex(/^[A-Z0-9]{2,4}-\d{1,8}$/),
  tillCode: z.string().regex(/^[A-Z0-9]{2,4}$/),
  soldAt: z.iso.datetime(),
  customerId: z.string().length(36).nullish().transform((v) => v || null),
  customerName: optionalName,
  customerPhone: z.string().regex(/^[6-9]\d{9}$/).nullish().transform((v) => v || null),
  doctorName: optionalName,
  patientName: optionalName,
  discountPct: z.number().min(0).max(100),
  paymentMethod: z.enum(["cash", "upi", "card", "credit"]),
  tendered: z.number().min(0).max(10_000_000).nullish().transform((v) => v ?? null),
  lines: z.array(saleLineSchema).min(1).max(200),
});

export type SaleInput = z.infer<typeof saleSchema>;

const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());
const permFields = {
  permProducts: checkbox,
  permCategories: checkbox,
  permTransactions: checkbox,
  permUsers: checkbox,
  permSettings: checkbox,
};

export const createStaffSchema = z.object({
  name: z.string().trim().min(2, "Enter the name.").max(120),
  username: usernameSchema,
  password: passwordSchema,
  role: z.enum(["manager", "cashier"]),
  ...permFields,
});

export const updateStaffSchema = z.object({
  role: z.enum(["manager", "cashier"]),
  disabled: checkbox,
  ...permFields,
});

export const resetPasswordSchema = z.object({ password: passwordSchema });

export const settingsSchema = z.object({
  address: z.string().trim().max(255),
  phone: z.string().trim().max(20),
  drugLicence: z.string().trim().max(80),
  gstin: z.union([z.literal(""), gstinSchema]).transform((v) => v || null),
  footer: z.string().trim().max(255),
  defaultDiscountPct: z.coerce.number().min(0).max(100),
});

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120),
  pharmacy: z.string().trim().min(2, "Enter your pharmacy's name.").max(120),
  phone: phoneSchema,
  area: z.string().trim().min(2, "Enter your area, e.g. Dadar.").max(80),
  counters: z.coerce.number().int().min(1).max(20),
  message: z.string().trim().max(500).transform((v) => v || null),
  // Honeypot: real people never see or fill this field.
  website: z.string().max(0).optional(),
});
