import "server-only";
import { notFound } from "next/navigation";
import { getSession, type Session } from "./session";

/**
 * Server-side admin check for pages and actions (the proxy check is only optimistic).
 * Non-admins get a 404 so the admin area doesn't advertise itself.
 */
export async function requireAdmin(): Promise<Session> {
  const session = await getSession();
  if (session?.role !== "admin") notFound();
  return session;
}
