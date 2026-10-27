"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { playScreech } from "@/lib/audio";

const NEAR_PX = 110;
const COOLDOWN_MS = 6000;

/** Chrome gothic wordmark. Links home; screeches like a falcon when the cursor comes close. */
export function Logo({ className = "" }: { className?: string }) {
  const t = useTranslations("header");
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    let last = 0;
    let wasNear = false;
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el || e.pointerType === "touch") return;
      const r = el.getBoundingClientRect();
      const near = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) < NEAR_PX;
      if (near && !wasNear && Date.now() - last > COOLDOWN_MS) {
        last = Date.now();
        playScreech();
      }
      wasNear = near;
    };
    addEventListener("pointermove", onMove);
    return () => removeEventListener("pointermove", onMove);
  }, []);

  return (
    <Link
      ref={ref}
      href="/"
      aria-label={t("home")}
      dir="ltr"
      className={`chrome-text font-gothic leading-none transition-transform duration-300 hover:scale-105 ${className}`}
    >
      Sakr
    </Link>
  );
}
