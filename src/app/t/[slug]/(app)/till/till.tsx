"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { holdCart, listHeld, searchCustomers, takeHeld } from "../pos-actions";
import { buildSaleLines, deductSold, inStock, needsPrescription, priceLines, type CartItem } from "@/lib/cart";
import { formatINR, toPaise } from "@/lib/money";
import { printReceipt } from "@/lib/print";
import type { PosProduct, PosSettings } from "@/lib/pos";
import { todayInIndia } from "@/lib/subscription";
import { dismissRejected, getTill, loadCatalog, nextInvoiceNo, queueSale, saveCatalog, setTill } from "@/lib/till-store";
import { useSync } from "@/lib/use-sync";
import type { SaleInput } from "@/lib/validation";
import { Receipt, type PrintedBill } from "./receipt";

type Catalog = { products: PosProduct[]; settings: PosSettings; user: { id: string; name: string }; readOnly: boolean };
type Customer = { id: string | null; name: string; phone: string };
type Payment = SaleInput["paymentMethod"];

const EMPTY_CUSTOMER: Customer = { id: null, name: "", phone: "" };

export function Till({ slug }: { slug: string }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [catalogAge, setCatalogAge] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [till, setTillCode] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [query, setQuery] = useState("");
  const [discountPct, setDiscountPct] = useState(0);
  const [customer, setCustomer] = useState<Customer>(EMPTY_CUSTOMER);
  const [rx, setRx] = useState({ doctorName: "", patientName: "" });
  const [paying, setPaying] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [printed, setPrinted] = useState<PrintedBill | null>(null);
  const [held, setHeld] = useState<{ id: string; label: string }[] | null>(null);
  const [pending, startTransition] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);
  const sync = useSync(slug);
  const today = todayInIndia();

  type Loaded = { data: Catalog; savedAt: number | null } | { error: string };
  const applyCatalog = useCallback((r: Loaded) => {
    if ('error' in r) return setLoadError(r.error);
    setCatalog(r.data);
    setCatalogAge(r.savedAt);
    setDiscountPct((d) => d || r.data.settings.defaultDiscountPct);
  }, []);
  const refreshCatalog = useCallback(() => void fetchCatalog(slug).then(applyCatalog), [slug, applyCatalog]);

  useEffect(() => {
    // Lets this page open offline (see public/sw.js).
    navigator.serviceWorker?.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    fetchCatalog(slug).then(applyCatalog);
    ensureTill(slug).then(setTillCode);
  }, [slug, applyCatalog]);

  const products = useMemo(() => new Map((catalog?.products ?? []).map((p) => [p.id, p])), [catalog]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !catalog) return [];
    return catalog.products
      .filter((p) => p.barcode.toLowerCase() === q || p.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, catalog]);

  const lines = useMemo(() => buildSaleLines(cart, products, today), [cart, products, today]);
  const priced = useMemo(() => priceLines(lines, products, discountPct), [lines, products, discountPct]);
  const rxNeed = needsPrescription(cart, products);

  const add = useCallback((productId: string, qty = 1) => {
    setCart((c) => {
      const found = c.find((i) => i.productId === productId);
      if (found) return c.map((i) => (i.productId === productId ? { ...i, qty: i.qty + qty } : i));
      return [...c, { productId, qty }];
    });
    setQuery("");
    setNotice(null);
    searchRef.current?.focus();
  }, []);

  const setQty = (productId: string, qty: number) =>
    setCart((c) => (qty <= 0 ? c.filter((i) => i.productId !== productId) : c.map((i) => (i.productId === productId ? { ...i, qty } : i))));

  const clear = () => {
    setCart([]);
    setCustomer(EMPTY_CUSTOMER);
    setRx({ doctorName: "", patientName: "" });
    setDiscountPct(catalog?.settings.defaultDiscountPct ?? 0);
    setPaying(false);
    searchRef.current?.focus();
  };

  // Scanner or keyboard: Enter adds an exact barcode match, or the only/first search result.
  const onSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && results.length) {
      e.preventDefault();
      const exact = results.find((p) => p.barcode.toLowerCase() === query.trim().toLowerCase());
      add((exact ?? results[0]).id);
    }
    if (e.key === "Escape") setQuery("");
  };

  async function completeSale(method: Payment, tenderedRupees: number | null) {
    if (!catalog || !till) return;
    const sale: SaleInput = {
      id: crypto.randomUUID(),
      invoiceNo: await nextInvoiceNo(slug, till),
      tillCode: till,
      soldAt: new Date().toISOString(),
      customerId: customer.id,
      customerName: customer.name || null,
      customerPhone: /^[6-9]\d{9}$/.test(customer.phone) ? customer.phone : null,
      doctorName: rx.doctorName || null,
      patientName: rx.patientName || null,
      discountPct,
      paymentMethod: method,
      tendered: tenderedRupees,
      lines,
    };
    // Saved on this device before anything else: a crash or lost network can't lose the bill.
    await queueSale(slug, sale);
    void sync.refresh();
    setPrinted({
      ...sale,
      lines: lines.map((l, i) => {
        const p = products.get(l.productId)!;
        return { ...l, name: p.name, hsn: p.hsn, gstRate: p.gstRate, mrp: p.mrp, netPaise: priced.lines[i].netPaise };
      }),
      totals: priced.totals,
      cashier: catalog.user.name,
    });
    setCatalog({ ...catalog, products: deductSold(catalog.products, lines) as PosProduct[] });
    setNotice({ kind: "ok", text: `Bill ${sale.invoiceNo} saved. ${formatINR(priced.totals.payablePaise)}` });
    clear();
    void sync.sync();
  }

  // Print after the receipt for the new bill has rendered.
  useEffect(() => {
    if (printed) printReceipt();
  }, [printed]);

  const openHeld = () =>
    startTransition(async () => {
      setHeld(await listHeld(slug));
    });

  const hold = () => {
    if (!cart.length) return;
    const label = customer.name || `Bill with ${cart.length} item${cart.length > 1 ? "s" : ""}`;
    startTransition(async () => {
      try {
        await holdCart(slug, label, JSON.stringify({ cart, customer, rx, discountPct }));
        setNotice({ kind: "ok", text: `Held: ${label}` });
        clear();
      } catch {
        setNotice({ kind: "error", text: "Could not hold the bill. Holding needs internet." });
      }
    });
  };

  const resume = (id: string) =>
    startTransition(async () => {
      const raw = await takeHeld(slug, id);
      setHeld(null);
      if (!raw) return setNotice({ kind: "error", text: "That bill was already resumed on another till." });
      const h = JSON.parse(raw) as { cart: CartItem[]; customer: Customer; rx: typeof rx; discountPct: number };
      setCart(h.cart.filter((i) => products.has(i.productId)));
      setCustomer(h.customer);
      setRx(h.rx);
      setDiscountPct(h.discountPct);
      searchRef.current?.focus();
    });

  // Shortcuts: F2 search, F8 hold, F9 pay.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "F8") {
        e.preventDefault();
        hold();
      }
      // Always open; the dialog only shows with items (the cart here may be one render behind a fast scan).
      if (e.key === "F9") {
        e.preventDefault();
        setPaying(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (loadError) return <p className="rounded-ui border border-danger/40 p-6 text-danger">{loadError}</p>;
  if (!catalog) return <TillSkeleton />;

  const blocked = catalog.readOnly || sync.problem === "read-only";
  const canPay = cart.length > 0 && !!till && !blocked && (!rxNeed.register || (!!rx.doctorName && !!rx.patientName));

  return (
    <>
      <div className="print:hidden">
        <StatusBar
          online={sync.online}
          pending={sync.pending}
          till={till}
          catalogAge={catalogAge}
          problem={sync.problem}
          onRefresh={refreshCatalog}
        />
        {sync.rejected.map((r) => (
          <p key={r.id} role="alert" className="mb-3 flex items-center justify-between gap-4 rounded-ui border border-danger/40 px-4 py-2 text-sm">
            <span>
              Bill {r.sale.invoiceNo} was not accepted: {r.error}
            </span>
            <button className="text-danger underline" onClick={() => void dismissRejected(r.id).then(sync.refresh)}>
              Dismiss
            </button>
          </p>
        ))}
        {notice && (
          <p role="status" className={`mb-3 text-sm ${notice.kind === "ok" ? "text-brand" : "text-danger"}`}>
            {notice.text}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <section aria-label="Bill">
            <div className="relative mb-4">
              <label htmlFor="scan" className="sr-only">
                Scan barcode or search medicine
              </label>
              <input
                id="scan"
                ref={searchRef}
                autoFocus
                autoComplete="off"
                className="input py-3 text-lg"
                placeholder="Scan barcode or type medicine name (F2)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onSearchKey}
              />
              {results.length > 0 && (
                <ul role="listbox" aria-label="Matching medicines" className="absolute z-10 mt-1 w-full rounded-ui border border-border bg-surface">
                  {results.map((p) => {
                    const stock = inStock(p);
                    return (
                      <li key={p.id} role="option" aria-selected={false}>
                        <button
                          className="flex w-full items-center justify-between gap-4 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-background"
                          onClick={() => add(p.id)}
                        >
                          <span>
                            <span className="font-medium">{p.name}</span>
                            {p.schedule !== "none" && <span className="ml-2 text-xs font-medium text-danger">Sch. {p.schedule}</span>}
                            <span className="block text-sm text-muted">{p.categoryName ?? ""}</span>
                          </span>
                          <span className="text-right text-sm">
                            <span className="font-mono">{formatINR(toPaise(p.price))}</span>
                            <span className={`block ${p.trackStock && stock <= 0 ? "text-danger" : "text-muted"}`}>
                              {p.trackStock ? `${stock} in stock` : "Not tracked"}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="rounded-ui border border-dashed border-border p-10 text-center text-muted">
                Scan a medicine to start the bill.
                <div className="mt-4 text-sm">
                  <button className="underline" onClick={openHeld} disabled={pending}>
                    Resume a held bill
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-ui border border-border bg-surface">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-muted">
                    <tr>
                      <th className="px-3 py-2 font-medium">Medicine</th>
                      <th className="px-3 py-2 font-medium">Qty</th>
                      <th className="px-3 py-2 text-right font-medium">Price</th>
                      <th className="px-3 py-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => {
                      const p = products.get(item.productId);
                      if (!p) return null;
                      const parts = lines.filter((l) => l.productId === p.id);
                      const amount = priced.lines.reduce((s, l, i) => (lines[i].productId === p.id ? s + l.netPaise : s), 0);
                      const short = p.trackStock && item.qty > inStock(p);
                      return (
                        <tr key={p.id} className="border-b border-border align-top last:border-0">
                          <td className="px-3 py-2">
                            <div className="font-medium">
                              {p.name}
                              {p.schedule !== "none" && <span className="ml-2 text-xs text-danger">Sch. {p.schedule}</span>}
                            </div>
                            <div className="text-xs text-muted">
                              {parts.map((l) => (l.batch ? `${l.batch} exp ${l.expiry?.slice(0, 7)} x${l.qty}` : "")).filter(Boolean).join(", ")}
                            </div>
                            {short && <div className="text-xs text-warning">Only {Math.max(0, inStock(p))} in stock</div>}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <button className="btn-quiet size-9 p-0" aria-label={`One less ${p.name}`} onClick={() => setQty(p.id, item.qty - 1)}>
                                -
                              </button>
                              <input
                                className="input w-16 text-center"
                                type="number"
                                min="0"
                                aria-label={`Quantity of ${p.name}`}
                                value={item.qty}
                                onChange={(e) => setQty(p.id, Math.min(10_000, Math.floor(Number(e.target.value))))}
                              />
                              <button className="btn-quiet size-9 p-0" aria-label={`One more ${p.name}`} onClick={() => setQty(p.id, item.qty + 1)}>
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right font-mono">{formatINR(toPaise(p.price))}</td>
                          <td className="px-3 py-2 text-right font-mono">{formatINR(amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <aside aria-label="Bill summary" className="space-y-4">
            <CustomerBox slug={slug} customer={customer} onChange={setCustomer} />
            {(rxNeed.register || rxNeed.rx) && (
              <div className="space-y-3 rounded-ui border border-danger/40 bg-surface p-4">
                <p className="text-sm font-medium text-danger">
                  {rxNeed.register ? "Schedule H1/X: doctor and patient names are required." : "Schedule H: sell only against a prescription."}
                </p>
                <input className="input" placeholder="Doctor name" aria-label="Doctor name" value={rx.doctorName} onChange={(e) => setRx({ ...rx, doctorName: e.target.value })} />
                <input className="input" placeholder="Patient name" aria-label="Patient name" value={rx.patientName} onChange={(e) => setRx({ ...rx, patientName: e.target.value })} />
              </div>
            )}
            <div className="rounded-ui border border-border bg-surface p-4">
              <Line label={`Items (${cart.reduce((s, i) => s + i.qty, 0)})`} value={formatINR(priced.totals.grossPaise)} />
              <div className="my-2 flex items-center justify-between gap-2">
                <label htmlFor="discount" className="text-sm">
                  Discount %
                </label>
                <input
                  id="discount"
                  className="input w-20 text-right"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(Math.min(100, Math.max(0, Number(e.target.value))))}
                />
              </div>
              <Line label="Taxable" value={formatINR(priced.totals.taxablePaise)} muted />
              <Line label="CGST + SGST" value={formatINR(priced.totals.cgstPaise + priced.totals.sgstPaise)} muted />
              {priced.totals.roundOffPaise !== 0 && <Line label="Round off" value={formatINR(priced.totals.roundOffPaise)} muted />}
              <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
                <span className="font-medium">To pay</span>
                <span className="font-mono text-3xl font-semibold" data-testid="payable">
                  {formatINR(priced.totals.payablePaise)}
                </span>
              </div>
            </div>
            <button className="btn w-full py-4 text-lg" disabled={!canPay} onClick={() => setPaying(true)}>
              Pay (F9)
            </button>
            {blocked && <p className="text-sm text-warning">Billing is paused: subscription ended.</p>}
            <div className="grid grid-cols-3 gap-2">
              <button className="btn-quiet" onClick={hold} disabled={!cart.length || pending}>
                Hold (F8)
              </button>
              <button className="btn-quiet" onClick={openHeld} disabled={pending}>
                Held bills
              </button>
              <button className="btn-quiet" onClick={clear} disabled={!cart.length}>
                Clear
              </button>
            </div>
            {held && (
              <div className="rounded-ui border border-border bg-surface p-3">
                <p className="mb-2 text-sm font-medium">Held bills</p>
                {held.length === 0 ? (
                  <p className="text-sm text-muted">None.</p>
                ) : (
                  <ul className="space-y-1">
                    {held.map((h) => (
                      <li key={h.id}>
                        <button className="w-full rounded-ui px-2 py-2 text-left text-sm hover:bg-background" onClick={() => resume(h.id)}>
                          {h.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>

      {paying && canPay && (
        <PayDialog
          payablePaise={priced.totals.payablePaise}
          hasCustomer={!!customer.id}
          onCancel={() => {
            setPaying(false);
            searchRef.current?.focus();
          }}
          onPay={(m, t) => void completeSale(m, t)}
        />
      )}

      {printed && (
        <div className="hidden print:block">
          <Receipt bill={printed} settings={catalog.settings} />
        </div>
      )}
    </>
  );
}

// Catalog: from the server when online, else the copy saved on this device.
async function fetchCatalog(slug: string): Promise<{ data: Catalog; savedAt: number | null } | { error: string }> {
  try {
    const res = await fetch(`/api/t/${slug}/pos`, { signal: AbortSignal.timeout(10_000) });
    if (res.status === 401) return { error: "You are signed out. Reload the page and sign in again." };
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as Catalog;
    await saveCatalog(slug, data);
    return { data, savedAt: null };
  } catch {
    const cached = await loadCatalog<Catalog>(slug);
    if (cached) return cached;
    return { error: "Could not load products. Connect to the internet once to set up this till." };
  }
}

// Registers this device once (needs internet), then reuses its till code.
async function ensureTill(slug: string): Promise<string | null> {
  const code = await getTill(slug);
  if (code) return code;
  const res = await fetch(`/api/t/${slug}/tills`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: navigator.userAgent.slice(0, 60) }),
  }).catch(() => null);
  if (!res?.ok) return null;
  const fresh = ((await res.json()) as { code: string }).code;
  await setTill(slug, fresh);
  return fresh;
}

function Line({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${muted ? "text-muted" : ""}`}>
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function StatusBar(props: {
  online: boolean;
  pending: number;
  till: string | null;
  catalogAge: number | null;
  problem: string | null;
  onRefresh: () => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" aria-live="polite">
      <span className={props.online ? "text-brand" : "font-medium text-warning"}>{props.online ? "Online" : "Offline: bills are saved on this device"}</span>
      {props.pending > 0 && (
        <span className="text-warning">
          {props.pending} bill{props.pending > 1 ? "s" : ""} waiting to sync
        </span>
      )}
      {props.problem === "signed-out" && <span className="text-danger">Signed out. Sign in again to sync bills.</span>}
      {props.catalogAge && (
        <span className="text-muted">
          Using product list saved {new Date(props.catalogAge).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
        </span>
      )}
      <span className="text-muted">Till {props.till ?? "not registered"}</span>
      <button className="text-muted underline" onClick={props.onRefresh}>
        Refresh products
      </button>
    </div>
  );
}

function CustomerBox({ slug, customer, onChange }: { slug: string; customer: Customer; onChange: (c: Customer) => void }) {
  const [matches, setMatches] = useState<{ id: string; name: string; phone: string | null }[]>([]);
  const [, startTransition] = useTransition();
  const lookup = (q: string) =>
    startTransition(async () => {
      setMatches(await searchCustomers(slug, q).catch(() => []));
    });
  return (
    <div className="space-y-2 rounded-ui border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Customer</span>
        {customer.id && (
          <button className="text-xs text-muted underline" onClick={() => onChange(EMPTY_CUSTOMER)}>
            Walk-in instead
          </button>
        )}
      </div>
      <input
        className="input"
        placeholder="Name (optional)"
        aria-label="Customer name"
        value={customer.name}
        readOnly={!!customer.id}
        onChange={(e) => {
          onChange({ ...customer, name: e.target.value });
          lookup(e.target.value);
        }}
      />
      <input
        className="input"
        placeholder="Mobile (optional)"
        aria-label="Customer mobile"
        inputMode="numeric"
        value={customer.phone}
        readOnly={!!customer.id}
        onChange={(e) => onChange({ ...customer, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
      />
      {!customer.id && matches.length > 0 && (
        <ul className="rounded-ui border border-border">
          {matches.map((m) => (
            <li key={m.id}>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-background"
                onClick={() => {
                  onChange({ id: m.id, name: m.name, phone: m.phone ?? "" });
                  setMatches([]);
                }}
              >
                {m.name} <span className="text-muted">{m.phone}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PayDialog({
  payablePaise,
  hasCustomer,
  onCancel,
  onPay,
}: {
  payablePaise: number;
  hasCustomer: boolean;
  onCancel: () => void;
  onPay: (method: Payment, tendered: number | null) => void;
}) {
  const [method, setMethod] = useState<Payment>("cash");
  const [tendered, setTendered] = useState("");
  const tenderedPaise = tendered ? toPaise(tendered) : null;
  const short = method === "cash" && tenderedPaise !== null && tenderedPaise < payablePaise;
  const disabled = short || (method === "credit" && !hasCustomer);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disabled) onPay(method, method === "cash" && tendered ? Number(tendered) : null);
  };
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-foreground/30 p-4 print:hidden" role="dialog" aria-modal="true" aria-labelledby="pay-title">
      <form onSubmit={submit} onKeyDown={(e) => e.key === "Escape" && onCancel()} className="w-full max-w-md space-y-5 rounded-ui border border-border bg-surface p-6">
        <div className="flex items-baseline justify-between">
          <h2 id="pay-title" className="text-lg font-semibold">
            Payment
          </h2>
          <span className="font-mono text-2xl font-semibold">{formatINR(payablePaise)}</span>
        </div>
        <fieldset className="grid grid-cols-4 gap-2">
          <legend className="sr-only">Payment method</legend>
          {(["cash", "upi", "card", "credit"] as const).map((m) => (
            <label key={m} className={`cursor-pointer rounded-ui border px-2 py-3 text-center text-sm font-medium uppercase ${method === m ? "border-brand text-brand" : "border-border"}`}>
              <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} className="sr-only" />
              {m}
            </label>
          ))}
        </fieldset>
        {method === "cash" && (
          <div>
            <label htmlFor="tendered" className="label">
              Cash received (₹)
            </label>
            <input id="tendered" className="input text-lg" type="number" step="1" min="0" autoFocus value={tendered} onChange={(e) => setTendered(e.target.value)} />
            {tenderedPaise !== null && (
              <p className={`mt-2 text-lg ${short ? "text-danger" : ""}`}>
                {short ? "Less than the bill amount" : `Change: ${formatINR(tenderedPaise - payablePaise)}`}
              </p>
            )}
          </div>
        )}
        {method === "credit" && !hasCustomer && <p className="text-sm text-danger">Pick a saved customer for credit.</p>}
        <div className="flex gap-2">
          <button type="button" className="btn-quiet flex-1" onClick={onCancel}>
            Back (Esc)
          </button>
          <button className="btn flex-1 py-3" disabled={disabled} autoFocus={method !== "cash"}>
            Complete and print
          </button>
        </div>
      </form>
    </div>
  );
}

function TillSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]" aria-busy="true" aria-label="Loading till">
      <div className="space-y-3">
        <div className="h-14 animate-pulse rounded-ui bg-border/40" />
        <div className="h-64 animate-pulse rounded-ui bg-border/40" />
      </div>
      <div className="h-80 animate-pulse rounded-ui bg-border/40" />
    </div>
  );
}
