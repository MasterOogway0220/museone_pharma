import type { Metadata } from "next";
import Image from "next/image";
import { plans, site } from "@/data/site";
import { Receipt } from "@/app/t/[slug]/(app)/till/receipt";
import { DemoForm } from "./demo-form";
// Real screenshots from `pnpm screens`; static imports give Next the true sizes.
import offlineShot from "../../../public/screens/offline.png";
import productsShot from "../../../public/screens/products.png";
import reportsShot from "../../../public/screens/reports.png";
import tillShot from "../../../public/screens/till.png";

export const metadata: Metadata = {
  title: { absolute: "MuseOne Pharma: billing and stock for Mumbai chemists" },
  description: site.description,
  alternates: { canonical: "/" },
};

// A real bill as printed by the till (same component), with sample data.
const sampleBill = {
  invoiceNo: "A01-00128",
  soldAt: "2026-10-27T13:12:00.000Z",
  customerName: "Sunita Desai",
  customerPhone: "9820012345",
  doctorName: "Dr. A. Kulkarni",
  patientName: "Sunita Desai",
  discountPct: 0,
  paymentMethod: "upi",
  tendered: null,
  lines: [
    { name: "Dolo 650 Tablet", batch: "DL4521", expiry: "2028-03-31", hsn: "3004", gstRate: 5, mrp: "33.60", qty: 1, netPaise: 3360 },
    { name: "Pan 40 Tablet", batch: "PN2290", expiry: "2026-12-31", hsn: "3004", gstRate: 5, mrp: "199.00", qty: 1, netPaise: 18900 },
    { name: "Azithral 500 Tablet", batch: "AZ1187", expiry: "2027-08-31", hsn: "3004", gstRate: 5, mrp: "119.50", qty: 1, netPaise: 11950 },
  ],
  totals: { grossPaise: 34210, netPaise: 34210, taxablePaise: 32581, cgstPaise: 814, sgstPaise: 815, roundOffPaise: -10, payablePaise: 34200 },
  cashier: "Kiran",
};
const sampleShop = {
  name: "Sai Medical & General Stores",
  gstin: "27AAPFU0939F1ZV",
  address: "12, Ranade Road, Dadar West, Mumbai 400028",
  phone: "022 2430 0000",
  drugLicence: "MH-MZ2-20B/123456",
  footer: "Get well soon.",
  defaultDiscountPct: 0,
};

