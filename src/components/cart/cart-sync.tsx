"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { addToCart } from "@/lib/actions/cart";
import { flush, readQueue } from "@/lib/offline-cart";

/** Sends cart additions made offline once the connection is back, and tells the customer. */
export function CartSync() {
  const ar = useLocale() === "ar";
  const router = useRouter();
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let busy = false;
    const sync = async () => {
      if (busy || !navigator.onLine || !readQueue().length) return;
      busy = true;
      try {
        let added = 0;
        await flush(async (line) => {
          try {
            const res = await addToCart(line);
            // Stock or invalid answers are final (dropped); a missing login or a network failure keeps the line queued.
            if (res.ok) added++;
            return res.ok || res.error !== "login" ? "done" : "retry";
          } catch {
            return "retry";
          }
        });
        if (added) {
          setNote(ar ? `اتضاف ${added} من القطع اللي اخترتها وإنت أوفلاين.` : `${added} item(s) you added offline are now in your cart.`);
          router.refresh();
          setTimeout(() => setNote(null), 6000);
        }
      } finally {
        busy = false;
      }
    };
    const first = setTimeout(sync, 1500);
    window.addEventListener("online", sync);
    return () => {
      clearTimeout(first);
      window.removeEventListener("online", sync);
    };
  }, [ar, router]);

  if (!note) return null;
  return (
    <p className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-md border border-bone/50 bg-ink p-3 text-center text-sm text-bone" role="status">{note}</p>
  );
}
