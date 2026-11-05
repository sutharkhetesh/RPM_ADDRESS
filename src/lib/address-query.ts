import type { Prisma } from "@/generated/prisma/client";
export type SearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) =>
  typeof v === "string" ? v : "";
export function addressQuery(params: SearchParams, userId: string) {
  const q = one(params.q).trim().slice(0, 200),
    filter = one(params.filter),
    sort = one(params.sort) || "newest";
  const size = Number(one(params.size));
  const pageSize = [10, 20, 50].includes(size) ? size : 10;
  const raw = Number(one(params.page));
  const page = Number.isSafeInteger(raw) && raw > 0 ? Math.min(raw, 100000) : 1;
  const where: Prisma.AddressWhereInput = { userId };
  if (q)
    where.OR = [
      "fullName",
      "phone",
      "alternatePhone",
      "email",
      "companyName",
      "city",
      "state",
      "country",
      "postalCode",
      "addressLine1",
      "addressLine2",
      "landmark",
    ].map((field) => ({ [field]: { contains: q, mode: "insensitive" } }));
  if (filter === "shipping") where.addressType = { in: ["SHIPPING", "BOTH"] };
  if (filter === "billing") where.addressType = { in: ["BILLING", "BOTH"] };
  if (filter === "default")
    where.AND = [
      { OR: [{ isDefaultShipping: true }, { isDefaultBilling: true }] },
    ];
  if (["home", "office", "other"].includes(filter))
    where.addressLabel = filter.toUpperCase() as "HOME" | "OFFICE" | "OTHER";
  const orders: Record<string, Prisma.AddressOrderByWithRelationInput> = {
    newest: { createdAt: "desc" },
    oldest: { createdAt: "asc" },
    "name-asc": { fullName: "asc" },
    "name-desc": { fullName: "desc" },
    city: { city: "asc" },
  };
  return {
    q,
    filter,
    sort,
    page,
    pageSize,
    where,
    orderBy: [orders[sort] ?? orders.newest, { id: "asc" } as const],
  };
}
