import type { Metadata } from "next";
import { Legal } from "@/components/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms for using the MuseOne Pharma billing service.",
  alternates: { canonical: "/terms" },
};

// confirm: draft for review by a lawyer before launch.
export default function Terms() {
  return (
    <Legal title="Terms of Service" updated="27 October 2026">
      <p>These terms apply to pharmacies that use MuseOne Pharma (&quot;the service&quot;) and to their staff.</p>

      <h2>Your account</h2>
      <ul>
        <li>We create your pharmacy&apos;s account and its owner login. The owner manages staff logins and is responsible for what staff do.</li>
        <li>Keep passwords private. Tell us at once if you think a login has been misused.</li>
      </ul>

      <h2>Subscription and payment</h2>
      <ul>
        <li>The service is paid yearly or as agreed in writing. Prices on the website are before GST.</li>
        <li>
          If a payment is late, the service becomes read-only for 7 days: you can view and export records but not bill. After that, access pauses
          until payment. Your data is not deleted during this time.
        </li>
      </ul>

      <h2>Your responsibilities</h2>
      <ul>
        <li>
          You are responsible for the correctness of prices, MRP, GST rates, HSN codes and drug schedules you enter, and for following the Drugs and
          Cosmetics Act, GST law and other rules that apply to your pharmacy.
        </li>
        <li>The service helps you keep records such as the Schedule H1 register; keeping them as the law requires stays your duty.</li>
      </ul>

      <h2>Your data</h2>
      <p>
        Records you enter belong to your pharmacy. You can export them at any time. After the subscription ends, we keep them for 90 days so you can
        export them, then delete them. See the Privacy Policy for details.
      </p>

      <h2>Offline billing</h2>
      <p>
        Bills made while offline are stored on the counter computer until it reconnects. Do not clear the browser data or uninstall the app while bills
        are waiting to sync; the screen shows how many are waiting.
      </p>

      <h2>Availability and liability</h2>
      <p>
        We work to keep the service available and your data safe, but we cannot promise it will never be interrupted. To the extent the law allows,
        our total liability is limited to the fees you paid in the 12 months before the claim.
      </p>

      <h2>Changes and ending the service</h2>
      <p>
        We may update these terms; we will tell owners of active pharmacies before changes take effect. You can stop using the service at any time.
        These terms are governed by the laws of India, and courts in Mumbai have jurisdiction.
      </p>
    </Legal>
  );
}
