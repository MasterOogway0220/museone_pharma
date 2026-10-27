import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { listProducts } from "@/lib/catalog";

export type PosProduct = {
  id: string;
  name: string;
  barcode: string;
  categoryName: string | null;
  hsn: string | null;
  gstRate: number;
  mrp: string;
  price: string;
  schedule: "none" | "H" | "H1" | "X";
  trackStock: boolean;
  batches: { batch: string; expiry: string | null; qty: number }[];
};

export type PosSettings = {
  name: string;
  gstin: string | null;
  address: string;
  phone: string;
  drugLicence: string;
  footer: string;
  defaultDiscountPct: number;
};

export async function getSettings(tenantId: string) {
  const [s] = await db.select().from(schema.tenantSettings).where(eq(schema.tenantSettings.tenantId, tenantId));
  return s ?? { tenantId, address: "", phone: "", drugLicence: "", footer: "Get well soon.", defaultDiscountPct: "0.00" };
}

// Everything a till needs to bill, including offline: catalog with batches, and bill header details.
export async function posData(tenant: { id: string; name: string; gstin: string | null }) {
  const [products, s] = await Promise.all([listProducts(tenant.id), getSettings(tenant.id)]);
  return {
    products: products.map(
      (p): PosProduct => ({
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        categoryName: p.categoryName,
        hsn: p.hsn,
        gstRate: Number(p.gstRate),
        mrp: p.mrp,
        price: p.price,
        schedule: p.schedule,
        trackStock: p.trackStock,
        batches: p.batches,
      }),
    ),
    settings: {
      name: tenant.name,
      gstin: tenant.gstin,
      address: s.address,
      phone: s.phone,
      drugLicence: s.drugLicence,
      footer: s.footer,
      defaultDiscountPct: Number(s.defaultDiscountPct),
    } satisfies PosSettings,
  };
}

// Next free till code: A01, A02, ... per tenant.
export async function registerTill(tenantId: string, name: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await db.select({ code: schema.tills.code }).from(schema.tills).where(eq(schema.tills.tenantId, tenantId));
    const code = `A${String(existing.length + 1 + attempt).padStart(2, "0")}`;
    try {
      await db.insert(schema.tills).values({ tenantId, code, name });
      return code;
    } catch (e) {
      if ((e as { cause?: { code?: string } })?.cause?.code !== "ER_DUP_ENTRY") throw e;
    }
  }
  throw new Error("Could not register this till. Try again.");
}

export async function tillExists(tenantId: string, code: string) {
  const [t] = await db
    .select({ id: schema.tills.id })
    .from(schema.tills)
    .where(and(eq(schema.tills.tenantId, tenantId), eq(schema.tills.code, code)));
  return !!t;
}
