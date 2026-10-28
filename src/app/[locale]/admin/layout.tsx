import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = { title: { default: "Admin", template: "%s — SAKR Admin" }, robots: { index: false, follow: false } };

// [path, translation key or null, Arabic label, English label]: the newer sections carry their own labels.
const NAV: readonly (readonly [string, string | null, string, string])[] = [
  ["", "dashboard", "", ""],
  ["/orders", "orders", "", ""],
  ["/customers", null, "العملاء", "Customers"],
  ["/products", "products", "", ""],
  ["/catalog", null, "الكتالوج", "Catalog"],
  ["/marketing", "marketing", "", ""],
  ["/content", null, "المحتوى", "Content"],
  ["/live", null, "اللايف", "Live drop"],
  ["/inbox", "inbox", "", ""],
  ["/analytics", null, "التحليلات", "Analytics"],
  ["/reports", "reports", "", ""],
  ["/audit", null, "سجل العمليات", "Audit log"],
  ["/events", null, "أحداث الأوردرات", "Order events"],
  ["/team", null, "الفريق", "Team"],
  ["/settings", "settings", "", ""],
];

export default async function AdminLayout({ children }: LayoutProps<"/[locale]/admin">) {
  const [t, locale] = await Promise.all([getTranslations("admin.nav"), getLocale()]);
  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-8 px-4 pt-6 md:flex-row md:px-8">
      <nav aria-label="Admin" className="md:w-52 md:shrink-0 print:hidden">
        <ul className="flex gap-1 overflow-x-auto border-b border-ash pb-3 md:sticky md:top-32 md:flex-col md:border-b-0 md:border-e md:pe-4">
          {NAV.map(([href, key, ar, en]) => (
            <li key={href}>
              <Link href={`/admin${href}`} className="block whitespace-nowrap px-3 py-2 text-sm text-steel hover:bg-smoke hover:text-bone">
                {key ? t(key as "dashboard") : locale === "ar" ? ar : en}
              </Link>
            </li>
          ))}
          <li className="md:mt-4">
            <Link href="/" className="block whitespace-nowrap px-3 py-2 text-xs text-dust hover:text-bone">← {t("store")}</Link>
          </li>
        </ul>
      </nav>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
