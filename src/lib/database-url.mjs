import { readFileSync } from "node:fs";
import {
  getDefaultAutoSelectFamilyAttemptTimeout,
  setDefaultAutoSelectFamilyAttemptTimeout,
} from "node:net";
import { resolve } from "node:path";

/** Shared by the driver, migrations and diagnostics. @param {string} connection */
export function databaseUrl(connection) {
  const url = new URL(connection);
  const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(
    url.hostname,
  );
  if (!local) {
    url.searchParams.set("sslmode", "verify-full");
    // Cross-region connections may need longer than Node's 250 ms per address.
    if (getDefaultAutoSelectFamilyAttemptTimeout() < 2000)
      setDefaultAutoSelectFamilyAttemptTimeout(2000);
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
          ...(caPath && caPath !== "system"
            ? { ca: readFileSync(resolve(caPath), "utf8") }
            : {}),
        },
    enableChannelBinding: url.searchParams.get("channel_binding") === "require",
  };
}
