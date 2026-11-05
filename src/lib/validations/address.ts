import { z } from "zod";
const optional = (max: number) => z.string().trim().max(max);
const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{7,24}$/, "Enter a valid phone number")
  .refine((v) => {
    const digits = v.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
  }, "Use 7–15 digits");
export const addressSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter a full name").max(120),
    companyName: optional(160),
    email: z.union([z.literal(""), z.email()]).transform((v) => v.trim()),
    phone,
    alternatePhone: z.union([z.literal(""), phone]),
    addressLine1: z.string().trim().min(3, "Enter a street address").max(250),
    addressLine2: optional(250),
    landmark: optional(160),
    city: z.string().trim().min(1).max(100),
    state: z.string().trim().min(1).max(100),
    country: z.string().trim().min(1).max(100),
    postalCode: z
      .string()
      .trim()
      .min(2)
      .max(20)
      .regex(/^[a-zA-Z0-9 -]+$/, "Enter a valid postal code"),
    addressType: z.enum(["SHIPPING", "BILLING", "BOTH"]),
    addressLabel: z.enum(["HOME", "OFFICE", "OTHER"]),
    isDefaultShipping: z.boolean(),
    isDefaultBilling: z.boolean(),
    notes: optional(2000),
  })
  .superRefine((v, ctx) => {
    if (
      v.country.toLowerCase() === "india" &&
      !/^[1-9][0-9]{5}$/.test(v.postalCode)
    )
      ctx.addIssue({
        code: "custom",
        path: ["postalCode"],
        message: "Enter a valid 6-digit Indian PIN",
      });
    if (v.isDefaultShipping && v.addressType === "BILLING")
      ctx.addIssue({
        code: "custom",
        path: ["isDefaultShipping"],
        message: "Billing-only addresses cannot be shipping defaults",
      });
    if (v.isDefaultBilling && v.addressType === "SHIPPING")
      ctx.addIssue({
        code: "custom",
        path: ["isDefaultBilling"],
        message: "Shipping-only addresses cannot be billing defaults",
      });
  });
export type AddressInput = z.input<typeof addressSchema>;
export const emptyAddress: AddressInput = {
  fullName: "",
  companyName: "",
  email: "",
  phone: "",
  alternatePhone: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  country: "India",
  postalCode: "",
  addressType: "BOTH",
  addressLabel: "HOME",
  isDefaultShipping: false,
  isDefaultBilling: false,
  notes: "",
};
