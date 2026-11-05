import type { PrismaClient } from "@/generated/prisma/client";
import { addressSchema } from "@/lib/validations/address";
import { z } from "zod";
export async function saveForUser(
  db: PrismaClient,
  userId: string,
  input: unknown,
  id?: string,
) {
  const data = addressSchema.parse(input);
  if (id) z.uuid().parse(id);
  return db.$transaction(async (tx) => {
    // Serialize address defaults and onboarding saves for this user.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId},0))`;
    if (
      id &&
      !(await tx.address.findFirst({
        where: { id, userId },
        select: { id: true },
      }))
    )
      throw new Error("Address not found");
    if (data.isDefaultShipping)
      await tx.address.updateMany({
        where: { userId, isDefaultShipping: true },
        data: { isDefaultShipping: false },
      });
    if (data.isDefaultBilling)
      await tx.address.updateMany({
        where: { userId, isDefaultBilling: true },
        data: { isDefaultBilling: false },
      });
    return id
      ? tx.address.update({ where: { id, userId }, data })
      : tx.address.create({ data: { ...data, userId } });
  });
}
export async function deleteForUser(
  db: PrismaClient,
  userId: string,
  id: string,
) {
  z.uuid().parse(id);
  const result = await db.address.deleteMany({
    where: { id, userId },
  });
  if (!result.count) throw new Error("Address not found");
}
