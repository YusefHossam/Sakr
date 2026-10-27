import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { LockedScreen } from "@/components/drop/locked-screen";
import { getDropState } from "@/lib/drop";

export const metadata: Metadata = { title: "Sold out", robots: { index: false } };

// The proxy rewrites storefront pages here while the drop is locked.
export default function LockedPage() {
  return (
    <Suspense fallback={<div className="min-h-[85vh]" />}>
      <Locked />
    </Suspense>
  );
}

async function Locked() {
  await connection();
  const drop = await getDropState();
  return <LockedScreen name={drop.name} opensAt={drop.opensAt} vipHours={drop.vipEarlyHours} />;
}
