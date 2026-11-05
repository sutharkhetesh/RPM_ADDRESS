import { existsSync } from "node:fs";
import { resolve } from "node:path";

/** Shared by the driver, migrations and diagnostics. @param {string} connection */
export function databaseUrl(connection) {
  const url = new URL(connection);
  const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(
    url.hostname,
  );
  if (!local) {
    url.searchParams.set("sslmode", "verify-full");
    const caPath = "certs/supabase-ca.crt";
    if (existsSync(caPath))
      url.searchParams.set("sslrootcert", resolve(caPath));
  }
  return url.toString();
}
