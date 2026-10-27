"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { markRejected, markSynced, outboxCounts, pendingSales, type OutboxRow } from "@/lib/till-store";

export type SyncState = {
  online: boolean;
  pending: number;
  rejected: OutboxRow[];
  problem: "signed-out" | "read-only" | null;
};

const RETRY_MS = 20_000;

// Sends queued bills to the server: now, every 20 s, and as soon as the network comes back.
export function useSync(slug: string) {
  const [state, setState] = useState<SyncState>({ online: true, pending: 0, rejected: [], problem: null });
  const running = useRef(false);

  const refresh = useCallback(async () => {
    const c = await outboxCounts(slug);
    setState((s) => ({ ...s, ...c }));
  }, [slug]);

  const sync = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    try {
      for (;;) {
        const batch = await pendingSales(slug);
        if (!batch.length) break;
        let res: Response;
        try {
          res = await fetch(`/api/t/${slug}/sales`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sales: batch.map((r) => r.sale) }),
            signal: AbortSignal.timeout(15_000),
          });
        } catch {
          setState((s) => ({ ...s, online: false }));
          break;
        }
        if (res.status === 401 || res.status === 402) {
          setState((s) => ({ ...s, online: true, problem: res.status === 401 ? "signed-out" : "read-only" }));
          break;
        }
        if (!res.ok) {
          setState((s) => ({ ...s, online: true }));
          break; // server trouble: keep the bills, retry later
        }
        const { results } = (await res.json()) as { results: { id: string; ok: boolean; error?: string }[] };
        for (const r of results) {
          if (r.ok) await markSynced(r.id);
          else await markRejected(r.id, r.error ?? "Rejected");
        }
        setState((s) => ({ ...s, online: true, problem: null }));
      }
    } finally {
      running.current = false;
      await refresh();
    }
  }, [slug, refresh]);

  useEffect(() => {
    const kick = () => void sync();
    const offline = () => setState((s) => ({ ...s, online: false }));
    kick();
    const timer = setInterval(kick, RETRY_MS);
    window.addEventListener("online", kick);
    window.addEventListener("offline", offline);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", kick);
      window.removeEventListener("offline", offline);
    };
  }, [sync]);

  return { ...state, sync, refresh };
}
