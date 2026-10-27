"use client";

import { printReceipt } from "@/lib/print";

export function PrintButton() {
  return (
    <button className="btn" onClick={printReceipt}>
      Reprint
    </button>
  );
}
