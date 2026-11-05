/** Return actionable configuration errors without exposing connection strings or SQL. */
export function authenticationFailure(error: unknown): string {
  const details: string[] = [];
  const seen = new Set<object>();
  function inspect(value: unknown, depth = 0) {
    if (
      depth > 6 ||
      value === null ||
      typeof value !== "object" ||
      seen.has(value)
    )
      return;
    seen.add(value);
    const record = value as Record<string, unknown>;
    for (const key of ["code", "originalCode", "message", "originalMessage"]) {
      if (typeof record[key] === "string") details.push(record[key]);
    }
    for (const key of ["cause", "meta", "driverAdapterError", "error"])
      inspect(record[key], depth + 1);
  }
  inspect(error);
  const text = details.join(" ");
  if (
    /SELF_SIGNED_CERT_IN_CHAIN|UNABLE_TO_VERIFY_LEAF_SIGNATURE|UNABLE_TO_GET_ISSUER_CERT|CERT_HAS_EXPIRED|ERR_TLS_CERT_ALTNAME_INVALID|self[- ]signed certificate|certificate verify failed/i.test(
      text,
    )
  ) {
    return "Database TLS verification failed. Save your Supabase CA certificate as certs/supabase-ca.crt, then restart the app.";
  }
  if (/\bP2021\b|\bP2022\b|\b42P01\b|\b42703\b/.test(text)) {
    return "Database tables are missing or outdated. Run npm run db:deploy, then restart the app.";
  }
  if (
    /\bP1001\b|\bP1002\b|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN/.test(text)
  ) {
    return "Cannot reach the database. Check DATABASE_URL and your network connection, then try again.";
  }
  return "Authentication is unavailable. Check the database connection and migrations.";
}
