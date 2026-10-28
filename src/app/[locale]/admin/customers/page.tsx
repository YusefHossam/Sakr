import { Suspense } from "react";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/order";
import { levelFor, User } from "@/models/user";
import { ExportLink } from "@/components/admin/export-link";

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default async function AdminCustomers({ searchParams }: PageProps<"/[locale]/admin/customers">) {
  const locale = await getLocale();
  return (
    <div className="flex flex-col gap-8">
      <h1 className="street-heading text-5xl">{locale === "ar" ? "العملاء" : "Customers"}</h1>
      <Suspense fallback={<div className="h-96 animate-pulse bg-smoke" />}>
        <List searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function List({ searchParams }: Pick<PageProps<"/[locale]/admin/customers">, "searchParams">) {
  await requireAdmin();
  const [locale, q] = await Promise.all([getLocale(), searchParams]);
  const L = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const text = typeof q.q === "string" ? q.q.trim().slice(0, 60) : "";
  const filter = typeof q.f === "string" ? q.f : "";
  await connectDB();
  const re = text ? new RegExp(escapeRe(text), "i") : null;
  const users = await User.find({
    ...(re ? { $or: [{ name: re }, { email: re }, { phone: re }] } : {}),
    ...(filter === "blocked" ? { blocked: true } : filter === "admin" ? { role: "admin" } : filter === "og" ? { totalSpent: { $gte: 15_000, $lt: 50_000 } } : filter === "legend" ? { totalSpent: { $gte: 50_000 } } : {}),
  })
    .sort({ createdAt: -1 })
    .limit(200)
    .select("name email phone role totalSpent blocked createdAt")
    .lean();
  const counts = await Order.aggregate<{ _id: unknown; n: number }>([{ $match: { userId: { $in: users.map((u) => u._id) } } }, { $group: { _id: "$userId", n: { $sum: 1 } } }]);
  const orders = new Map(counts.map((c) => [String(c._id), c.n]));
  const chip = (on: boolean) => `whitespace-nowrap border px-3 py-1.5 text-xs ${on ? "border-bone bg-bone text-ink" : "border-ash text-steel hover:text-bone"}`;
  const FILTERS: [string, string][] = [["", L("الكل", "All")], ["og", "OG"], ["legend", "Legend"], ["admin", L("أدمن", "Admins")], ["blocked", L("محظورين", "Blocked")]];

  return (
    <>
      <form className="flex flex-wrap items-center gap-3" action="/admin/customers">
        <input name="q" defaultValue={text} placeholder={L("ابحث بالاسم أو الإيميل أو الموبايل", "Search name, email or phone")} className="min-h-10 w-72 border border-ash bg-smoke px-3 text-sm text-bone placeholder:text-dust focus:border-steel focus:outline-none" />
        {filter && <input type="hidden" name="f" value={filter} />}
        <button className="min-h-10 border border-bone/70 px-4 text-xs tracking-[0.15em] text-bone uppercase hover:bg-bone hover:text-ink">{L("بحث", "Search")}</button>
        <ExportLink type="customers" />
      </form>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(([key, name]) => (
          <Link key={key} href={`/admin/customers${key ? `?f=${key}` : ""}`} className={chip(filter === key)}>{name}</Link>
        ))}
      </div>
      <p className="text-xs text-dust" dir="ltr">{users.length}</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-ash text-xs tracking-wider text-dust uppercase">
              {[L("الاسم", "Name"), L("الإيميل", "Email"), L("الموبايل", "Phone"), L("المستوى", "Level"), L("إجمالي الشراء", "Spent"), L("الأوردرات", "Orders"), L("انضم", "Joined")].map((h) => (
                <th key={h} scope="col" className="px-2 py-2 text-start font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={String(u._id)} className="border-b border-ash/60 hover:bg-smoke">
                <td className="px-2 py-3">
                  <Link href={`/admin/customers/${String(u._id)}`} className="text-bone">{u.name}</Link>
                  {u.role === "admin" && <span className="ms-2 border border-bone/60 px-1.5 text-[10px] text-bone">ADMIN</span>}
                  {u.blocked && <span className="ms-2 border border-blood/70 px-1.5 text-[10px] text-blood">{L("محظور", "BLOCKED")}</span>}
                </td>
                <td className="px-2 py-3 text-steel" dir="ltr">{u.email}</td>
                <td className="px-2 py-3 text-steel" dir="ltr">{u.phone}</td>
                <td className="px-2 py-3 text-steel">{levelFor(u.totalSpent).toUpperCase()}</td>
                <td className="px-2 py-3 text-bone" dir="ltr">{u.totalSpent.toLocaleString("en")}</td>
                <td className="px-2 py-3 text-steel" dir="ltr">{orders.get(String(u._id)) ?? 0}</td>
                <td className="px-2 py-3 text-dust" dir="ltr">{new Date(u.createdAt).toISOString().slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
