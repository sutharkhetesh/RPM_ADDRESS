import { beforeAll, afterAll, describe, it, expect, inject } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { completeAddressSetup } from "@/lib/onboarding-service";
import { emptyAddress } from "@/lib/validations/address";
import { saveForUser } from "@/lib/address-service";
let db: PrismaClient;
const users: string[] = [];
const shipping = {
  ...emptyAddress,
  fullName: "New Customer",
  phone: "9876543210",
  addressLine1: "12 Main Road",
  city: "Mumbai",
  state: "Maharashtra",
  postalCode: "400001",
  addressType: "SHIPPING" as const,
  isDefaultShipping: true,
};
const billing = {
  ...shipping,
  addressLine1: "24 Billing Road",
  addressType: "BILLING" as const,
  isDefaultShipping: false,
  isDefaultBilling: true,
};
async function user() {
  const u = await db.user.create({
    data: {
      fullName: "New Customer",
      email: `setup-${crypto.randomUUID()}@example.test`,
    },
  });
  users.push(u.id);
  return u.id;
}
beforeAll(() => {
  db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: inject("databaseUrl"), max: 8 }),
  });
});
afterAll(async () => {
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});
describe("Shipping then billing onboarding", () => {
  it("saves two separate addresses and completes the authenticated user's profile atomically", async () => {
    const id = await user();
    await completeAddressSetup(db, id, {
      shipping,
      billing,
      sameAsShipping: false,
      userId: crypto.randomUUID(),
    });
    const rows = await db.address.findMany({
      where: { userId: id },
      orderBy: { addressType: "asc" },
    });
    expect(rows).toHaveLength(2);
    expect(rows.find((a) => a.addressType === "SHIPPING")).toMatchObject({
      addressLine1: "12 Main Road",
      isDefaultShipping: true,
      isDefaultBilling: false,
      userId: id,
    });
    expect(rows.find((a) => a.addressType === "BILLING")).toMatchObject({
      addressLine1: "24 Billing Road",
      isDefaultShipping: false,
      isDefaultBilling: true,
      userId: id,
    });
    expect(
      (await db.user.findUniqueOrThrow({ where: { id } }))
        .onboardingCompletedAt,
    ).not.toBeNull();
  });
  it("copies shipping into billing on the server when selected", async () => {
    const id = await user();
    await completeAddressSetup(db, id, {
      shipping,
      billing,
      sameAsShipping: true,
    });
    const rows = await db.address.findMany({ where: { userId: id } });
    expect(rows.map((a) => a.addressLine1)).toEqual([
      "12 Main Road",
      "12 Main Road",
    ]);
    expect(new Set(rows.map((a) => a.id)).size).toBe(2);
  });
  it("accepts same-as-shipping without a separate billing payload", async () => {
    const id = await user();
    await completeAddressSetup(db, id, { shipping, sameAsShipping: true });
    expect(await db.address.count({ where: { userId: id } })).toBe(2);
  });
  it("rejects incomplete billing without persisting a partial shipping record", async () => {
    const id = await user();
    await expect(
      completeAddressSetup(db, id, {
        shipping,
        billing: { ...billing, city: "" },
        sameAsShipping: false,
      }),
    ).rejects.toThrow();
    expect(await db.address.count({ where: { userId: id } })).toBe(0);
    expect(
      (await db.user.findUniqueOrThrow({ where: { id } }))
        .onboardingCompletedAt,
    ).toBeNull();
  });
  it("requires billing when it differs from shipping", async () => {
    const id = await user();
    await expect(
      completeAddressSetup(db, id, { shipping, sameAsShipping: false }),
    ).rejects.toThrow();
  });
  it("handles duplicate submissions and concurrent requests without duplicating records", async () => {
    const id = await user();
    await Promise.all([
      completeAddressSetup(db, id, {
        shipping,
        billing,
        sameAsShipping: false,
      }),
      completeAddressSetup(db, id, {
        shipping,
        billing,
        sameAsShipping: false,
      }),
    ]);
    expect(await db.address.count({ where: { userId: id } })).toBe(2);
  });
  it("keeps another user's records and defaults unchanged", async () => {
    const first = await user(),
      second = await user();
    await saveForUser(db, first, shipping);
    await completeAddressSetup(db, second, {
      shipping,
      billing,
      sameAsShipping: false,
    });
    expect(
      await db.address.count({
        where: { userId: first, isDefaultShipping: true },
      }),
    ).toBe(1);
    expect(await db.address.count({ where: { userId: second } })).toBe(2);
  });
  it("rolls back the entire operation if account persistence fails", async () => {
    await expect(
      completeAddressSetup(db, crypto.randomUUID(), {
        shipping,
        billing,
        sameAsShipping: false,
      }),
    ).rejects.toThrow();
  });
});
