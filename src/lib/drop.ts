import "server-only";
import { createHash } from "node:crypto";
import { connectDB } from "./db";
import { Settings } from "@/models/settings";

export const DROP_COOKIE = "sakr_drop";

export type DropState = { locked: boolean; passwordHash: string | null; name: string; opensAt: string | null; vipEarlyHours: number };

export const hashDropPassword = (password: string) => createHash("sha256").update(`sakr-drop:${password}`).digest("hex");

// The proxy checks the lock on every storefront request, so keep it in memory for a few seconds.
let memo: { at: number; state: DropState } | null = null;
const MEMO_MS = 10_000;

export async function getDropState(fresh = false): Promise<DropState> {
  if (!fresh && memo && Date.now() - memo.at < MEMO_MS) return memo.state;
  await connectDB();
  const doc = await Settings.findOne({ key: "store" }).select("drop").lean();
  const d = doc?.drop;
  const state: DropState = {
    locked: !!d?.locked,
    passwordHash: d?.password ? hashDropPassword(d.password) : null,
    name: d?.name ?? "DROP 01",
    opensAt: d?.opensAt ? new Date(d.opensAt).toISOString() : null,
    vipEarlyHours: d?.vipEarlyHours ?? 3,
  };
  memo = { at: Date.now(), state };
  return state;
}

/** OG/Legend customers get in this many hours before the drop's opening time (BR-54). */
export function vipWindowOpen(state: DropState, now = Date.now()): boolean {
  if (!state.opensAt) return false;
  return now >= Date.parse(state.opensAt) - state.vipEarlyHours * 36e5;
}
