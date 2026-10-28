import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/admin/print-button";
import { requireAdmin } from "@/lib/auth/admin";
import { connectDB } from "@/lib/db";
import { GOVERNORATES } from "@/lib/shipping";
import { Order } from "@/models/order";

const egp = (n: number) => `${n.toLocaleString("en")} EGP`;

export default function Invoice({ params }: PageProps<"/[locale]/admin/orders/[number]/invoice">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse bg-smoke" />}>
      <Sheet params={params} />
    </Suspense>
  );
}

async function Sheet({ params }: Pick<PageProps<"/[locale]/admin/orders/[number]/invoice">, "params">) {
  await requireAdmin();
  const { number } = await params;
  await connectDB();
  const o = await Order.findOne({ number }).lean();
  if (!o) notFound();
  const c = o.contact!;
  const a = o.address!;
  const p = o.payment!;

  // A white sheet on purpose: it reads the same on screen and on paper (English, like the PDF reports).
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 bg-white p-8 text-sm text-black" dir="ltr">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-gothic text-6xl leading-none">Sakr</p>
          <p className="mt-1 text-xs text-neutral-500">SAKR · Cairo, Egypt</p>
        </div>
        <div className="text-end">
          <p className="text-xs tracking-widest text-neutral-500 uppercase">Invoice</p>
          <p className="text-xl font-semibold">{o.number}</p>
          <p className="text-xs text-neutral-500">{new Date(o.createdAt).toISOString().slice(0, 10)}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6 border-y border-neutral-300 py-4">
        <div>
          <p className="text-xs tracking-widest text-neutral-500 uppercase">Bill to</p>
          <p className="font-medium">{c.name}</p>
          <p>{c.email}</p>
          <p>{c.phone}{c.phone2 && ` · ${c.phone2}`}</p>
        </div>
        <div>
          <p className="text-xs tracking-widest text-neutral-500 uppercase">Deliver to</p>
          <p>{a.street}{a.building && `, ${a.building}`}{a.floor && `, fl ${a.floor}`}{a.apartment && `, apt ${a.apartment}`}</p>
          <p>{a.city}{a.governorate && `, ${GOVERNORATES[a.governorate]?.en ?? a.governorate}`}, {a.country}</p>
          <p className="text-neutral-500">Delivery {new Date(o.deliveryDate).toISOString().slice(0, 10)}</p>
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-300 text-xs tracking-widest text-neutral-500 uppercase">
            <th className="py-2 text-start font-normal">Item</th>
            <th className="py-2 text-end font-normal">Qty</th>
            <th className="py-2 text-end font-normal">Price</th>
            <th className="py-2 text-end font-normal">Total</th>
          </tr>
        </thead>
        <tbody>
          {o.items.map((i) => (
            <tr key={`${i.productSlug}-${i.size}`} className="border-b border-neutral-200">
              <td className="py-2">{i.brand} {i.title}{i.size && ` · ${i.size}`}</td>
              <td className="py-2 text-end">{i.qty}</td>
              <td className="py-2 text-end">{egp(i.unitPrice)}</td>
              <td className="py-2 text-end">{egp(i.unitPrice * i.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ms-auto flex w-64 flex-col gap-1">
        <p className="flex justify-between"><span>Subtotal</span><span>{egp(o.subtotal)}</span></p>
        {o.discount > 0 && <p className="flex justify-between"><span>Discount{o.couponCode && ` (${o.couponCode})`}</span><span>−{egp(o.discount)}</span></p>}
        <p className="flex justify-between"><span>Shipping</span><span>{egp(o.shipping)}</span></p>
        <p className="flex justify-between border-t border-neutral-300 pt-1 text-base font-semibold"><span>Total</span><span>{egp(o.total)}</span></p>
        <p className="flex justify-between text-neutral-500"><span>{p.method.toUpperCase()} · {p.status}</span><span>{o.dueNow !== o.total ? `${egp(o.dueNow)} due now` : ""}</span></p>
        {o.refunded && <p className="text-end font-medium text-red-700">REFUNDED</p>}
      </div>
      <p className="text-center text-xs text-neutral-500">Thank you for shopping SAKR. Exchanges within 14 days, unworn with tags.</p>
      <PrintButton />
    </div>
  );
}
