import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { database } from "@/lib/prisma";
import { sessionUser } from "@/lib/session-service";
export const SESSION_COOKIE = "addressly-session";
export const requireUser = cache(async function requireUser() {
  if (!process.env.DATABASE_URL) redirect("/setup");
  const jar = await cookies();
  const user = await sessionUser(database(), jar.get(SESSION_COOKIE)?.value);
  if (!user) redirect("/login");
  return user;
});
