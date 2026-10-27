# MuseOne Pharma: Market Research and Feature Gap Report

Research date: 27 Oct 2026. Focus: small retail chemists in Mumbai (1 to 3 counters).

## Method and caveats

- Sources are vendor pages and listing sites (Capterra, Techjockey, SoftwareSuggest, G2, app stores). Links are given inline.
- Most Indian vendors do not publish prices. Many figures come from aggregators or dealers. Treat every price as indicative, before 18% GST, unless marked "official".
- Some official sites could not be fetched. margcompusoft.com failed its TLS check. medeil.io refused the connection. The GoFrugal pharmacy URL returned 404. Feature claims for those vendors come from secondary sources and say so.
- "unverified" means one secondary source or none.

## Regulatory context that shapes features

- **GST 2.0, from 22 Sep 2025:** most medicines went from 12% to 5%. 33 life-saving drugs went from 12% to nil, and 3 more from 5% to nil. Medical devices and supplies (bandages, glucometers, diagnostic kits) went from 18% or 12% to 5%. Sources: [GST Council PIB release](https://gstcouncil.gov.in/sites/default/files/2025-09/press_release_press_information_bureau.pdf), [EY alert](https://www.ey.com/content/dam/ey-unified-site/ey-com/en-in/alerts-hub/2025/09/gst-reduction-on-medicines-and-medical-devices-for-affordable-healthcare.pdf). Impact: chemists need bulk GST rate updates on the product master, plus correct 0% and 5% lines in GST summaries.
- **E-invoicing** is mandatory only above Rs 5 crore aggregate turnover, and only for B2B invoices. A 1 to 3 counter chemist is almost always below that threshold. Many vendors still advertise e-invoice, but it is low value for this segment.
- **Schedule X** drugs need a specific prescription and a separate register. One chemist association code bans Schedule X sales outright (secondary source: [laafon.com](https://laafon.com/schedule-x-drugs-list/)). Many small Mumbai chemists do not stock Schedule X at all.

## Competitor profiles

### 1. Marg ERP 9+ (Marg ERP Ltd, Delhi)

- **Pricing:** Marg sells through dealers and does not publish a list price. Commonly quoted figures, before GST:
  - Basic Rs 8,100 one-time (1 user)
  - Silver Rs 12,600 one-time (up to 3 users)
  - Gold Rs 25,200 one-time (up to 5 users)
  - Annual renewal or AMC about Rs 2,000 to 5,000 per year

  Sources: [itforsme.in](https://itforsme.in/pricing/marg-erp-india), [erpresearch.com](https://www.erpresearch.com/pricing/marg-erp). One IndiaMART dealer lists Silver at Rs 9,999 with a 1-year licence ([IndiaMART](https://m.indiamart.com/impcat/marg-application-software-packages.html)). SoftwareSuggest lists USD 80 / 140 / 280 ([SoftwareSuggest](https://www.softwaresuggest.com/marg-pharmacy-management)).
- **Deployment:** Windows desktop with LAN multi-user and optional cloud backup.
- **Standout features (secondary sources):**
  - Reorder management "on multiple basis"
  - "Push sale and expiry management" to clear near-expiry stock
  - Free drug information through Pharmanxt, with substitute search
  - Restricted-drug records and auto cloud backup

  Source: [softwareconnect MARG listing](https://softwareconnect.com/pharmaceutical-distribution/marg-pharma-software/). Salt-wise inventory is listed for the distribution edition ([SoftwareSuggest](https://www.softwaresuggest.com/marg-pharmaceutical)).
- **Reviews:** Marg is the incumbent most Mumbai chemists already know. Recurring complaints are weak phone-only support and renewal fees above the advertised price. Software Advice rates it 3.2 from 54 reviews ([Software Advice](https://www.softwareadvice.com/business-management/marg-erp-9-plus-profile/), [Trustpilot](https://at.trustpilot.com/review/margcompusoft.com)).

### 2. GoFrugal (RetailEasy / pharmacy POS)

- **Pricing:** no official INR price found. Capterra lists cloud retail at USD 30 per register per month, or USD 300 per year ([Capterra.in](https://www.capterra.in/software/71693/gofrugal-pos-software)). A blog cites "from Rs 8,999 per year" (unverified, [codingclave](https://codingclave.com/blog/pharmacy-management-software-india)).
- **Deployment:** on-premise POS ERP that works without internet, plus cloud add-ons (GoAlerts, mobile apps).
- **Standout features (official page, [gofrugal.com chemist-pos](https://gofrugal.com/retail/pharmacy-software/chemist-pos.html)):**
  - Generic name and substitute info, through an integrated drug index ([GoFrugal blog](https://www.gofrugal.com/blog/pharmacy-solution-highlights))
  - Automatic purchase orders from live stock, with reorder alerts
  - Supplier-wise and manufacturer-wise expiry reports
  - Loyalty, CRM and customer segments (chronic, walk-in, regular)
  - Online ordering app with prescription upload
  - GoBill mobile POS
  - Scheduled drug register
  - Supplier-item mapping for ordering
  - Blocking of short-expiry stock at inward and at sale
  - Dynamic QR codes mapped into the sales print design ([GoFrugal KB](https://community.gofrugal.com/portal/en/kb/articles/creating-and-mapping-dynamic-qr-codes-in-sales-print-design))

### 3. Medeil (Vanuston Intelligence, Chennai)

- **Pricing:** Capterra lists from USD 90.50 per user per year ([Capterra](https://www.capterra.com/p/117249/Medeil/)). IndiaMART listings are about Rs 5,500 to 6,500 per licence (unverified). The Professional edition is listed at USD 425 per year on one review site (unverified).
- **Deployment:** Windows client-server (reviewers say server-client only). A separate "Medeil Cloud POS" SaaS exists.
- **Standout features:** preloaded drug database of 100,000 to 125,000 products with therapeutic and indication data, expiry and banned-drug alerts, reorder, and wholesaler integration ([Capterra.in](https://www.capterra.in/software/117249/medeil), [GetApp.ca](https://www.getapp.ca/software/2051507/medeil)). No source confirmed a generic substitution feature.

### 4. BUSY (pharmacy use of BUSY accounting)

- **Pricing:** Capterra lists 2026 subscriptions as Blue Rs 4,999, Saffron Rs 6,999 and Emerald Rs 9,999, single user per year ([Capterra.in](https://www.capterra.in/software/71449/busy-accounting-software)). ERPResearch quotes perpetual Basic about Rs 9,999 and Standard about Rs 14,999 ([erpresearch](https://www.erpresearch.com/pricing/busy-accounting)). The official page lists plans Start, Smart, Power and Power+ without amounts.
- **Deployment:** Windows desktop, BUSY on Cloud (remote desktop), mobile app, and Google Drive backup.
- **Standout features (official page, [busy.in/accounting-software/pharmacy](https://busy.in/accounting-software/pharmacy)):**
  - Search by salt or chemical name
  - Block sale of expired batches
  - Customer credit limits and outstanding dues
  - Supplier payables and automatic payment reminders
  - Reorder-level alerts
  - Free WhatsApp invoice sharing
  - GSTR-1 dashboard with view, file and reconcile, plus supplier GSTR-1 and 3B filing-status checks
  - E-invoice and e-way bill
  - Multi-branch stock transfer
  - Commission calculation (salesman, [busy.in](https://busy.in/pharmacy-billing-software))

Note: "PharmaSoft" as a separate product was not found as a distinct current brand. BUSY is covered instead.

### 5. Vyapar (generic GST billing, used by chemists)

- **Pricing (official page, [vyaparapp pharmacy](https://api1.vyaparapp.in/free/billing-software-for-retail-shop/pharmacy)):** desktop plans, billed annually, plus 18% GST:
  - Silver Rs 0
  - Gold Rs 308 per month (about Rs 3,700 per year)
  - Retail Pro Rs 308 per month
  - Platinum Rs 833 per month (about Rs 10,000 per year)

  Techjockey lists Silver at Rs 699 per year ([Techjockey](https://www.techjockey.com/detail/vyapar)). Mobile plan prices on the page are unclear.
- **Deployment:** Windows desktop and Android, with multi-device sync. Offline-first.
- **Standout features:**
  - Batch and expiry on the bill
  - GSTR reports on all plans
  - E-invoice, e-way bill and WhatsApp on Gold and above
  - OCR for purchase bills on Retail Pro
  - Tally import and export, plus online store, on Platinum
  - Loyalty points and credit limits on mobile Retail Pro
  - Offline UPI QR printed on the invoice for the exact amount ([Vyapar guide](https://vyaparapp.in/guides/how-to-set-up-bank-details-and-payment-integration-in-vyapar))
  - Doctor-wise prescription tracking, and H/H1 prompts for doctor details ([Vyapar chemist page](https://vyaparapp.in/free/billing-software-for-retail-shop/chemist-store))

### 6. SwilERP (Softworld India)

- **Pricing:** G2 lists "Basic Edition" from Rs 9,000 per single user per year ([G2](https://g2.com/products/swilerp-software/pricing)). Techjockey says price on request ([Techjockey](https://www.techjockey.com/detail/swilerp-software)).
- **Deployment:** Windows (.NET) and web/cloud versions.
- **Standout features:** returns with credit and debit notes, multi-store, lot and expiry tracking, GST and e-invoice. A 2022 review headline reads "Not a simple platform".

### 7. eMedStore (Ahmedabad)

- **Pricing:** price on request ([Techjockey](https://www.techjockey.com/detail/emedstore)).
- **Deployment / focus:** online pharmacy and store-website software for selling medicines online. No detailed retail POS feature list found (unverified).

### 8. eVitalRx (newer cloud player, strongest direct comparable)

- **Pricing (official, [evitalrx.in/pricing](https://evitalrx.in/pricing), undated):** per year:
  - Capsule Rs 7,500 (6 staff logins)
  - Injection Rs 15,000 (10 staff logins)
  - Vaccine Rs 30,000 (30 staff logins)
  - Steroid Rs 50,000 (coming soon)

  Add-ons:
  - WhatsApp integration Rs 25,000 one-time
  - Loyalty Rs 5,000 per year per store
  - E-invoice Rs 5,000 setup, plus a per-document charge
  - SahaAI (auto purchase order and distributor selection) Rs 6,000 per year
  - White-label app Rs 1.5 lakh
- **Deployment:** cloud, on web and mobile.
- **Standout features ([evitalrx.in](https://evitalrx.in/)):**
  - Catalogue of 15,000+ medicines, searchable by ingredient
  - Alternatives search
  - Refill and pill reminders through the CRM
  - Patient ordering app
  - Auto purchase orders
  - Places distributor orders directly and works alongside Marg, positioned as replacing Pharmarack/Retailio ordering ([App Store](https://apps.apple.com/app/id1637429769))

### 9. LocalWell (newer cloud player)

- **Pricing:** from Rs 249 per month (about Rs 3,000 per year), per Capterra search snippet ([Capterra](https://www.capterra.com/p/253020/localwell/)). The page itself returned 403, so this is unverified.
- **Deployment:** cloud, on Android and web.
- **Positioning:** offers billing, inventory and CRM. It markets itself against Marg, Pharmarack and Retailio ([APKCombo listing](https://apkcombo.com/pharmacy-medical-store-billing/com.localwell/)).

### 10. Pharmarack and Retailio (B2B ordering, not billing)

- **Pharmarack:** free retailer app. It links pharmacy desktop billing software to distributors. Orders placed in the app become bills in the distributor's software ([App Store](https://apps.apple.com/us/app/-/id987487572)).
- **Retailio:** retailer app that orders from mapped and unmapped distributors, compares schemes across suppliers, and matches purchase orders against invoices. It settles distributor invoices by UPI or net banking. It has offered credit through Rupifi and Indifi (2021 to 2022 news) ([App Store](https://apps.apple.com/app/id1245047831), [BioSpectrum](https://biospectrumindia.com/news/86/19570/rupifi-partners-with-retailio-to-enable-credit-for-pharma-retailers.html)).
- **Relevance:** chemists already use these apps for purchasing. MuseOne does not need to rebuild ordering. It needs to bring the resulting purchase bill in quickly (import or OCR).

### Other Indian players seen

- **LOGIC ERP:** prescription upload and dosage validation ([logicerp.com](https://www.logicerp.com/solutions/pharma-software)).
- **Pharmacy108:** doctor-wise and salesman-wise sales reports, and prescription-to-bill ([Techjockey](https://www.techjockey.com/detail/pharmacy108)).
- **PharmaTrader:** cloud product at Rs 5,000 per year ([Capterra](https://www.capterra.com/p/173577/PharmaTrader/)).
- **"Unisoft":** no current pharmacy product found under that name.

### Global references (only ideas that transfer)

- **PioneerRx (US):** delivery driver app that takes payment in the field and syncs to the POS. Also RxLocal patient app and mobile inventory counting ([App Store](https://apps.apple.com/us/app/-/id6443722462), [softwareconnect](https://softwareconnect.com/pharmacy/pioneerrx/)). Transfers as: home-delivery order with collect-on-delivery and a phone-based stock count.
- **Liberty Software (US):** automatic text and email refill reminders, "ready for pickup" and delivery alerts, and automatic vendor reordering ([GetApp](https://www.getapp.com/pharmacy-software/a/liberty-software)). Transfers as: WhatsApp refill reminders for chronic patients and an auto reorder list.
- US claims and insurance workflows do not transfer to Indian retail.

## Price landscape summary (per year, before GST, one store)

| Product | Model | Entry | Typical small chemist |
|---|---|---|---|
| Vyapar | SaaS desktop/mobile | Rs 0 | Rs 3,700 (Gold) to Rs 10,000 (Platinum) |
| LocalWell | Cloud | Rs 3,000 (unverified) | n/a |
| BUSY | Subscription or perpetual | Rs 4,999 | Rs 6,999 |
| PharmaTrader | Cloud | Rs 5,000 | Rs 5,000 |
| Medeil | Desktop | about Rs 5,500 (unverified) | n/a |
| eVitalRx | Cloud | Rs 7,500 | Rs 7,500 to 15,000, plus add-ons |
| Marg ERP 9+ | One-time + AMC | Rs 8,100 + about Rs 3,000/yr | Rs 12,600 Silver + AMC |
| SwilERP | Licence | Rs 9,000 | n/a |
| GoFrugal | SaaS | Rs 8,999 (unverified) | USD 300 per register (Capterra) |

## Gap table

Effort assumes the existing Next.js and MySQL codebase. S is under 3 days, M is 1 to 2 weeks, L is 3 weeks or more, or needs an outside party.

| # | Feature | Competitors with it (evidence) | Why it matters to a Mumbai chemist | Value | Effort | Implementation sketch |
|---|---|---|---|---|---|---|
| 1 | Supplier master, purchase bill (invoice no., date, supplier GSTIN, free qty, scheme/discount, input GST) and supplier ledger/payables | BUSY (supplier payables), SwilERP (credit/debit notes), Marg, Vyapar | Chemists buy daily from 3 to 10 distributors on 15 to 30 day credit. Without payables they keep a second book. Input GST is needed for 3B. | High | M | Add `suppliers`, `purchase_bills`, `supplier_payments` tables. Turn the existing stock-in into lines under a purchase bill. Ledger = bills minus payments. |
| 2 | Purchase return / expiry return to supplier (debit note) | SwilERP (credit/debit notes), GoFrugal (supplier-wise expiry report), Marg (expiry management) | Distributors take back expired and near-expiry stock for credit. This is real money every month. MuseOne only writes it off today. | High | M | Add a "return to supplier" document that picks batches (expired or near-expiry), reduces stock, posts a debit note to the supplier ledger, and prints it. Add an expiry report grouped by supplier. |
| 3 | Customer credit ledger (khata) with payment collection and reminders | BUSY (credit limits, dues, automatic reminders), Vyapar (credit limits, mobile Retail Pro) | Neighbourhood chemists run monthly accounts for regular families and housing societies. MuseOne records credit sales but has no ledger, collection or reminder. | High | S-M | Derive the balance from credit sales minus receipts. Add a receipt entry screen, a statement print, a credit limit check at billing, and a WhatsApp reminder link (see #4). |
| 4 | WhatsApp bill and reminder sending | BUSY (free WhatsApp invoice), Vyapar (Gold+), eVitalRx (paid add-on Rs 25,000) | Customers expect bills on WhatsApp. It saves paper and gives a reorder channel. | High | S | Phase 1: render the bill as a PDF or public link with a signed token, then open a `wa.me/<phone>?text=` link. No API cost. Phase 2: WhatsApp Business API via a BSP for automatic sends. |
| 5 | GSTR-1 / GSTR-3B ready export | BUSY (GSTR-1 dashboard, 3B reconciliation), Vyapar (GSTR reports on all plans) | The chemist's CA files monthly or quarterly. A GSTR-1 B2C summary by rate (0/5/18%), an HSN summary, and 3B input/output tax cut the CA fee and errors. | High | M | Extend the planned GST summary with a B2CS rate-wise table, a B2B invoice list (customer GSTIN), an HSN summary and a document summary. Export to CSV/Excel in the GST offline tool layout. 3B needs purchase input tax (#1). |
| 6 | Salt / composition on product and substitute suggestions | GoFrugal (drug index, generic substitutes), BUSY (salt search), Marg (Pharmanxt substitutes), eVitalRx (alternatives), Medeil (drug DB) | Saves the sale when a brand is out of stock. Generic substitution also earns higher margin. Counter staff search by salt daily. | High | M | Add `composition` text (normalized salt + strength) to products. Search by salt. On an out-of-stock or search hit, list in-stock products with the same composition, sorted by margin. |
| 7 | Drug master database (preloaded products with salt, HSN, GST, manufacturer, pack) | Medeil (100k+), eVitalRx (15k+), GoFrugal (drug index), Marg (Pharmanxt) | Onboarding is the biggest churn point. Typing 2,000 to 5,000 SKUs by hand kills adoption. | High | L | License or build a shared master table (global, not per tenant). Add "add from master" when creating a product. The data source is the hard part: licence a feed or seed it from public CDSCO/NPPA lists. Licensing is unverified. |
| 8 | Reorder suggestions / auto purchase order | GoFrugal (automatic PO), Marg (reorder management), BUSY (reorder alerts), eVitalRx (SahaAI auto PO), Liberty | Converts low-stock alerts into a shortlist to send to a distributor or to Pharmarack/Retailio. | Med-High | S-M | Suggested qty = (avg daily sales over N days x cover days) minus stock. Group by last supplier. Export or share on WhatsApp as a text order. |
| 9 | Purchase bill import (CSV / distributor file / OCR) | Vyapar (OCR for purchase bills, Retail Pro), eVitalRx/Marg ecosystem (distributor ordering) | Entering 50-line distributor invoices by hand takes an hour a day. Distributors mostly bill from Marg and can share a CSV. | High | M (CSV), L (OCR) | Start with CSV import that maps columns (item, batch, expiry, qty, free, rate, MRP, GST) with fuzzy product matching. OCR comes later via a cloud document AI. |
| 10 | UPI QR printed on bill (amount-specific) | Vyapar (offline UPI QR on invoice), GoFrugal (dynamic QR in print design) | Customers pay by UPI at almost every Mumbai counter. A QR with the exact amount stops wrong-amount payments and speeds checkout. | Med | S | Build `upi://pay?pa=<vpa>&pn=<name>&am=<total>&tn=<billno>` and render it as a QR on the 80mm print (client-side QR lib). Store the VPA in settings. |
| 11 | Loyalty points | Vyapar (mobile Retail Pro), GoFrugal (loyalty/CRM), eVitalRx (Rs 5,000/yr add-on) | Competes with chain stores (Wellness Forever, MedPlus, Apollo) and e-pharmacy discounts common in Mumbai. | Med | S-M | Earn X points per Rs 100 on bills and redeem them as a bill discount. Keep a points ledger table per customer. |
| 12 | Refill reminders for chronic patients | eVitalRx (refill/pill reminders), Liberty (refill texts), GoFrugal (chronic segment) | Diabetic, BP and thyroid patients make up a large share of repeat revenue. A reminder keeps them from switching to online pharmacies. | Med-High | S-M | Mark a customer's item as recurring with a days-supply value. A daily job lists due refills. Send through a WhatsApp link (#4). |
| 13 | Doctor master + doctor-wise sales report | Pharmacy108 (doctor-wise report), Vyapar (doctor-wise prescription tracking) | Chemists near clinics track which doctor's prescriptions drive sales and stock. Doctor commission exists, but no product was found that clearly offers a doctor-commission module (unverified), and the practice is ethically and legally sensitive. | Med | S | MuseOne already captures the doctor for H1. Make the doctor a master record, optional on any bill, and add a doctor-wise sales report. Skip commission. |
| 14 | Prescription image upload on bill | LOGIC ERP (prescription upload), GoFrugal (upload when ordering) | Evidence for H/H1 sales during FDA inspections, plus repeat dispensing. | Med | S | Attach a phone camera or file upload to the bill. Store in object storage. Link from the H1 register. |
| 15 | Home delivery / phone-WhatsApp orders | GoFrugal (online ordering app), eVitalRx (patient ordering app), Vyapar Platinum (online store), PioneerRx (delivery app) | Mumbai chemists deliver within the building or society on phone orders. Today these are tracked on paper. | Med | M | Add an order status (received, packed, out for delivery, delivered/paid) on top of held bills, with a delivery boy and COD collection. A customer app is not needed for v2. |
| 16 | Multi-branch stock transfer + consolidated reports | BUSY (stock transfers, branch-wise reports), GoFrugal (central master), SwilERP (multi-store) | Applies only to owners with 2 or 3 shops, a minority of the target segment. | Low-Med | M | Group tenants under one owner account. A transfer document moves batches out of one tenant's ledger and into another's. |
| 17 | Tally export | Vyapar Platinum (Tally import/export) | Many CAs in Mumbai still use Tally. | Med | M | Export sales, purchase and receipt vouchers as Tally XML (or Excel for TallyPrime import), mapped by GST rate ledgers. |
| 18 | E-invoice / e-way bill | BUSY, Vyapar Gold+, SwilERP, eVitalRx (paid) | Mandatory only above Rs 5 crore turnover for B2B. Rarely needed by a small retailer. | Low | L | Defer. If needed, integrate a GSP API (IRN + QR) for B2B bills only. |
| 19 | Schedule X / narcotic register | GoFrugal ("scheduled drug register"), Marg ("restricted drug records"). No source specifically confirmed a Schedule X register (unverified). | MuseOne already flags X. Few small chemists stock X. Those that do need a separate register with prescription retention. | Low-Med | S | Reuse the H1 register with an X filter, mandatory prescription upload (#14) and a quantity balance per X product. |
| 20 | Bulk GST rate / price update | Implied by GST 2.0 (Sep 2025). Vyapar has "bulk item updates" (mobile Silver). | The rate cut forced every chemist to edit hundreds of SKUs. Future changes will again. | Med | S | Bulk edit by category, HSN or filter: set the GST rate and MRP. Log changes in an audit trail. |
| 21 | Expired-sale blocking and short-expiry block at inward | BUSY (restrict sale of expired batches), GoFrugal (block short expiry at inward/sale) | Prevents an illegal sale and stops the chemist accepting short-dated stock from a distributor. | Med | S | Check at billing whether FEFO already skips expired stock. If not, add a hard block. Warn at stock-in if expiry is under N days. |

Items checked but not included as gaps: doctor commission (no direct vendor evidence; ethically sensitive), and direct Pharmarack/Retailio API integration (no public API found; these apps link to distributor software, not retailer POS).

## Top 10 for v2 (ranked by value/effort)

1. **Customer credit ledger (khata) + collections + reminder** (High, S-M). The daily reality of a neighbourhood chemist, cheap to build on existing credit sales.
2. **WhatsApp bill and reminder via wa.me link** (High, S). Zero running cost. Matches BUSY's free feature. eVitalRx charges Rs 25,000 for it.
3. **UPI QR with exact amount on the 80mm bill** (Med, S). Trivial to build and visible every day.
4. **Supplier master + purchase bills + supplier ledger** (High, M). Foundation for #5, #6 and GSTR-3B.
5. **Expiry / purchase return to supplier (debit note)** (High, M). Recovers money MuseOne currently writes off.
6. **Salt/composition field + substitute suggestions** (High, M). Saves lost sales. Every serious competitor has it.
7. **GSTR-1 (B2CS, HSN, docs) + GSTR-3B summary export** (High, M). Extends the planned GST summary. Needed by every chemist's CA.
8. **Reorder suggestion list, shareable to distributors** (Med-High, S-M). Builds on existing low-stock alerts.
9. **Purchase bill CSV import with product matching** (High, M). Biggest daily time saver after billing.
10. **Bulk GST/price update + refill reminders for chronic customers** (Med, S each). Small builds with clear value; refill reminders reuse the WhatsApp link.

Next after the top 10: drug master database (High value, L effort; start sourcing data now), prescription image upload, doctor-wise report, loyalty, home delivery orders, Tally export.

## Pricing guidance for MuseOne in Mumbai

- **Market anchors:**
  - Vyapar costs Rs 0 to 3,700 per year, but is generic and not pharmacy-native.
  - Marg is about Rs 12,600 one-time plus about Rs 3,000 per year renewal, and is what most chemists already own.
  - eVitalRx, the closest cloud pharmacy comparable, starts at Rs 7,500 per year, with paid add-ons for WhatsApp, loyalty and e-invoice.
  - BUSY costs Rs 5,000 to 7,000 per year.
- **Recommended launch band: Rs 4,999 to 6,999 per store per year, plus GST.** Suggested shape:
  - **Starter, Rs 4,999/yr:** 1 counter, 2 staff, all of v1 plus WhatsApp-link bills and UPI QR.
  - **Standard, Rs 7,499/yr:** up to 3 counters, unlimited staff, with credit ledger, supplier ledger and returns, GSTR export, and reorder.
  - Optional monthly price of Rs 499 to 699 for chemists who will not prepay.
- **Rationale:**
  - Undercut eVitalRx's Rs 7,500 entry and bundle what it sells as add-ons (WhatsApp, loyalty).
  - Stay above Vyapar to signal a pharmacy-specific product.
  - Over 3 years, Starter (about Rs 15,000) is comparable to Marg Silver plus AMC (about Rs 18,600), with no upfront hit and no AMC surprise. Renewal fees are a documented Marg complaint.
  - Offer a free data migration from Marg (item master and stock CSV) as the main switching lever, plus a 30-day free trial.
- **Caveat:** Marg and GoFrugal prices are dealer-quoted and not official. Validate with 5 to 10 Mumbai chemists before fixing the price.
