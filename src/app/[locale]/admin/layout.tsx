import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = { title: { default: "Admin", template: "%s — SAKR Admin" }, robots: { index: false, follow: false } };

const NAV = [
  ["", "dashboard"],
  ["/orders", "orders"],
  ["/products", "products"],
  ["/marketing", "marketing"],
  ["/inbox", "inbox"],
  ["/reports", "reports"],
  ["/settings", "settings"],
] as const;

export default async function AdminLayout({ children }: LayoutProps<"/[locale]/admin">) {
  const t = await getTranslations("admin.nav");
  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-8 px-4 pt-6 md:flex-row md:px-8">
      <nav aria-label="Admin" className="md:w-52 md:shrink-0">
        <ul className="flex gap-1 overflow-x-auto border-b border-ash pb-3 md:sticky md:top-32 md:flex-col md:border-b-0 md:border-e md:pe-4">
          {NAV.map(([href, key]) => (
            <li key={key}>
              <Link href={`/admin${href}`} className="block whitespace-nowrap px-3 py-2 text-sm text-steel hover:bg-smoke hover:text-bone">
                {t(key)}
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
