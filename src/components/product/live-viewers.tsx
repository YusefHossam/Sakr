"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const SHOW_FROM = 3; // a lonely "1 person viewing" looks worse than nothing (BR-16)
const BEAT_MS = 20_000;

function viewerId(): string {
  try {
    let id = sessionStorage.getItem("sakr-viewer");
    if (!id) sessionStorage.setItem("sakr-viewer", (id = crypto.randomUUID()));
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/** Real-time count of people on this product page (heartbeats to /api/viewers). */
export function LiveViewers({ slug }: { slug: string }) {
  const t = useTranslations("product");
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = viewerId();
    let alive = true;
    const beat = () =>
      fetch("/api/viewers", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, id }) })
        .then((r) => r.json())
        .then((d: { count?: number }) => alive && setCount(d.count ?? 0))
        .catch(() => {});
    void beat();
    const timer = setInterval(beat, BEAT_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [slug]);

  if (count < SHOW_FROM) return null;
  return (
    <p className="flex items-center gap-2 text-xs text-steel" role="status">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-blood opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-blood" />
      </span>
      {t("viewing", { count })}
    </p>
  );
}
