# MuseOne Pharma — v1 Plan

Rebuild of PharmaSpot (MIT, © Patterns Digital Limited — keep their notice in `LICENSE`) as a
multi-tenant pharmacy POS SaaS. Status: **approved 2026-10-27**. Phases 0 to 8 built. Open: desktop app smoke test (Electron download failed on the build machine), CSP, items marked confirm in src/data/site.ts.

Market: India, starting with Mumbai. That means INR, GST (CGST + SGST inside Maharashtra, IGST
across states), HSN codes on medicines, and batch + expiry on every sale.

## Decisions (from the owner)

| Topic | Decision |
|---|---|
| Shape | Web app + desktop app, multi-tenant |
| Stack | Next.js (App Router, TypeScript) + MySQL |
| Tenants | Created by **super admin only**, no public signup |
| Tenant link | Path: `museonepharma.com/t/<slug>` |
| Billing | Manual: super admin sets plan, paid-until, suspend |
| Offline | **Required**: sales keep working with no internet, sync later |
| Location | `E:\projects\pharma\museone-pharma`, new repo, PharmaSpot untouched |
| UI | Rebuilt: simple to understand, modern, fast to use at the counter |

## Stack

- **App:** Next.js + TypeScript, Tailwind, shadcn/ui
- **DB:** MySQL 8 with Drizzle ORM (`mysql2` driver), migrations through `drizzle-kit`
- **Auth:** Better Auth (email + password, sessions in MySQL), roles per tenant
- **Offline:** installable PWA. A service worker (Serwist) caches the app shell, and IndexedDB (Dexie) holds the catalog cache and the outbox of unsynced sales
- **Desktop:** Electron shell that loads the tenant link, plus silent receipt printing and a "start on boot" option. The same offline code runs in browser and desktop.
- **Validation:** Zod on every server action and route handler
- **Tests:** Vitest (logic), Playwright (checkout + offline sync)

All library APIs are checked against current docs (Context7) at build time, not from memory.

## Core design

1. **Tenant isolation.** Every business table has a `tenant_id`. All queries go through a single
   `db.forTenant(tenantId)` helper, so no query can leave out the tenant filter. The tenant comes from the session, never from the URL alone.
   A test proves that tenant A cannot read tenant B's data.
2. **Stock as a ledger.** Stock is never stored as one editable number. Each sale, purchase or
   adjustment is a `stock_movements` row (+/− qty). Current stock = the sum of rows for that product. This makes offline sync
   conflict-free: two offline tills both selling the last box just produce a negative stock flag,
   with no lost data.
3. **Offline sales.** The till creates each sale with a client UUID and stores it in the IndexedDB outbox, then
   prints the receipt. When the till is back online, the sync endpoint accepts sales *idempotently*: the same UUID twice is stored only once.
   The catalog, prices, tax and settings are pulled down to the till and cached.
4. **Money.** Stored as `DECIMAL(12,2)`. All rounding happens in one tested helper.
5. **Subscription gate.** `tenants.status` is one of trial / active / past_due / suspended. Past `paid_until`, the tenant gets a
   7-day read-only grace period, then is blocked. Offline tills enforce the same rule using the last known `paid_until`.

## Roles

- **Super admin** (you): creates tenants and their first owner account, sets plans and payments, suspends tenants, sees usage
- **Owner:** everything inside one pharmacy
- **Manager / Cashier:** permissions matching PharmaSpot's `perm_products`, `perm_categories`,
  `perm_transactions`, `perm_users`, `perm_settings`

## Phases (each ends working and tested)

### Phase 0: Scaffold
Next.js app, MySQL schema, Drizzle migrations, Better Auth, `.env.example`, lint + typecheck + test scripts.
**Done when:** `pnpm build`, `pnpm test` and `pnpm lint` all pass, and the login page renders.

