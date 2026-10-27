import { formatINR, toPaise } from "@/lib/money";
import type { CartProduct, SaleLine } from "@/lib/cart";
import type { PosSettings } from "@/lib/pos";
import type { SaleInput } from "@/lib/validation";

export type PrintedBill = {
  sale: SaleInput;
  lines: (SaleLine & { netPaise: number })[];
  totals: { grossPaise: number; netPaise: number; taxablePaise: number; cgstPaise: number; sgstPaise: number; roundOffPaise: number; payablePaise: number };
  cashier: string;
};

const expiryShort = (d: string | null) => (d ? `${d.slice(5, 7)}/${d.slice(2, 4)}` : "");

// 80 mm thermal receipt. Only visible when printing.
export function Receipt({ bill, settings, products }: { bill: PrintedBill; settings: PosSettings; products: Map<string, CartProduct> }) {
  const { sale, totals } = bill;
  const change = sale.paymentMethod === "cash" && sale.tendered ? toPaise(sale.tendered) - totals.payablePaise : 0;
  return (
    <div className="receipt mx-auto w-[72mm] font-mono text-[11px] leading-tight text-black">
      <div className="text-center">
        <div className="text-sm font-semibold">{settings.name}</div>
        {settings.address && <div>{settings.address}</div>}
        {settings.phone && <div>Ph: {settings.phone}</div>}
        {settings.gstin && <div>GSTIN: {settings.gstin}</div>}
        {settings.drugLicence && <div>DL No: {settings.drugLicence}</div>}
        <div className="mt-1 font-semibold">TAX INVOICE</div>
      </div>
      <hr className="my-1 border-dashed border-black" />
      <div className="flex justify-between">
        <span>Bill: {sale.invoiceNo}</span>
        <span>{new Date(sale.soldAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Kolkata" })}</span>
      </div>
      {(sale.customerName || sale.customerPhone) && (
        <div>
          Customer: {sale.customerName} {sale.customerPhone}
        </div>
      )}
      {sale.patientName && <div>Patient: {sale.patientName}</div>}
      {sale.doctorName && <div>Doctor: {sale.doctorName}</div>}
      <hr className="my-1 border-dashed border-black" />
      <table className="w-full">
        <thead>
          <tr className="text-left">
            <th className="font-semibold">Item</th>
            <th className="text-right font-semibold">Qty</th>
            <th className="text-right font-semibold">MRP</th>
            <th className="text-right font-semibold">Amt</th>
          </tr>
        </thead>
        <tbody>
          {bill.lines.map((l, i) => {
            const p = products.get(l.productId);
            return (
              <tr key={i} className="align-top">
                <td>
                  {p?.name}
                  <div className="text-[10px]">
                    {l.batch && `B:${l.batch} `}
                    {l.expiry && `E:${expiryShort(l.expiry)} `}
                    {p?.hsn && `HSN:${p.hsn} `}
                    GST {p?.gstRate}%
                  </div>
                </td>
                <td className="text-right">{l.qty}</td>
                <td className="text-right">{p ? Number(p.mrp).toFixed(2) : ""}</td>
                <td className="text-right">{(l.netPaise / 100).toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <hr className="my-1 border-dashed border-black" />
      <Row label="Gross" value={formatINR(totals.grossPaise)} />
      {totals.grossPaise !== totals.netPaise && (
        <Row label={`Discount ${sale.discountPct}%`} value={`-${formatINR(totals.grossPaise - totals.netPaise)}`} />
      )}
      <Row label="Taxable value" value={formatINR(totals.taxablePaise)} />
      <Row label="CGST" value={formatINR(totals.cgstPaise)} />
      <Row label="SGST" value={formatINR(totals.sgstPaise)} />
      {totals.roundOffPaise !== 0 && <Row label="Round off" value={formatINR(totals.roundOffPaise)} />}
      <div className="mt-1 flex justify-between text-sm font-semibold">
        <span>NET PAYABLE</span>
        <span>{formatINR(totals.payablePaise)}</span>
      </div>
      <Row label={`Paid by ${sale.paymentMethod.toUpperCase()}`} value={sale.tendered ? formatINR(toPaise(sale.tendered)) : ""} />
      {change > 0 && <Row label="Change" value={formatINR(change)} />}
      <hr className="my-1 border-dashed border-black" />
      <div className="text-center text-[10px]">Prices include GST. Served by {bill.cashier}.</div>
      {settings.footer && <div className="mt-1 text-center">{settings.footer}</div>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
