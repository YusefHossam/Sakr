"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { countdown, SAME_DAY, sameDayStatus } from "@/lib/delivery";

/** "Order before 2 pm, get it today": a live countdown on the product page (Greater Cairo only). */
export function SameDayBadge() {
  const locale = useLocale();
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const s = sameDayStatus("EG", "cairo", new Date());
      setLeft(s.eligible ? s.secondsLeft : 0);
    };
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  if (!left) return null;
  return (
    <p className="flex flex-wrap items-center gap-x-3 border border-ash px-4 py-3 text-xs text-steel" role="status">
      <span className="tracking-[0.2em] text-bone uppercase">{locale === "ar" ? "شحن نفس اليوم" : "Same-day delivery"}</span>
      <span>{locale === "ar" ? "القاهرة والجيزة والقليوبية. اطلب خلال" : "Cairo, Giza and Qalyubia. Order within"}</span>
      <span dir="ltr" className="text-bone">{countdown(left)}</span>
      <span dir="ltr">+{SAME_DAY.fee} EGP</span>
    </p>
  );
}