### Phase 1: Super admin + tenancy
Super admin console at `/admin`. Create a tenant (name, slug, owner email, plan, paid-until), suspend it, record a manual
payment. Tenant routes live at `/t/[slug]/...`.
**Done when:** you can create a pharmacy, and its owner can log in at `/t/<slug>`. The cross-tenant access test passes.

### Phase 2: Catalog parity
Products (name, barcode/SKU, category, price, supplier, expiry date, min stock, stock tracking on or off,
image), categories, customers. Barcode label printing. Expiry and low-stock badges (`isExpired`,
`daysToExpire`, `getStockStatus` ported from PharmaSpot with their tests).
**Done when:** you can create, edit and delete each of these with validation, and images upload with type and size checks.

India additions (decided after approval): HSN code and GST rate per product (0, 5, 12, 18%),
MRP and selling price, batch number per stock entry, Schedule H / H1 flag.

### Phase 3: POS / checkout parity
India additions: GST invoice (GSTIN, HSN, CGST/SGST split per line), amounts in ₹ with Indian
digit grouping, doctor name and patient name for Schedule H1 sales.

Fast sale screen: barcode scan, search, cart, discount, VAT (`charge_tax`, `percentage`), payment
and change, hold order, resume held order, customer orders, receipt printing (store name, address, contact, VAT no,
footer, logo). Quick billing mode. Till numbers.
**Done when:** a Playwright test completes a sale end to end and the receipt totals match the money helper.

### Phase 4: Offline + desktop
PWA install, catalog cache, outbox, sync endpoint, sync status indicator ("3 sales waiting to sync"),
Electron shell with silent printing. Packaged with electron-forge: Windows installer first.
**Done when:** a Playwright test can go offline, make 3 sales, go back online, and find exactly 3 sales on the server even after a retry.

### Phase 5: Reports + users + settings
Sales by date, user and till. Totals, VAT, profit and top products, with CSV export. User management with permissions.
Store settings. Data export per tenant. This replaces PharmaSpot's zip backup, because the server is now the backup.
**Done when:** report numbers match seeded test data.

### Phase 6: UI pass
Direction set with taste-skill before Phase 2 starts, then applied throughout. The FRONTEND-RULES block in CLAUDE.md is the gate.
- Built around the till: the sale screen opens first, the scan box always has focus, and everything works from the keyboard
  (F-keys for pay, hold and search)
- Large touch targets for touchscreen tills, plain words instead of jargon, one main action per screen
- Clear states: offline badge, low-stock and expiry colours, empty states that say what to do next
- Light and dark modes, readable at arm's length, works on 1366×768 counter screens

### Phase 7: Landing page
Public site at `/` for MuseOne Pharma: features, pricing tiers (shown; payment is handled manually), and a "Request a demo" form
that emails you. Built with awwwards scaled to the brief, and scored with jury before release.

### Phase 8: Market research → v2 backlog
Deep research on competing pharmacy POS products (e.g. Marg ERP, GoFrugal, PharmacyOne, Medeil,
RetailCloud and global players). Output: a feature gap table, each gap rated by value and effort, plus a plan for
the top items. Likely candidates: batch-wise stock (FIFO by expiry), purchase orders and suppliers, GST
invoices, Schedule H/H1 drug register, prescription capture, multi-branch, WhatsApp receipts.

## Out of scope for v1 (listed so they're not forgotten)
- Online payments (Razorpay or Stripe), tenant self-signup, custom domains, subdomains
- Importing old PharmaSpot NeDB data (a script is about one day of work if a PharmaSpot customer needs it)
- Mobile apps, macOS and Linux installers

## Risks
- **Offline + multi-till** is the hardest part. The ledger design is what keeps it safe. Expect Phase 4 to take the longest.
- **Offline login:** a till needs one online login first. Offline it then unlocks with a cached PIN hash. A tenant
  suspended while a till is offline keeps working until that till next syncs.
- **Pharmacy regulation:** drug schedules and GST format depend on the country. Confirm the target market before Phase 8.
