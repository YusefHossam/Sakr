import { Suspense } from "react";
import { getSession } from "@/lib/auth/session";
import { cartCount } from "@/lib/shop-data";
import { NavBar } from "./nav-bar";

export function Header() {
  return (
    <NavBar
      cartBadge={
        <Suspense fallback={null}>
          <CartBadge />
        </Suspense>
      }
    />
  );
}

// Per-visitor, so it streams in after the cached header shell.
async function CartBadge() {
  const session = await getSession();
  const count = session ? await cartCount(session.userId) : 0;
  if (!count) return null;
  return (
    <span className="absolute -end-2 -top-1.5 grid size-4 place-items-center rounded-full bg-bone text-[10px] font-bold text-ink">{count}</span>
  );
}