const faqs = [
  {
    q: "What happens when the internet goes?",
    a: "Keep billing. Bills are saved on the counter computer and go to your account by themselves when the connection is back. The screen shows how many are waiting.",
  },
  {
    q: "What do I need at the counter?",
    a: "Any Windows computer with Chrome or Edge, or our desktop app. It works with 80 mm receipt printers and with USB barcode scanners.",
  },
  {
    q: "How does it handle Schedule H1 medicines?",
    a: "The bill cannot be completed without the doctor's and patient's names, and the register can be downloaded for any period when an inspector asks.",
  },
  {
    q: "Can my staff see everything?",
    a: "No. Each staff member gets their own login, and you choose what they can manage: products, reports, staff or settings. Cashiers can just bill.",
  },
  {
    q: "Can I take my data out?",
    a: "Yes. Sales lines, GST details and the H1 register download as CSV files that open in Excel or go to your accountant.",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero: split 7/5. The bill is the product. */}
      <section className="mx-auto grid max-w-6xl items-start gap-10 px-4 pt-12 pb-16 md:grid-cols-12 md:pt-20">
        <div className="md:col-span-7">
          <h1 className="text-4xl leading-[1.08] font-semibold tracking-[-0.02em] sm:text-5xl lg:text-6xl">
            Every bill right. Batch, expiry and GST in one scan.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            MuseOne Pharma is billing and stock for chemists in Mumbai. Scan the strip, take payment, and the tax invoice prints with everything the
            law asks for, even when the internet is down.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href="#demo" className="btn-cta">
              Book a free demo
            </a>
            <a href="#counter" className="link-quiet text-base">
              See it at the counter
            </a>
          </div>
          <p className="mt-10 text-sm text-muted">The bill shown here is printed by MuseOne itself, with sample shop details.</p>
        </div>
        <div className="md:col-span-5">
          {/* Printer slot; the receipt feeds out of it. */}
          <div className="h-3 rounded-ui bg-foreground/85" aria-hidden="true" />
          <div className="mx-4 overflow-hidden">
            <figure className="receipt-feed border-x border-b border-border bg-[#fffdf7] px-3 pt-4 pb-6">
              <Receipt bill={sampleBill} settings={sampleShop} />
              <figcaption className="sr-only">Sample MuseOne tax invoice showing batch, expiry, HSN, drug licence number and CGST and SGST.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* At the counter: full-width screenshot with a key strip. */}
      <section id="counter" className="border-t border-border py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.01em]">Built for the rush at the counter</h2>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            The scan box always has focus. Scan a strip and it is on the bill, with the batch that expires first picked for you. Three keys run the
            whole sale.
          </p>
          <Image
            src={tillShot}
            alt="MuseOne billing screen with three medicines, batch and expiry under each, Schedule H1 doctor and patient fields, and a total of ₹342 to pay."
            sizes="(min-width: 1152px) 1120px, 100vw"
            className="mt-10 w-full rounded-ui border border-border"
          />
          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ["F2", "Search a medicine by name when there is no barcode"],
              ["F8", "Hold the bill while the customer fetches a prescription"],
              ["F9", "Take payment: cash with change, UPI, card or credit"],
            ].map(([key, text]) => (
              <div key={key} className="flex items-start gap-3">
                <dt className="kbd">{key}</dt>
                <dd className="text-muted">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Offline: 4/8 with a timeline. */}
      <section className="border-t border-border py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-12">
          <div className="md:col-span-4">
            <h2 className="text-3xl font-semibold tracking-[-0.01em]">The internet drops. The queue doesn&apos;t.</h2>
            <ol className="mt-8 space-y-5 border-l border-border pl-5">
              <li>
                <span className="block font-mono text-sm text-muted">8:12 pm</span>
                Broadband goes down. The screen says Offline.
              </li>
              <li>
                <span className="block font-mono text-sm text-muted">8:13 pm</span>
                You keep billing. Each bill is saved on the computer and printed.
              </li>
              <li>
                <span className="block font-mono text-sm text-muted">8:40 pm</span>
                Connection is back. Waiting bills go to your account on their own, once each.
              </li>
            </ol>
          </div>
          <Image
            src={offlineShot}
            alt="Billing screen marked Offline with two bills waiting to sync while a new bill is being made."
            sizes="(min-width: 768px) 66vw, 100vw"
            className="w-full rounded-ui border border-border md:col-span-8"
          />
        </div>
      </section>

      {/* Stock and expiry: image over text. */}
      <section className="border-t border-border py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <Image
            src={productsShot}
            alt="Product list with MRP, price, GST, stock and next expiry, showing low stock and near expiry warnings."
            sizes="(min-width: 1152px) 1120px, 100vw"
            className="w-full rounded-ui border border-border"
          />
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <h2 className="text-3xl font-semibold tracking-[-0.01em]">Know what expires before it does</h2>
            <p className="text-lg text-muted">
              Stock is kept by batch and expiry. Anything expiring in the next 90 days is flagged, so you can return it to the distributor in time.
              Expired batches can never be billed, and low stock shows up before the shelf is empty.
            </p>
          </div>
        </div>
      </section>

      {/* Compliance: rule to feature table. */}
      <section className="border-t border-border py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.01em]">What the inspector and your CA will ask for</h2>
          <table className="mt-10 w-full text-left">
            <caption className="sr-only">Rules and how MuseOne Pharma handles them</caption>
            <thead className="border-b border-border text-sm text-muted">
              <tr>
                <th scope="col" className="py-3 pr-6 font-medium">
                  Requirement
                </th>
                <th scope="col" className="py-3 font-medium">
                  In MuseOne
                </th>
              </tr>
            </thead>
            <tbody className="align-top">
              {[
                ["GST tax invoice", "GSTIN, HSN, and CGST and SGST worked out on every line. Prices you enter include GST, as on the strip."],
                ["Schedule H1 register", "Doctor and patient captured at billing. Download the register for any date range."],
                ["Drug licence on the bill", "Your licence numbers print on every invoice."],
                ["Batch and expiry", "Printed per line, taken from the batch that expires first."],
                ["MRP", "A selling price above MRP is refused, at the counter and on the server."],
                ["GSTR-1 summary", "Taxable value and tax by GST rate for any period, ready for your accountant."],
              ].map(([rule, how]) => (
                <tr key={rule} className="border-b border-border">
                  <th scope="row" className="py-4 pr-6 font-medium">
                    {rule}
                  </th>
                  <td className="py-4 text-muted">{how}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-12 grid items-center gap-8 md:grid-cols-12">
            <p className="text-lg text-muted md:col-span-4">
              At closing time, one page shows the day: sales, discounts, GST by rate, profit, and the split by cashier and by UPI or cash.
            </p>
            <Image
              src={reportsShot}
              alt="Reports page with net sales, bills, discount, gross profit, CGST and SGST, and a GST summary by rate."
              sizes="(min-width: 768px) 66vw, 100vw"
              className="w-full rounded-ui border border-border md:col-span-8"
            />
          </div>
        </div>
      </section>

      {/* Pricing: two plans. */}
      <section id="pricing" className="border-t border-border py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-semibold tracking-[-0.01em]">One yearly price per shop</h2>
          <p className="mt-4 max-w-2xl text-lg text-muted">No setup fee and no charge per bill. Prices are before GST. Every shop starts with a free trial month.</p>
          <div className="mt-10 grid gap-px overflow-hidden rounded-ui border border-border bg-border md:grid-cols-2">
            {plans.map((p) => (
              <div key={p.name} className="bg-surface p-6 sm:p-8">
                <h3 className="text-xl font-semibold">{p.name}</h3>
                <p className="text-muted">{p.for}</p>
                <p className="mt-6">
                  <span className="text-4xl font-semibold tabular-nums">{p.price}</span> <span className="text-muted">{p.period}</span>
                </p>
                <ul className="mt-6 space-y-2 border-t border-border pt-6">
                  {p.includes.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Questions. */}
      <section id="faq" className="border-t border-border py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-12">
          <h2 className="text-3xl font-semibold tracking-[-0.01em] md:col-span-4">Questions chemists ask us</h2>
          <div className="md:col-span-8">
            {faqs.map((f) => (
              <details key={f.q} className="group border-b border-border py-4">
                <summary className="cursor-pointer list-none text-lg font-medium marker:hidden">
                  <span className="mr-3 inline-block font-mono text-brand transition-transform group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                  {f.q}
                </summary>
                <p className="mt-3 pl-7 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Demo form: 5/7. */}
      <section id="demo" className="border-t border-border bg-surface py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-12">
          <div className="md:col-span-5">
            <h2 className="text-3xl font-semibold tracking-[-0.01em]">See it on your own counter</h2>
            <p className="mt-4 text-lg text-muted">
              Leave your number. We show you MuseOne with a few of your own medicines, on a call or at your shop, and set up your trial if you like it.
            </p>
          </div>
          <div className="md:col-span-7">
            <DemoForm />
          </div>
        </div>
      </section>
    </>
  );
}
