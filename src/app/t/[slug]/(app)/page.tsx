import type { Metadata } from "next";
import { Till } from "./till/till";

export const metadata: Metadata = { title: "Sell", robots: { index: false } };

// The layout already checked the session; the till loads its data from /api/t/[slug]/pos
// so it can keep billing from a saved copy when offline.
export default async function SellPage({ params }: PageProps<"/t/[slug]">) {
  const { slug } = await params;
  return <Till slug={slug} />;
}
