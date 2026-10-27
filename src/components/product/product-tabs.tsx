"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { sizeChartFor, washingKey } from "@/lib/size-charts";
import type { Category } from "@/models/product";

const TABS = ["tabSizeChart", "tabDetails", "tabWashing", "tabDelivery"] as const;

export function ProductTabs({ category, description }: { category: Category; description: string }) {
  const t = useTranslations("product");
  const [tab, setTab] = useState<(typeof TABS)[number]>("tabDetails");
  const chart = sizeChartFor(category);
  const tabs = TABS.filter((k) => k !== "tabSizeChart" || chart);

  return (
    <div className="border-t border-ash">
      <div role="tablist" className="flex overflow-x-auto border-b border-ash">
        {tabs.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            id={`tab-${k}`}
            aria-selected={tab === k}
            aria-controls={`panel-${k}`}
            onClick={() => setTab(k)}
            className={`min-h-12 shrink-0 border-b-2 px-4 text-xs tracking-[0.2em] uppercase transition-colors ${
              tab === k ? "border-bone text-bone" : "border-transparent text-dust hover:text-steel"
            }`}
          >
            {t(k)}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="py-6 text-sm leading-relaxed text-steel">
        {tab === "tabSizeChart" && chart && (
          <div className="flex flex-col gap-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-center text-sm" dir="ltr">
                <thead>
                  <tr className="border-b border-ash text-xs tracking-wider text-dust uppercase">
                    {chart.columns.map((c) => (
                      <th key={c} scope="col" className="px-3 py-2 font-normal">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chart.rows.map((row) => (
                    <tr key={String(row[0])} className="border-b border-ash/60">
                      {row.map((cell, i) => (
                        <td key={i} className={`px-3 py-2.5 ${i === 0 ? "text-bone" : ""}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-dust">{chart.kind === "shoes" ? t("sizeChartShoes") : t("sizeChartNote")}</p>
          </div>
        )}
        {tab === "tabDetails" && <p dir="auto" className="whitespace-pre-line">{description || t("noDetails")}</p>}
        {tab === "tabWashing" && (
          <ul className="flex flex-col gap-2">
            {t(washingKey(category)).split(" · ").map((line) => (
              <li key={line} className="flex gap-2"><span aria-hidden="true">—</span>{line}</li>
            ))}
          </ul>
        )}
        {tab === "tabDelivery" && (
          <div className="flex flex-col gap-3">
            <p>{t("deliveryText")}</p>
            <p className="text-dust">{t("exchangeNote")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
