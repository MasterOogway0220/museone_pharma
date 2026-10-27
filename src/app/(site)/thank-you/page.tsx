import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Thank you", description: "Your MuseOne Pharma demo request has reached us.", robots: { index: false } };

export default function ThankYou() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-24">
      <h1 className="text-4xl font-semibold tracking-[-0.02em]">Thank you. We&apos;ll call you.</h1>
      <p className="mt-6 text-lg text-muted">
        Your request has reached us. Expect a call within one working day to fix a time for the demo. Keep a few of your fast-moving medicines handy;
        we&apos;ll bill them together.
      </p>
      <Link href="/" className="link-quiet mt-8 inline-block text-base">
        Back to the home page
      </Link>
    </section>
  );
}
