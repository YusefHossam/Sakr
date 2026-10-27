import { Suspense } from "react";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { adminButton, adminField } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/admin";

export default async function Reports() {
  const t = await getTranslations("admin.reports");
  return (
    <div className="flex flex-col gap-8">
      <h1 className="street-heading text-5xl">{t("title")}</h1>
      <p className="text-sm text-steel">{t("text")}</p>
      <Suspense fallback={null}>
        <Forms />
      </Suspense>
    </div>
  );
}

async function Forms() {
  await requireAdmin();
  await connection();
  const t = await getTranslations("admin.reports");
  const now = new Date();
  const years = Array.from({ length: 4 }, (_, i) => now.getFullYear() - i);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Plain GET forms: the route streams the PDF as a download. */}
      <form action="/api/admin/reports" method="get" className="flex flex-col gap-3 border border-ash p-6">
        <input type="hidden" name="kind" value="month" />
        <h2 className="street-heading text-2xl">{t("monthly")}</h2>
        <div className="grid grid-cols-2 gap-3">
          <select name="month" defaultValue={now.getMonth() + 1} className={adminField} aria-label="Month">
            {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{String(i + 1).padStart(2, "0")}</option>)}
          </select>
          <select name="year" defaultValue={now.getFullYear()} className={adminField} aria-label="Year">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button type="submit" className={adminButton}>{t("download")}</button>
      </form>
      <form action="/api/admin/reports" method="get" className="flex flex-col gap-3 border border-ash p-6">
        <input type="hidden" name="kind" value="year" />
        <h2 className="street-heading text-2xl">{t("yearly")}</h2>
        <select name="year" defaultValue={now.getFullYear()} className={adminField} aria-label="Year">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <button type="submit" className={adminButton}>{t("download")}</button>
      </form>
    </div>
  );
}
