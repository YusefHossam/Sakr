"use client";

import { useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { adminButton, adminField } from "@/components/admin/ui";
import { useRouter } from "@/i18n/navigation";
import type { AdminResult } from "@/lib/actions/admin";
import {
  addCustomerPoints, adjustCustomerWallet, refundOrderToWallet, setPreorder, bulkActive, bulkPrice, bulkStock, grantCustomerCoupon, resetCustomerPassword, restockProduct, saveContent,
  saveCustomerNote, saveOrderNote, setCustomerBlocked, setCustomerLevel, setCustomerRole, setDeliveryDate, setOrderRefunded,
} from "@/lib/actions/admin-more";

/** Runs a server action, shows its message or error under the control, then refreshes the page. */
function useRun() {
  const router = useRouter();
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const L = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const run = (action: () => Promise<AdminResult>, confirm?: string) => {
    if (confirm && !window.confirm(confirm)) return;
    startTransition(async () => {
      const res = await action();
      setNote(res.ok ? { ok: true, text: res.message ? `✓ ${res.message}` : "✓" } : { ok: false, text: res.error });
      router.refresh();
    });
  };
  const status = note && <span className={`text-xs ${note.ok ? "text-bone" : "text-blood"}`} dir="ltr">{note.text}</span>;
  return { run, pending, status, L };
}

const label = "flex flex-col gap-1 text-xs text-steel";

export function CustomerTools({ id, level, blocked, role, self, note }: { id: string; level: string; blocked: boolean; role: string; self: boolean; note: string }) {
  const { run, pending, status, L } = useRun();
  const [percent, setPercent] = useState("15");
  const [points, setPoints] = useState("100");
  const [text, setText] = useState(note);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className={label}>
          {L("المستوى", "Level")}
          <select defaultValue={level} disabled={pending} onChange={(e) => run(() => setCustomerLevel(id, e.target.value as "rookie" | "og" | "legend"))} className={adminField}>
            {["rookie", "og", "legend"].map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
        </label>
        <label className={label}>
          {L("كوبون للعميل (٪)", "Coupon for customer (%)")}
          <input value={percent} onChange={(e) => setPercent(e.target.value)} inputMode="numeric" className={`${adminField} w-28`} dir="ltr" />
        </label>
        <button type="button" disabled={pending} onClick={() => run(() => grantCustomerCoupon(id, Number(percent)))} className={adminButton}>{L("ابعت كوبون", "Grant coupon")}</button>
        <label className={label}>
          {L("نقط (+/−)", "Points (+/−)")}
          <input value={points} onChange={(e) => setPoints(e.target.value)} inputMode="numeric" className={`${adminField} w-28`} dir="ltr" />
        </label>
        <button type="button" disabled={pending} onClick={() => run(() => addCustomerPoints(id, Number(points)))} className={adminButton}>{L("عدّل النقط", "Adjust points")}</button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={pending || self} onClick={() => run(() => setCustomerBlocked(id, !blocked), blocked ? undefined : L("تحظر العميل ده؟", "Block this customer?"))} className={`${adminButton} ${blocked ? "" : "border-blood/70 text-blood hover:bg-blood hover:text-chrome"}`}>
          {blocked ? L("فك الحظر", "Unblock") : L("حظر العميل", "Block customer")}
        </button>
        <button type="button" disabled={pending || self} onClick={() => run(() => setCustomerRole(id, role === "admin" ? "customer" : "admin"), L("تغيّر الصلاحية؟", "Change role?"))} className={adminButton}>
          {role === "admin" ? L("شيل من الأدمن", "Remove admin") : L("خليه أدمن", "Make admin")}
        </button>
        <button type="button" disabled={pending} onClick={() => run(() => resetCustomerPassword(id), L("هتتولّد باسورد جديد؟", "Generate a new password?"))} className={adminButton}>{L("باسورد جديد", "Reset password")}</button>
        {status}
      </div>
      <label className={label}>
        {L("ملاحظة داخلية (العميل مش بيشوفها)", "Internal note (never shown to the customer)")}
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={500} className={`${adminField} py-2`} />
      </label>
      <button type="button" disabled={pending} onClick={() => run(() => saveCustomerNote(id, text))} className={`${adminButton} self-start`}>{L("احفظ الملاحظة", "Save note")}</button>
    </div>
  );
}

export function OrderTools({ number, note, refunded, deliveryDate }: { number: string; note: string; refunded: boolean; deliveryDate: string }) {
  const { run, pending, status, L } = useRun();
  const [text, setText] = useState(note);
  const [date, setDate] = useState(deliveryDate);
  return (
    <div className="flex flex-col gap-4 border border-ash p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className={label}>
          {L("ميعاد التوصيل", "Delivery date")}
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={adminField} dir="ltr" />
        </label>
        <button type="button" disabled={pending} onClick={() => run(() => setDeliveryDate(number, date))} className={adminButton}>{L("غيّر الميعاد", "Change date")}</button>
        <button type="button" disabled={pending} onClick={() => run(() => setOrderRefunded(number, !refunded), L("تأكيد؟", "Confirm?"))} className={adminButton}>
          {refunded ? L("شيل علامة المرتجع", "Unmark refunded") : L("علّم إنه اترد فلوسه", "Mark as refunded")}
        </button>
        {status}
      </div>
      <label className={label}>
        {L("ملاحظة داخلية", "Internal note")}
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={500} className={`${adminField} py-2`} />
      </label>
      <button type="button" disabled={pending} onClick={() => run(() => saveOrderNote(number, text))} className={`${adminButton} self-start`}>{L("احفظ", "Save")}</button>
    </div>
  );
}

export function RestockButton({ slug }: { slug: string }) {
  const { run, pending, L } = useRun();
  return (
    <button type="button" disabled={pending} onClick={() => run(() => restockProduct(slug, 10))} className="border border-ash px-2 py-1 text-xs text-steel hover:text-bone disabled:opacity-50">
      {pending ? "…" : L("+ خلّي كل مقاس 10", "Set sizes to 10")}
    </button>
  );
}

type Option = { value: string; label: string };

export function BulkTools({ brands, categories }: { brands: Option[]; categories: Option[] }) {
  const { run, pending, status, L } = useRun();
  const [scope, setScope] = useState<"all" | "brand" | "category">("brand");
  const [key, setKey] = useState(brands[0]?.value ?? "");
  const [percent, setPercent] = useState("10");
  const [qty, setQty] = useState("10");
  const options = scope === "brand" ? brands : scope === "category" ? categories : [];
  const target = { scope, key: scope === "all" ? "" : key };
  const where = scope === "all" ? L("كل المنتجات", "every product") : options.find((o) => o.value === key)?.label ?? key;
  return (
    <div className="flex flex-col gap-4 border border-ash p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className={label}>
          {L("على", "Apply to")}
          <select value={scope} onChange={(e) => { const s = e.target.value as typeof scope; setScope(s); setKey((s === "brand" ? brands : categories)[0]?.value ?? ""); }} className={adminField}>
            <option value="brand">{L("براند", "A brand")}</option>
            <option value="category">{L("قسم", "A category")}</option>
            <option value="all">{L("كل المتجر", "The whole store")}</option>
          </select>
        </label>
        {scope !== "all" && (
          <label className={label}>
            {scope === "brand" ? L("البراند", "Brand") : L("القسم", "Category")}
            <select value={key} onChange={(e) => setKey(e.target.value)} className={adminField}>
              {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className={label}>
          {L("تغيير السعر (٪، سالب = تخفيض)", "Price change (%, negative = cut)")}
          <input value={percent} onChange={(e) => setPercent(e.target.value)} inputMode="numeric" className={`${adminField} w-28`} dir="ltr" />
        </label>
        <button type="button" disabled={pending} onClick={() => run(() => bulkPrice(target, Number(percent)), L(`تغيّر السعر ${percent}٪ على ${where}؟`, `Change prices ${percent}% on ${where}?`))} className={adminButton}>{L("طبّق السعر", "Apply price")}</button>
        <label className={label}>
          {L("المخزون لكل مقاس", "Stock per size")}
          <input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" className={`${adminField} w-28`} dir="ltr" />
        </label>
        <button type="button" disabled={pending} onClick={() => run(() => bulkStock(target, Number(qty)), L(`تضبط المخزون ${qty} على ${where}؟`, `Set stock to ${qty} on ${where}?`))} className={adminButton}>{L("اضبط المخزون", "Set stock")}</button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={pending} onClick={() => run(() => bulkActive(target, true), L(`تظهر ${where}؟`, `Show ${where}?`))} className={adminButton}>{L("اظهر", "Show")}</button>
        <button type="button" disabled={pending || scope === "all"} onClick={() => run(() => bulkActive(target, false), L(`تخفي ${where}؟`, `Hide ${where}?`))} className={`${adminButton} border-blood/70 text-blood hover:bg-blood hover:text-chrome`}>{L("اخفي", "Hide")}</button>
        {status}
      </div>
    </div>
  );
}

type Banner = { title: string; text: string; href: string; image: string; active: boolean };

export function ContentForm({ announcement, banners: initial }: { announcement: { text: string; active: boolean }; banners: Banner[] }) {
  const { run, pending, status, L } = useRun();
  const [text, setText] = useState(announcement.text);
  const [active, setActive] = useState(announcement.active);
  const [banners, setBanners] = useState<Banner[]>(initial);
  const edit = (i: number, patch: Partial<Banner>) => setBanners((b) => b.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  return (
    <div className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-3 border border-ash p-4">
        <legend className="px-2 text-sm text-bone">{L("شريط الإعلان (فوق الموقع كله)", "Announcement bar (top of every page)")}</legend>
        <label className="flex items-center gap-3 text-sm text-bone">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4 accent-[#b9b9b9]" />
          {L("شغّله", "Show it")}
        </label>
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={140} placeholder={L("مثلًا: شحن مجاني فوق ٥٠٠٠ جنيه", "e.g. Free shipping over 5,000 EGP")} className={adminField} />
      </fieldset>

      <section className="flex flex-col gap-4">
        <h2 className="street-heading text-2xl">{L("بانرات الرئيسية", "Home banners")}</h2>
        <p className="text-xs text-steel">{L("بتظهر قبل بانرات الخصومات التلقائية. الصورة اختيارية (رابط).", "They lead the automatic discount banners. Image is optional (a URL).")}</p>
        {banners.map((b, i) => (
          <div key={i} className="grid gap-3 border border-ash p-4 md:grid-cols-2">
            <label className={label}>{L("العنوان", "Title")}<input value={b.title} onChange={(e) => edit(i, { title: e.target.value })} maxLength={60} className={adminField} /></label>
            <label className={label}>{L("اللينك (جوه الموقع)", "Link (inside the site)")}<input value={b.href} onChange={(e) => edit(i, { href: e.target.value })} dir="ltr" className={adminField} /></label>
            <label className={label}>{L("النص", "Text")}<input value={b.text} onChange={(e) => edit(i, { text: e.target.value })} maxLength={160} className={adminField} /></label>
            <label className={label}>{L("صورة (رابط)", "Image (URL)")}<input value={b.image} onChange={(e) => edit(i, { image: e.target.value })} dir="ltr" className={adminField} /></label>
            <div className="flex items-center gap-4 md:col-span-2">
              <label className="flex items-center gap-2 text-sm text-bone"><input type="checkbox" checked={b.active} onChange={(e) => edit(i, { active: e.target.checked })} className="size-4 accent-[#b9b9b9]" />{L("ظاهر", "Visible")}</label>
              <button type="button" onClick={() => setBanners((all) => all.filter((_, k) => k !== i))} className="text-xs text-blood underline underline-offset-4">{L("احذف", "Remove")}</button>
            </div>
          </div>
        ))}
        {banners.length < 8 && (
          <button type="button" onClick={() => setBanners((all) => [...all, { title: "", text: "", href: "/shop", image: "", active: true }])} className={`${adminButton} self-start`}>+ {L("بانر جديد", "New banner")}</button>
        )}
      </section>

      <div className="flex items-center gap-3">
        <button type="button" disabled={pending} onClick={() => run(() => saveContent({ announcementText: text, announcementActive: active, banners }))} className={adminButton}>{L("احفظ المحتوى", "Save content")}</button>
        {status}
      </div>
    </div>
  );
}

// ---------- Phase C: wallet, refunds to wallet, pre-orders ----------

export function WalletControl({ id, balance }: { id: string; balance: number }) {
  const { run, pending, status, L } = useRun();
  const [amount, setAmount] = useState("500");
  const [note, setNote] = useState("");
  return (
    <div className="flex flex-col gap-3 border border-ash p-4">
      <p className="text-sm text-bone">{L("المحفظة", "Wallet")}: <span dir="ltr">{balance.toLocaleString("en")} EGP</span></p>
      <div className="flex flex-wrap items-end gap-3">
        <label className={label}>
          {L("المبلغ (+ إضافة / − خصم)", "Amount (+ add / − take)")}
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" dir="ltr" className={`${adminField} w-32`} />
        </label>
        <label className={`${label} min-w-48 flex-1`}>
          {L("السبب", "Reason")}
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className={adminField} />
        </label>
        <button type="button" disabled={pending} onClick={() => run(() => adjustCustomerWallet(id, Number(amount), note), L("تعدّل المحفظة؟", "Change the wallet?"))} className={adminButton}>{L("نفّذ", "Apply")}</button>
        {status}
      </div>
    </div>
  );
}

export function RefundToWalletButton({ number, total, refunded }: { number: string; total: number; refunded: boolean }) {
  const { run, pending, status, L } = useRun();
  const [amount, setAmount] = useState(String(total));
  if (refunded) return null;
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className={label}>
        {L("رد للمحفظة (جنيه)", "Refund to wallet (EGP)")}
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" dir="ltr" className={`${adminField} w-32`} />
      </label>
      <button type="button" disabled={pending} onClick={() => run(() => refundOrderToWallet(number, Number(amount)), L("ترد الفلوس للمحفظة؟", "Refund into the wallet?"))} className={adminButton}>{L("رد للمحفظة", "Refund to wallet")}</button>
      {status}
    </div>
  );
}

export function PreorderForm({ slug, enabled, limit, taken, shipsAt }: { slug: string; enabled: boolean; limit: number; taken: number; shipsAt: string }) {
  const { run, pending, status, L } = useRun();
  const [on, setOn] = useState(enabled);
  const [units, setUnits] = useState(String(limit));
  const [date, setDate] = useState(shipsAt);
  return (
    <div className="flex flex-col gap-3 border border-ash p-4">
      <p className="text-sm text-bone">{L("طلب مسبق", "Pre-order")} {taken > 0 && <span className="text-steel" dir="ltr">· {taken}/{limit}</span>}</p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex items-center gap-2 text-sm text-bone"><input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} className="size-4 accent-[#b9b9b9]" />{L("مفتوح", "Open")}</label>
        <label className={label}>{L("الكمية المتاحة", "Units")}<input value={units} onChange={(e) => setUnits(e.target.value)} inputMode="numeric" dir="ltr" className={`${adminField} w-28`} /></label>
        <label className={label}>{L("ميعاد الشحن", "Ships on")}<input type="date" value={date} onChange={(e) => setDate(e.target.value)} dir="ltr" className={adminField} /></label>
        <button type="button" disabled={pending} onClick={() => run(() => setPreorder(slug, { enabled: on, limit: Number(units), shipsAt: date }))} className={adminButton}>{L("احفظ", "Save")}</button>
        {status}
      </div>
    </div>
  );
}
