import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  it,
  expect,
  inject,
} from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { saveForUser, deleteForUser } from "@/lib/address-service";
import { addressQuery } from "@/lib/address-query";
import { emptyAddress } from "@/lib/validations/address";
const owner = crypto.randomUUID(),
  other = crypto.randomUUID();
const input = {
  ...emptyAddress,
  fullName: "Aarav Sharma",
  phone: "9876543210",
  addressLine1: "12 Garden Road",
  city: "Mumbai",
  state: "Maharashtra",
  postalCode: "400001",
  addressType: "BOTH" as const,
};
let db: PrismaClient;
beforeAll(async () => {
  db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: inject("databaseUrl"), max: 8 }),
  });
  await db.user.createMany({
    data: [
      { id: owner, email: "address-owner@example.test", fullName: "Owner" },
      { id: other, email: "address-other@example.test", fullName: "Other" },
    ],
  });
});
beforeEach(async () => {
  await db.address.deleteMany({ where: { userId: { in: [owner, other] } } });
});
afterAll(async () => {
  await db.$disconnect();
});
describe("Real PostgreSQL address lifecycle", () => {
  it("persists, reads, updates and deletes an address", async () => {
    const a = await saveForUser(db, owner, input);
    expect(
      (await db.address.findFirst({ where: { id: a.id, userId: owner } }))
        ?.fullName,
    ).toBe(input.fullName);
    await saveForUser(db, owner, { ...input, city: "Pune" }, a.id);
    expect((await db.address.findUnique({ where: { id: a.id } }))?.city).toBe(
      "Pune",
    );
    await deleteForUser(db, owner, a.id);
    expect(await db.address.count({ where: { userId: owner } })).toBe(0);
  });
  it("rejects cross-user updates and deletes", async () => {
    const a = await saveForUser(db, owner, input);
    await expect(saveForUser(db, other, input, a.id)).rejects.toThrow(
      "Address not found",
    );
    await expect(deleteForUser(db, other, a.id)).rejects.toThrow(
      "Address not found",
    );
    expect(await db.address.findUnique({ where: { id: a.id } })).not.toBeNull();
  });
  it("excludes another user from search, print and export ownership lookup", async () => {
    await saveForUser(db, other, input);
    const a = await saveForUser(db, owner, {
      ...input,
      fullName: "Owner",
    });
    const q = addressQuery({ q: "MUMBAI" }, owner);
    const rows = await db.address.findMany({ where: q.where });
    expect(rows.map((a) => a.fullName)).toEqual(["Owner"]);
    expect(
      await db.address.findFirst({ where: { id: a.id, userId: other } }),
    ).toBeNull();
  });
  it("keeps shipping and billing defaults independent", async () => {
    const a = await saveForUser(db, owner, {
      ...input,
      isDefaultShipping: true,
      isDefaultBilling: true,
    });
    const b = await saveForUser(db, owner, {
      ...input,
      isDefaultShipping: true,
    });
    expect(await db.address.findUnique({ where: { id: a.id } })).toMatchObject({
      isDefaultShipping: false,
      isDefaultBilling: true,
    });
    expect(await db.address.findUnique({ where: { id: b.id } })).toMatchObject({
      isDefaultShipping: true,
      isDefaultBilling: false,
    });
  });
  it("serializes simultaneous default changes", async () => {
    await Promise.all(
      Array.from({ length: 6 }, (_, i) =>
        saveForUser(db, owner, {
          ...input,
          fullName: `Person ${i}`,
          isDefaultShipping: true,
          isDefaultBilling: true,
        }),
      ),
    );
    expect(
      await db.address.count({
        where: {
          userId: owner,

          isDefaultShipping: true,
        },
      }),
    ).toBe(1);
    expect(
      await db.address.count({
        where: { userId: owner, isDefaultBilling: true },
      }),
    ).toBe(1);
  });
  it("preserves defaults if update validation fails", async () => {
    const a = await saveForUser(db, owner, {
      ...input,
      isDefaultShipping: true,
    });
    await expect(
      saveForUser(db, owner, {
        ...input,
        fullName: "",
        isDefaultShipping: true,
      }),
    ).rejects.toThrow();
    expect(
      (await db.address.findUnique({ where: { id: a.id } }))?.isDefaultShipping,
    ).toBe(true);
  });
  it("enforces default uniqueness at database level", async () => {
    await saveForUser(db, owner, {
      ...input,
      isDefaultShipping: true,
    });
    await expect(
      db.address.create({
        data: {
          ...input,
          userId: owner,

          isDefaultShipping: true,
        },
      }),
    ).rejects.toThrow();
  });
  it("does not unset another user's default", async () => {
    await saveForUser(db, other, {
      ...input,
      isDefaultShipping: true,
    });
    await saveForUser(db, owner, {
      ...input,
      isDefaultShipping: true,
    });
    expect(
      await db.address.count({
        where: { userId: { in: [owner, other] }, isDefaultShipping: true },
      }),
    ).toBe(2);
  });
  it("combines search, BOTH filtering and stable pagination", async () => {
    await saveForUser(db, owner, input);
    await saveForUser(db, owner, {
      ...input,
      fullName: "Zara",
      city: "Delhi",
      postalCode: "110001",
    });
    const q = addressQuery(
      { q: "mumbai", filter: "billing", sort: "name-asc", size: "10" },
      owner,
    );
    const rows = await db.address.findMany({
      where: q.where,
      orderBy: q.orderBy,
      take: q.pageSize,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].fullName).toBe(input.fullName);
  });
  it("cascades account deletion to addresses", async () => {
    const temp = crypto.randomUUID();
    await db.user.create({
      data: {
        id: temp,
        email: `${temp}@example.test`,
        fullName: "Temporary User",
      },
    });
    await saveForUser(db, temp, input);
    await db.user.delete({ where: { id: temp } });
    expect(await db.address.count({ where: { userId: temp } })).toBe(0);
  });
  it("denies Data API roles direct access to private addresses", async () => {
    await saveForUser(db, owner, input);
    await expect(
      db.$transaction(async (tx) => {
        await tx.$executeRaw`SET LOCAL ROLE authenticated`;
        return tx.address.findMany();
      }),
    ).rejects.toThrow();
  });
});
