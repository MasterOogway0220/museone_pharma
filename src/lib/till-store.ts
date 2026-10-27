"use client";

import Dexie, { type EntityTable } from "dexie";
import type { SaleInput } from "@/lib/validation";

// The till's local store (IndexedDB). Survives reloads, crashes and offline periods.

export type OutboxRow = {
  id: string; // sale id
  slug: string;
  sale: SaleInput;
  status: "pending" | "rejected";
  error?: string;
  createdAt: number;
};

type CacheRow = { slug: string; data: unknown; savedAt: number };
type MetaRow = { key: string; value: string | number };

const store = new Dexie("museone-till") as Dexie & {
  outbox: EntityTable<OutboxRow, "id">;
  cache: EntityTable<CacheRow, "slug">;
  meta: EntityTable<MetaRow, "key">;
};
store.version(1).stores({ outbox: "id, slug, status", cache: "slug", meta: "key" });

export async function queueSale(slug: string, sale: SaleInput) {
  await store.outbox.put({ id: sale.id, slug, sale, status: "pending", createdAt: Date.now() });
}

export function pendingSales(slug: string, limit = 50) {
  return store.outbox.where({ slug, status: "pending" }).limit(limit).sortBy("createdAt");
}

export function outboxCounts(slug: string) {
  return Promise.all([
    store.outbox.where({ slug, status: "pending" }).count(),
    store.outbox.where({ slug, status: "rejected" }).toArray(),
  ]).then(([pending, rejected]) => ({ pending, rejected }));
}

export const markSynced = (id: string) => store.outbox.delete(id);
export const markRejected = (id: string, error: string) => store.outbox.update(id, { status: "rejected", error });
export const dismissRejected = (id: string) => store.outbox.delete(id);

export async function saveCatalog(slug: string, data: unknown) {
  await store.cache.put({ slug, data, savedAt: Date.now() });
}

export async function loadCatalog<T>(slug: string) {
  const row = await store.cache.get(slug);
  return row ? { data: row.data as T, savedAt: row.savedAt } : null;
}

export async function getTill(slug: string) {
  return (await store.meta.get(`till:${slug}`))?.value as string | undefined;
}

export async function setTill(slug: string, code: string) {
  await store.meta.put({ key: `till:${slug}`, value: code });
}

// Next invoice number for this device. In a transaction so two tabs never get the same number.
export function nextInvoiceNo(slug: string, till: string) {
  return store.transaction("rw", store.meta, async () => {
    const key = `seq:${slug}:${till}`;
    const n = (((await store.meta.get(key))?.value as number | undefined) ?? 0) + 1;
    await store.meta.put({ key, value: n });
    return `${till}-${String(n).padStart(5, "0")}`;
  });
}
