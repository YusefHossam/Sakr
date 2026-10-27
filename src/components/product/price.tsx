"use client";

import { useTranslations } from "next-intl";
import { useRegion } from "@/components/providers/region-provider";

/** Price in the visitor's currency, the EGP original under it, and the struck price when on sale. */
export function Price({ price, salePrice, size = "md" }: { price: number; salePrice?: number | null; size?: "md" | "lg" }) {
  const t = useTranslations("common");
  const { region, format, formatEgp } = useRegion();
  const shown = salePrice ?? price;
  const main = size === "lg" ? "text-2xl" : "text-sm";

  return (
    <div className="flex flex-col gap-0.5" dir="ltr">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className={`${main} font-semibold ${salePrice ? "text-blood" : "text-bone"}`}>{format(shown)}</span>
        {salePrice != null && <s className="text-xs text-dust">{format(price)}</s>}
      </div>
      {region.currency !== "EGP" && <span className="text-[11px] text-dust">{t("approxEgp", { price: formatEgp(shown) })}</span>}
    </div>
  );
}
