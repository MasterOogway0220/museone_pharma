// Public site content. Items marked `confirm` are assumptions the owner must check before launch.

export const site = {
  name: "MuseOne Pharma",
  // confirm: production domain
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  description:
    "Billing, stock and expiry tracking for chemists in Mumbai. GST bills with batch and expiry, Schedule H1 register, and billing that keeps working when the internet drops.",
  // confirm: real business contact address (FRONTEND-RULES requires one in the footer)
  contactAddress: null as string | null,
};

// confirm: prices from docs/MARKET-RESEARCH.md recommendation, before GST.
export const plans = [
  {
    name: "Starter",
    price: "₹4,999",
    period: "per shop, per year",
    for: "One counter",
    includes: [
      "Billing with GST, batch and expiry on every bill",
      "Stock by batch, expiry and low-stock alerts",
      "Schedule H1 register and CSV exports",
      "Works offline, syncs when back online",
    ],
  },
  {
    name: "Standard",
    price: "₹7,499",
    period: "per shop, per year",
    for: "Up to three counters",
    includes: [
      "Everything in Starter",
      "Staff logins with their own permissions",
      "Reports by cashier, till and payment method",
      "Desktop app for each counter with silent printing",
    ],
  },
];
