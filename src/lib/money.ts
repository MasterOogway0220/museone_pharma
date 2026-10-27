// All money math is in integer paise. Prices are GST inclusive.

export function toPaise(rupees: string | number): number {
  return Math.round(Number(rupees) * 100);
}

export function fromPaise(paise: number): string {
  return (paise / 100).toFixed(2);
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
export function formatINR(paise: number): string {
  return inr.format(paise / 100);
}

export type LineInput = { pricePaise: number; qty: number; gstRate: number; discountPaise: number };

export function lineTotals({ pricePaise, qty, gstRate, discountPaise }: LineInput) {
  const grossPaise = pricePaise * qty;
  const netPaise = grossPaise - discountPaise;
  const taxablePaise = Math.round((netPaise * 100) / (100 + gstRate));
  const gst = netPaise - taxablePaise;
  const cgstPaise = Math.floor(gst / 2);
  return { grossPaise, taxablePaise, cgstPaise, sgstPaise: gst - cgstPaise, netPaise };
}

export function billTotals(lines: LineInput[]) {
  const sum = { grossPaise: 0, taxablePaise: 0, cgstPaise: 0, sgstPaise: 0, netPaise: 0 };
  for (const l of lines.map(lineTotals)) {
    for (const k of Object.keys(sum) as (keyof typeof sum)[]) sum[k] += l[k];
  }
  const payablePaise = Math.round(sum.netPaise / 100) * 100;
  return { ...sum, roundOffPaise: payablePaise - sum.netPaise, payablePaise };
}

// Bill-level discount % applied to each line (common in Indian pharmacies: "10% off on medicines").
// Shared by the till (to show and print) and the server (to store), so both always agree.
export function priceSale(lines: { pricePaise: number; qty: number; gstRate: number }[], discountPct: number) {
  const priced = lines.map((l) => {
    const discountPaise = Math.round((l.pricePaise * l.qty * discountPct) / 100);
    return { ...l, discountPaise, ...lineTotals({ ...l, discountPaise }) };
  });
  return { lines: priced, totals: billTotals(priced) };
}
