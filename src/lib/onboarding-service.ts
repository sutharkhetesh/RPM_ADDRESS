import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { addressSchema } from "@/lib/validations/address";
export const onboardingSchema = z
  .object({
    shipping: addressSchema,
    billing: addressSchema.optional(),
    sameAsShipping: z.boolean(),
  })
  .refine((v) => v.sameAsShipping || Boolean(v.billing), {
    path: ["billing"],
    message: "Enter a billing address",
  });
export async function completeAddressSetup(
  db: PrismaClient,
  userId: string,
  input: unknown,
) {
  const data = onboardingSchema.parse(input);
  const shipping = addressSchema.parse({
    ...data.shipping,
    addressType: "SHIPPING",
    isDefaultShipping: true,
    isDefaultBilling: false,
  });
  const billing = addressSchema.parse({
    ...(data.sameAsShipping ? shipping : data.billing),
    addressType: "BILLING",
    isDefaultShipping: false,
    isDefaultBilling: true,
  });
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId},0))`;
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { onboardingCompletedAt: true },
    });
    if (user.onboardingCompletedAt) return;
    await tx.address.updateMany({
      where: { userId },
      data: { isDefaultShipping: false, isDefaultBilling: false },
    });
    await tx.address.create({ data: { ...shipping, userId } });
    await tx.address.create({ data: { ...billing, userId } });
    await tx.user.update({
      where: { id: userId },
      data: { onboardingCompletedAt: new Date() },
    });
  });
}
