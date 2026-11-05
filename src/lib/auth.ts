import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { database } from "@/lib/prisma";
import { sessionUser } from "@/lib/session-service";
import { SESSION_COOKIE } from "@/lib/session-cookie";
export { SESSION_COOKIE } from "@/lib/session-cookie";
export const getUser = cache(async function getUser() {
  if (!process.env.DATABASE_URL) return null;
  const jar = await cookies();
  return sessionUser(database(), jar.get(SESSION_COOKIE)?.value);
});
export const requireUser = cache(async function requireUser() {
  if (!process.env.DATABASE_URL) redirect("/setup");
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
});
