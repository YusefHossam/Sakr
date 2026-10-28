"use client";

export type QueuedLine = { slug: string; size: string | null; color: string | null; qty: number };

const KEY = "sakr-offline-cart";

export function readQueue(): QueuedLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]") as QueuedLine[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function write(lines: QueuedLine[]) {
  try {
    if (lines.length) localStorage.setItem(KEY, JSON.stringify(lines));
    else localStorage.removeItem(KEY);
  } catch {
    // storage blocked: the queue just won't persist
  }
}

/** Remembers an add-to-cart made while offline. */
export function enqueue(line: QueuedLine) {
  const q = readQueue();
  const same = q.find((l) => l.slug === line.slug && l.size === line.size && l.color === line.color);
  if (same) same.qty = Math.min(10, same.qty + line.qty);
  else q.push(line);
  write(q);
}

/** Sends queued lines through `send`; lines that fail for a network reason stay queued. Returns how many were synced. */
export async function flush(send: (line: QueuedLine) => Promise<"done" | "retry">): Promise<number> {
  const q = readQueue();
  if (!q.length) return 0;
  const left: QueuedLine[] = [];
  let done = 0;
  for (const line of q) {
    if ((await send(line)) === "done") done++;
    else left.push(line);
  }
  write(left);
  return done;
}
