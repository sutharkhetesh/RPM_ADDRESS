export const SESSION_COOKIE = "addressly-session";
export const SESSION_SECONDS = 60 * 60 * 24 * 30;
export const SESSION_RENEWAL_SECONDS = 60 * 60 * 24;

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
    expires: expiresAt,
  };
}
