import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import {
  hashPassword,
  verifyPassword,
  digestToken,
  newSessionToken,
} from "@/lib/password";
export const SESSION_SECONDS = 60 * 60 * 24 * 7;
export async function consumeAuthAttempt(db: PrismaClient, email: string) {
  const counters = await db.$transaction(async (tx) => {
    const counts: number[] = [];
    for (const key of ["global", `email:${digestToken(email)}`]) {
      const rows = await tx.$queryRaw<
        { attempts: number }[]
      >`INSERT INTO "AuthRateLimit" ("key","attempts","expiresAt") VALUES (${key},1,CURRENT_TIMESTAMP + INTERVAL '15 minutes') ON CONFLICT ("key") DO UPDATE SET "attempts"=CASE WHEN "AuthRateLimit"."expiresAt" <= NOW() THEN 1 ELSE "AuthRateLimit"."attempts"+1 END,"expiresAt"=CASE WHEN "AuthRateLimit"."expiresAt" <= NOW() THEN EXCLUDED."expiresAt" ELSE "AuthRateLimit"."expiresAt" END RETURNING "attempts"`;
      counts.push(rows[0].attempts);
    }
    return counts;
  });
  return counters[0] <= 300 && counters[1] <= 10;
}
export async function createSession(db: PrismaClient, userId: string) {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000);
  await db.$transaction([
    db.session.deleteMany({ where: { expiresAt: { lte: new Date() } } }),
    db.session.create({
      data: { tokenHash: digestToken(token), userId, expiresAt },
    }),
  ]);
  return { token, expiresAt };
}
export async function sessionUser(db: PrismaClient, token: string | undefined) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: digestToken(token) },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          onboardingCompletedAt: true,
        },
      },
    },
  });
  return session && session.expiresAt > new Date() ? session.user : null;
}
export async function revokeSession(
  db: PrismaClient,
  token: string | undefined,
) {
  if (token)
    await db.session.deleteMany({ where: { tokenHash: digestToken(token) } });
}
export async function authenticateUser(
  db: PrismaClient,
  mode: "login" | "signup",
  email: string,
  password: string,
  fullName?: string,
) {
  if (!(await consumeAuthAttempt(db, email)))
    return {
      error: "Too many attempts. Please try again in 15 minutes.",
    } as const;
  let user;
  if (mode === "signup") {
    if (!fullName || fullName.trim().length < 2 || fullName.length > 120)
      return { error: "Enter your full name." } as const;
    const passwordHash = await hashPassword(password);
    try {
      user = await db.user.create({
        data: { email, passwordHash, fullName: fullName.trim() },
        select: { id: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return {
          error: "An account with this email already exists. Please sign in.",
        } as const;
      }
      throw error;
    }
  } else {
    const account = await db.user.findUnique({ where: { email } });
    const passwordMatches = await verifyPassword(
      password,
      account?.passwordHash ?? null,
    );
    if (!account)
      return {
        error: "No account found with this email. Please sign up.",
      } as const;
    if (!passwordMatches)
      return { error: "Incorrect password. Please try again." } as const;
    user = account;
  }
  if (!user) return { error: "Unable to sign in." } as const;
  return createSession(db, user.id);
}
