import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { SESSION_COOKIE, verifyToken } from "./lib/auth/session";
import { DROP_COOKIE, getDropState, vipWindowOpen } from "./lib/drop";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

// Pages that stay reachable while the drop is locked: accounts, orders, tracking, admin.
const ALWAYS_OPEN = /^\/(ar|en)\/(account|orders|track|login|register|admin|locked)(\/|$)/;
const ADMIN = /^\/(ar|en)\/admin(\/|$)/;

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const locale = path.match(/^\/(ar|en)(?=\/|$)/)?.[1];

  // Admin pages: optimistic check here; every admin page and action re-verifies on the server.
  if (locale && ADMIN.test(path)) {
    const session = await verifyToken(request.cookies.get(SESSION_COOKIE)?.value);
    if (session?.role !== "admin") return NextResponse.redirect(new URL(`/${locale}/login?next=/admin`, request.url));
  }

  // Drop lock (BR-32…35): storefront pages show the locked screen unless you hold the password,
  // you're the admin, or you're OG/Legend inside the early-access window.
  if (locale && !ALWAYS_OPEN.test(path)) {
    const drop = await getDropState().catch(() => null);
    if (drop?.locked) {
      const session = await verifyToken(request.cookies.get(SESSION_COOKIE)?.value);
      const allowed =
        session?.role === "admin" ||
        (!!drop.passwordHash && request.cookies.get(DROP_COOKIE)?.value === drop.passwordHash) ||
        (session && session.level !== "rookie" && vipWindowOpen(drop));
      if (!allowed) return NextResponse.rewrite(new URL(`/${locale}/locked`, request.url));
    }
  }

  return intl(request);
}

export const config = {
  // Skip API routes, Next internals, and files with an extension (images, music, favicon).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
