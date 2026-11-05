import { AddressForm } from "@/components/addresses/address-form";
import { type SearchParams } from "@/lib/address-query";
import { emptyAddress } from "@/lib/validations/address";

export default async function New({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { type } = await searchParams;
  const addressType =
    type === "shipping" ? "SHIPPING" : type === "billing" ? "BILLING" : "BOTH";
  return (
    <AddressForm key={addressType} initial={{ ...emptyAddress, addressType }} />
  );
}
