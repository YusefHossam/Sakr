import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { env } from "@/lib/env";
import type { Level } from "@/models/user";

export const SESSION_COOKIE = "sakr_session";
const MAX_AGE_S = 60 * 60 * 24 * 30;

export type Session = { userId: string; role: "customer" | "admin"; name: string; level: Level };

const key = () => new TextEncoder().encode(env().AUTH_SECRET);

export async function createSession(session: Session): Promise<void> {
  const token = await new SignJWT({ role: session.role, name: session.name, level: session.level })
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
    const level = payload.level === "og" || payload.level === "legend" ? payload.level : "rookie";
    return { userId: payload.sub, role: payload.role === "admin" ? "admin" : "customer", name: String(payload.name ?? ""), level };
  } catch {
    return null;
  }
}

/** The signed-in visitor, or null. Reads cookies, so call it inside <Suspense> or an action. */
export async function getSession(): Promise<Session | null> {
  // JWT expiry checks read the clock; make sure this only ever runs at request time.
  await connection();
  return verifyToken((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function deleteSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
