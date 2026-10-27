import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { connectDB } from "./db";
import { defaultIntlFee, GOVERNORATES } from "./shipping";
import { SETTINGS_TAG } from "./tags";
import { Settings } from "@/models/settings";

export type StoreSettings = {
  lastPiecesMax: number;
  lastPiecesDiscount: number;
  bigOrderThreshold: number;
  bigOrderPercent: number;
  apologyPercent: number;
  shippingEgypt: Record<string, number>;
  shippingIntl: Record<string, number>;
  transferInstapay: string;
  transferWallet: string;
  drop: { locked: boolean; password: string; name: string; opensAt: string | null; vipEarlyHours: number };
};

/** Store settings with defaults filled in (creates the document on first use). */
export async function getSettings(): Promise<StoreSettings> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  cacheLife("hours");
  await connectDB();
  const doc = (await Settings.findOne({ key: "store" }).lean()) ?? (await Settings.create({ key: "store" })).toObject();
  const egypt = Object.fromEntries(Object.entries(GOVERNORATES).map(([k, g]) => [k, g.fee]));
  return {
    lastPiecesMax: doc.lastPiecesMax,
    lastPiecesDiscount: doc.lastPiecesDiscount,
    bigOrderThreshold: doc.bigOrderThreshold,
    bigOrderPercent: doc.bigOrderPercent,
    apologyPercent: doc.apologyPercent,
    shippingEgypt: { ...egypt, ...Object.fromEntries(Object.entries(doc.shippingEgypt ?? {})) },
    shippingIntl: Object.fromEntries(Object.entries(doc.shippingIntl ?? {})),
    transferInstapay: doc.transferInstapay,
    transferWallet: doc.transferWallet,
    drop: {
      locked: doc.drop?.locked ?? false,
      password: doc.drop?.password ?? "",
      name: doc.drop?.name ?? "DROP 01",
      opensAt: doc.drop?.opensAt ? new Date(doc.drop.opensAt).toISOString() : null,
      vipEarlyHours: doc.drop?.vipEarlyHours ?? 3,
    },
  };
}

export function shippingFee(settings: StoreSettings, country: string, governorate: string): number {
  if (country === "EG") return settings.shippingEgypt[governorate] ?? 100;
  return settings.shippingIntl[country] ?? defaultIntlFee(country);
}
