import { describe, it, expect } from "vitest";
import { addressLines } from "@/lib/print";
const address = {
  fullName: "Aarav Sharma",
  companyName: null,
  addressLine1: "12 Garden Road",
  addressLine2: null,
  landmark: null,
  city: "Mumbai",
  state: "Maharashtra",
  postalCode: "400001",
  country: "India",
  phone: "9876543210",
  alternatePhone: null,
  email: "aarav@example.test",
};
describe("Print and export address content", () => {
  it("omits absent fields without blank or false lines", () => {
    expect(addressLines(address, false)).toEqual([
      "Aarav Sharma",
      "12 Garden Road",
      "Mumbai, Maharashtra - 400001",
      "India",
      "Phone: 9876543210",
    ]);
  });
  it("includes billing email and optional contact/address details", () => {
    const lines = addressLines(
      {
        ...address,
        companyName: "Garden Studio",
        addressLine2: "Second floor",
        landmark: "Near park",
        alternatePhone: "9876543211",
      },
      true,
    );
    expect(lines).toContain("Garden Studio");
    expect(lines).toContain("Second floor");
    expect(lines).toContain("Near park");
    expect(lines).toContain("Alternate: 9876543211");
    expect(lines.at(-1)).toBe(address.email);
  });
});
