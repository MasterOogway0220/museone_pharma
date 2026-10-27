"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { fieldErrors, leadSchema } from "@/lib/validation";

export type LeadState = { errors?: Record<string, string> };

// shortcut: in-memory limit per server process; move to Redis or the DB if we run several instances.
const hits = new Map<string, number[]>();
const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

function limited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > LIMIT;
}

export async function requestDemo(_: LeadState, form: FormData): Promise<LeadState> {
  const parsed = leadSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    // Bots fill the hidden field: pretend success, store nothing.
    if (parsed.error.issues.some((i) => i.path[0] === "website")) redirect("/thank-you");
    return { errors: fieldErrors(parsed.error) };
  }
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (limited(ip)) return { errors: { form: "Too many requests. Please call or try again in an hour." } };

  const { name, pharmacy, phone, area, counters, message } = parsed.data;
  await db.insert(schema.leads).values({ name, pharmacy, phone, area, counters, message });
  redirect("/thank-you");
}
