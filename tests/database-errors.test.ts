import { describe, it, expect } from "vitest";
import { authenticationFailure } from "@/lib/database-errors";
describe("Safe authentication diagnostics", () => {
  it("reports the observed TLS failure", () => {
    expect(
      authenticationFailure(
        Object.assign(
          new Error("self-signed certificate in certificate chain"),
          { code: "SELF_SIGNED_CERT_IN_CHAIN" },
        ),
      ),
    ).toContain("sslrootcert");
  });
  it("finds TLS failures wrapped by the Prisma pg adapter", () => {
    expect(
      authenticationFailure({
        meta: {
          driverAdapterError: {
            cause: { originalCode: "SELF_SIGNED_CERT_IN_CHAIN" },
          },
        },
      }),
    ).toContain("TLS verification failed");
  });
  it("identifies missing tables separately from authentication failures", () => {
    expect(authenticationFailure({ code: "P2021" })).toContain(
      "npm run db:deploy",
    );
  });
  it("does not echo credentials, SQL or arbitrary errors", () => {
    const secret = "postgresql://user:private-password@example.test/postgres";
    expect(authenticationFailure(new Error(secret))).not.toContain(secret);
    expect(
      authenticationFailure({ code: "ECONNREFUSED", message: secret }),
    ).not.toContain(secret);
  });
  it("handles circular and unknown errors safely", () => {
    const error: { cause?: unknown } = {};
    error.cause = error;
    expect(authenticationFailure(error)).toContain(
      "Authentication is unavailable",
    );
    expect(authenticationFailure(null)).toContain(
      "Authentication is unavailable",
    );
  });
});
