import { Suspense } from "react";
import { getLocale } from "next-intl/server";
import { ActionButton } from "@/components/admin/ui";
import { Link } from "@/i18n/navigation";
import { setCustomerRole } from "@/lib/actions/admin-more";
import { requireAdmin } from "@/lib/auth/admin";
import { connectDB } from "@/lib/db";
import { AuditLog } from "@/models/audit";
import { User } from "@/models/user";

export default async function AdminTeam() {
  const locale = await getLocale();
  return (
    <div className="flex flex-col gap-8">
      <h1 className="street-heading text-5xl">{locale === "ar" ? "الفريق" : "Team"}</h1>
      <Suspense fallback={<div className="h-64 animate-pulse bg-smoke" />}>
        <Admins />
      </Suspense>
    </div>
  );
}

async function Admins() {
  const me = await requireAdmin();
  const locale = await getLocale();
  const L = (ar: string, en: string) => (locale === "ar" ? ar : en);
  await connectDB();
  const admins = await User.find({ role: "admin" }).sort({ createdAt: 1 }).select("name email createdAt").lean();
  const last = await AuditLog.aggregate<{ _id: string; at: Date; n: number }>([{ $group: { _id: "$adminId", at: { $max: "$createdAt" }, n: { $sum: 1 } } }]);
  const activity = new Map(last.map((a) => [a._id, a]));

  return (
    <>
      <p className="max-w-2xl text-sm text-steel">{L("الأدمن بيشوف ويتحكم في كل حاجة. عشان تضيف أدمن، افتح العميل من صفحة العملاء واضغط «خليه أدمن».", "Admins see and control everything. To add one, open the customer in Customers and press “Make admin”.")}</p>
      <ul className="flex flex-col divide-y divide-ash border-y border-ash">
        {admins.map((a) => {
          const id = String(a._id);
          const act = activity.get(id);
          return (
            <li key={id} className="flex flex-wrap items-center gap-4 py-4 text-sm">
              <Link href={`/admin/customers/${id}`} className="text-bone">{a.name}{id === me.userId && ` (${L("إنت", "you")})`}</Link>
              <span className="text-steel" dir="ltr">{a.email}</span>
              <span className="text-dust" dir="ltr">{act ? `${act.n} ${L("عملية", "actions")} · ${new Date(act.at).toISOString().slice(0, 10)}` : L("مفيش نشاط", "no activity")}</span>
              {id !== me.userId && <span className="ms-auto"><ActionButton action={setCustomerRole.bind(null, id, "customer")} label={L("شيل من الأدمن", "Remove admin")} confirm={L("تشيل الصلاحية؟", "Remove admin rights?")} danger /></span>}
            </li>
          );
        })}
      </ul>
      <Link href="/admin/customers" className="self-start text-sm text-bone underline underline-offset-4">{L("افتح العملاء", "Open customers")} →</Link>
    </>
  );
}
