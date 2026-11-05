"use server";
import { loginSchema, signupSchema } from "@/lib/validations/auth";
import { authenticationFailure } from "@/lib/database-errors";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { database } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/auth";
import {
  authenticateUser,
  revokeSession,
  SESSION_SECONDS,
} from "@/lib/session-service";
export async function authenticate(mode: "login" | "signup", input: unknown) {
  const parsed = (mode === "signup" ? signupSchema : loginSchema).safeParse(
    input,
  );
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message ?? "Check your details.",
    };
  if (mode !== "login" && mode !== "signup")
    return { error: "Invalid request." };
  if (!process.env.DATABASE_URL)
    return { error: "Add DATABASE_URL to .env to configure your workspace." };
  try {
    const result = await authenticateUser(
      database(),
      mode,
      parsed.data.email,
      parsed.data.password,
      "fullName" in parsed.data ? String(parsed.data.fullName) : undefined,
    );
    if ("error" in result) return { error: result.error };
    const jar = await cookies();
    const previous = jar.get(SESSION_COOKIE)?.value;
    await revokeSession(database(), previous);
    jar.set(SESSION_COOKIE, result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_SECONDS,
      expires: result.expiresAt,
    });
  } catch (error) {
    return { error: authenticationFailure(error) };
  }
  redirect("/dashboard");
}
export async function signOut() {
  const jar = await cookies();
  await revokeSession(database(), jar.get(SESSION_COOKIE)?.value);
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}
