import "server-only";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { env } from "@/lib/env";

export const SESSION_COOKIE = "sakr_session";
const MAX_AGE_S = 60 * 60 * 24 * 30;

export type Session = { userId: string; role: "customer" | "admin"; name: string };

const key = () => new TextEncoder().encode(env().AUTH_SECRET);

export async function createSession(session: Session): Promise<void> {
  const token = await new SignJWT({ role: session.role, name: session.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_S}s`)
    .sign(key());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}

export async function verifyToken(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    if (!payload.sub) return null;
    return { userId: payload.sub, role: payload.role === "admin" ? "admin" : "customer", name: String(payload.name ?? "") };
  } catch {
    return null;
  }
}

/** The signed-in visitor, or null. Reads cookies, so call it inside <Suspense> or an action. */
export async function getSession(): Promise<Session | null> {
  return verifyToken((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function deleteSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
