import { describe, it, expect } from "vitest";
import { addressSchema, emptyAddress } from "@/lib/validations/address";
const valid = {
  ...emptyAddress,
  fullName: "Aarav Sharma",
  addressType: "SHIPPING" as const,
  phone: "+91 98765 43210",
  addressLine1: "12 Garden Road",
  city: "Mumbai",
  state: "Maharashtra",
  postalCode: "400001",
};
describe("Address validation", () => {
  it("accepts valid Indian addresses and removes client identity fields", () => {
    expect(
      addressSchema.parse({ ...valid, userId: crypto.randomUUID() }),
    ).not.toHaveProperty("userId");
  });
  it("rejects missing required fields", () => {
    expect(addressSchema.safeParse(emptyAddress).success).toBe(false);
  });
  it.each(["000000", "12345", "4000017", "ABCDEF"])(
    "rejects invalid Indian PIN %s",
    (postalCode) => {
      expect(addressSchema.safeParse({ ...valid, postalCode }).success).toBe(
        false,
      );
    },
  );
  it("supports international postal codes", () => {
    expect(
      addressSchema.safeParse({
        ...valid,
        country: "United Kingdom",
        postalCode: "SW1A 1AA",
      }).success,
    ).toBe(true);
  });
  it("rejects invalid optional contact fields", () => {
    expect(addressSchema.safeParse({ ...valid, email: "broken" }).success).toBe(
      false,
    );
    expect(
      addressSchema.safeParse({ ...valid, alternatePhone: "abcdefg" }).success,
    ).toBe(false);
  });
  it("trims optional email addresses before validating", () => {
    expect(
      addressSchema.parse({ ...valid, email: "  contact@example.test  " })
        .email,
    ).toBe("contact@example.test");
    expect(addressSchema.parse({ ...valid, email: "   " }).email).toBe("");
  });
  it("rejects conflicting default types", () => {
    expect(
      addressSchema.safeParse({
        ...valid,
        addressType: "BILLING",
        isDefaultShipping: true,
      }).success,
    ).toBe(false);
    expect(
      addressSchema.safeParse({ ...valid, isDefaultBilling: true }).success,
    ).toBe(false);
  });
  it("allows both defaults for a BOTH address", () => {
    expect(
      addressSchema.safeParse({
        ...valid,
        addressType: "BOTH",
        isDefaultShipping: true,
        isDefaultBilling: true,
      }).success,
    ).toBe(true);
  });
  it("limits unbounded input", () => {
    expect(
      addressSchema.safeParse({ ...valid, notes: "x".repeat(2001) }).success,
    ).toBe(false);
  });
});
