import { existsSync, readFileSync } from "node:fs";
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
    if (!url.searchParams.has("sslrootcert") && existsSync(caPath))
      url.searchParams.set("sslrootcert", resolve(caPath));
  }
  return url.toString();
}

/** Keep runtime TLS verification consistent with migration connections. */
export function databasePoolConfig(connection) {
  const url = new URL(databaseUrl(connection));
  const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(
    url.hostname,
  );
  const caPath = url.searchParams.get("sslrootcert");
  url.searchParams.delete("sslmode");
  url.searchParams.delete("sslrootcert");
  return {
    connectionString: url.toString(),
    ssl: local
      ? undefined
      : {
          rejectUnauthorized: true,
          ...(caPath ? { ca: readFileSync(resolve(caPath), "utf8") } : {}),
        },
  };
}
