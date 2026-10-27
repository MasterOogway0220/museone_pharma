import type { Metadata } from "next";
import { Legal } from "@/components/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What data MuseOne Pharma collects, why, how long it is kept and how to reach us about it.",
  alternates: { canonical: "/privacy" },
};

// confirm: draft for review by a lawyer before launch (Digital Personal Data Protection Act, 2023).
export default function Privacy() {
  return (
    <Legal title="Privacy Policy" updated="27 October 2026">
      <p>
        This policy explains how MuseOne Pharma (&quot;we&quot;) handles personal data on this website and in the MuseOne Pharma billing service.
      </p>

      <h2>Data we collect</h2>
      <ul>
        <li>Demo requests: your name, mobile number, pharmacy name, area, number of counters and any message you write.</li>
        <li>Accounts: names and usernames of pharmacy owners and staff, and a protected (hashed) form of their passwords.</li>
        <li>
          Pharmacy records entered by a pharmacy: products, stock, bills, and customer details the pharmacy chooses to record, such as name and mobile
          number. For Schedule H1 and X medicines, the doctor&apos;s and patient&apos;s names, as the Drugs and Cosmetics Rules require.
        </li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To call you back about a demo you asked for.</li>
        <li>To run the billing service for the pharmacy that subscribed: sign-in, bills, stock, reports and exports.</li>
        <li>To keep the service secure, for example by limiting repeated sign-in attempts.</li>
      </ul>
      <p>We do not sell personal data, and we do not use it for advertising.</p>

      <h2>Who decides about pharmacy records</h2>
      <p>
        Each pharmacy decides what customer and patient details it records, and is responsible for having a valid reason to do so. We process those
        records only on the pharmacy&apos;s behalf. Each pharmacy&apos;s data is kept separate and cannot be seen by other pharmacies.
      </p>

      <h2>Cookies</h2>
      <p>
        We set only the cookies needed to keep you signed in. The public website sets no tracking or advertising cookies, so there is nothing to
        accept or decline.
      </p>

      <h2>How long we keep it</h2>
      <ul>
        <li>Demo requests: up to 12 months, unless you become a customer.</li>
        <li>Pharmacy records: while the pharmacy&apos;s subscription is active, and for 90 days after it ends so the pharmacy can export them.</li>
        <li>Bills may need to be kept longer by the pharmacy under GST law; the pharmacy can export them at any time.</li>
      </ul>

      <h2>Your rights</h2>
      <p>
        You can ask to see, correct or delete personal data we hold about you, or withdraw consent you gave. If your data was recorded by a
        pharmacy, contact that pharmacy first; we will help them act on your request.
      </p>

      <h2>Contact and grievances</h2>
      <p>Write to us through the demo form on the home page and mark it &quot;Privacy&quot;. We reply within 30 days.</p>
    </Legal>
  );
}
