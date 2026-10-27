"use client";

import JsBarcode from "jsbarcode";
import { useEffect, useRef, useState } from "react";
import { formatINR } from "@/lib/money";

type Item = { id: string; name: string; barcode: string; mrpPaise: number };

function Barcode({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (ref.current) JsBarcode(ref.current, value, { format: "CODE128", height: 40, width: 1.4, fontSize: 12, margin: 0 });
  }, [value]);
  return <svg ref={ref} role="img" aria-label={`Barcode ${value}`} />;
}

export function LabelSheet({ items }: { items: Item[] }) {
  const [copies, setCopies] = useState<Record<string, number>>({});
  const labels = items.flatMap((i) => Array.from({ length: copies[i.id] ?? 0 }, () => i));

  return (
    <>
      <div className="print:hidden">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-muted">Set how many labels to print for each product.</p>
          <button className="btn" onClick={() => window.print()} disabled={labels.length === 0}>
            Print {labels.length} labels
          </button>
        </div>
        <div className="mb-8 max-h-96 overflow-y-auto rounded-ui border border-border bg-surface">
          {items.map((i) => (
            <label key={i.id} className="flex items-center justify-between gap-4 border-b border-border px-4 py-2 last:border-0">
              <span>
                {i.name} <span className="ml-2 font-mono text-xs text-muted">{i.barcode}</span>
              </span>
              <input
                type="number"
                min="0"
                max="200"
                className="input w-24"
                aria-label={`Copies of ${i.name}`}
                value={copies[i.id] ?? 0}
                onChange={(e) => setCopies({ ...copies, [i.id]: Math.max(0, Math.min(200, Number(e.target.value))) })}
              />
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(50mm,1fr))] gap-2 print:gap-1">
        {labels.map((l, n) => (
          <div key={`${l.id}-${n}`} className="break-inside-avoid rounded-ui border border-border p-2 text-center text-xs print:rounded-none">
            <div className="truncate font-medium">{l.name}</div>
            <Barcode value={l.barcode} />
            <div>MRP {formatINR(l.mrpPaise)}</div>
          </div>
        ))}
      </div>
    </>
  );
}
