import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SkeletonRows } from "@/components/skeleton";
import { requireTenant } from "@/lib/dal";
import { toPaise } from "@/lib/money";
import { getSettings } from "@/lib/pos";
import { getSale, returnSale } from "@/lib/reports";
import { Receipt } from "../../till/receipt";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Bill", robots: { index: false } };

async function returnAction(slug: string, id: string) {
  "use server";
  const { tenant, user } = await requireTenant(slug, { write: true, perm: "permTransactions" });
  await returnSale(tenant.id, user.id, id);
  revalidatePath(`/t/${slug}/sales`, "layout");
}

export default function BillPage({ params }: PageProps<"/t/[slug]/sales/[id]">) {
  return (
    <Suspense fallback={<SkeletonRows rows={10} />}>
      <Bill params={params} />
    </Suspense>
  );
}

async function Bill({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const { tenant, user } = await requireTenant(slug);
  const [sale, s] = await Promise.all([getSale(tenant.id, id), getSettings(tenant.id)]);
  if (!sale) notFound();

  const settings = {
    name: tenant.name,
    gstin: tenant.gstin,
    address: s.address,
    phone: s.phone,
    drugLicence: s.drugLicence,
    footer: s.footer,
    defaultDiscountPct: Number(s.defaultDiscountPct),
  };
  const bill = {
    invoiceNo: sale.invoiceNo,
    soldAt: sale.soldAt.toISOString(),
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    doctorName: sale.doctorName,
    patientName: sale.patientName,
    discountPct: Number(sale.discountPct),
    paymentMethod: sale.paymentMethod,
    tendered: sale.tendered === null ? null : Number(sale.tendered),
    lines: sale.items.map((i) => ({
      name: i.name,
      batch: i.batch,
      expiry: i.expiry,
      hsn: i.hsn,
      gstRate: Number(i.gstRate),
      mrp: i.mrp,
      qty: i.qty,
      netPaise: toPaise(i.net),
    })),
    totals: {
      grossPaise: toPaise(sale.gross),
      netPaise: toPaise(sale.gross) - toPaise(sale.discount),
      taxablePaise: toPaise(sale.taxable),
      cgstPaise: toPaise(sale.cgst),
      sgstPaise: toPaise(sale.sgst),
      roundOffPaise: toPaise(sale.roundOff),
      payablePaise: toPaise(sale.payable),
    },
    cashier: sale.cashier,
    returned: sale.status === "returned",
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="print:hidden">
        <Link href={`/t/${slug}/sales`} className="text-sm text-muted hover:text-foreground">
          All sales
        </Link>
        <h1 className="mt-2 mb-6 text-2xl font-semibold">
          Bill <span className="font-mono">{sale.invoiceNo}</span>
          {bill.returned && <span className="ml-3 text-base font-medium text-danger">Returned</span>}
        </h1>
        <div className="flex flex-wrap gap-2">
          <PrintButton />
          {!bill.returned && user.permTransactions && (
            <form action={returnAction.bind(null, slug, id)}>
              <button className="btn-quiet text-danger">Return whole bill</button>
            </form>
          )}
        </div>
        <p className="mt-4 text-sm text-muted">Returning puts every item back into stock on its original batch.</p>
      </div>
      <div className="rounded-ui border border-border bg-white p-4 print:border-0 print:p-0">
        <Receipt bill={bill} settings={settings} />
      </div>
    </div>
  );
}
