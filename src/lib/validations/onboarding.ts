import { z } from "zod";
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
