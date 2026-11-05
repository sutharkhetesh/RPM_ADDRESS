import { redirect } from "next/navigation";
import { AddressBook } from "@/components/addresses/address-book";
import type { SearchParams } from "@/lib/address-query";

export default async function Addresses({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  if (!params.filter) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") query.set(key, value);
    }
    redirect(query.size ? `/dashboard?${query}` : "/dashboard");
  }
  return <AddressBook params={params} />;
}
