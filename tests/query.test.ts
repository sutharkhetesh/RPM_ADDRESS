import { describe, it, expect } from "vitest";
import { addressQuery } from "@/lib/address-query";
describe("Scoped search and pagination", () => {
  const userId = crypto.randomUUID();
  it("always scopes reads to the server user", () => {
    expect(
      addressQuery({ userId: crypto.randomUUID() }, userId).where.userId,
    ).toBe(userId);
  });
  it("combines text search and default filter without replacing either", () => {
    const q = addressQuery({ q: "  Mumbai ", filter: "default" }, userId);
    expect(q.where.OR).toHaveLength(12);
    expect(q.where.AND).toEqual([
      { OR: [{ isDefaultShipping: true }, { isDefaultBilling: true }] },
    ]);
    expect(q.q).toBe("Mumbai");
  });
  it.each(["shipping", "billing"])(
    "includes BOTH in %s filtering",
    (filter) => {
      expect(addressQuery({ filter }, userId).where.addressType).toEqual({
        in: [filter.toUpperCase(), "BOTH"],
      });
    },
  );
  it("clamps pagination and invalid page sizes", () => {
    expect(addressQuery({ page: "-1", size: "100000" }, userId)).toMatchObject({
      page: 1,
      pageSize: 10,
    });
    expect(addressQuery({ page: "2", size: "50" }, userId)).toMatchObject({
      page: 2,
      pageSize: 50,
    });
  });
  it("handles arrays and unknown sort keys safely", () => {
    expect(
      addressQuery({ q: ["x"], sort: "DROP TABLE" }, userId).orderBy,
    ).toEqual([{ createdAt: "desc" }, { id: "asc" }]);
  });
});
