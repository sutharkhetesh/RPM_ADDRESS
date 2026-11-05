export const printFormats = {
  a4: { label: "A4 document", width: 210, height: 297, margin: 20, font: 12 },
  shipping: {
    label: "4 × 6 inch label",
    width: 101.6,
    height: 152.4,
    margin: 9,
    font: 11,
  },
  compact: {
    label: "Compact label",
    width: 100,
    height: 75,
    margin: 6,
    font: 9,
  },
} as const;
export type PrintFormat = keyof typeof printFormats;
export type PrintableAddress = {
  fullName: string;
  companyName: string | null;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  alternatePhone: string | null;
  email: string | null;
};
export function addressLines(a: PrintableAddress, billing: boolean) {
  return [
    a.fullName,
    a.companyName,
    a.addressLine1,
    a.addressLine2,
    a.landmark,
    `${a.city}, ${a.state} - ${a.postalCode}`,
    a.country,
    `Phone: ${a.phone}`,
    a.alternatePhone && `Alternate: ${a.alternatePhone}`,
    billing && a.email,
  ].filter((s): s is string => typeof s === "string" && s.length > 0);
}
