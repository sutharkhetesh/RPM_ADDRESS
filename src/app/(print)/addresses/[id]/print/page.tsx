export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { database } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AddressPrint } from "@/components/addresses/address-print";
export default async function Print({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ download?: string }>;
}) {
  const user = await requireUser(),
    { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const a = await database().address.findFirst({
    where: { id, userId: user.id },
  });
  if (!a) notFound();
  const address = {
    fullName: a.fullName,
    companyName: a.companyName,
    addressLine1: a.addressLine1,
    addressLine2: a.addressLine2,
    landmark: a.landmark,
    city: a.city,
    state: a.state,
    postalCode: a.postalCode,
    country: a.country,
    phone: a.phone,
    alternatePhone: a.alternatePhone,
    email: a.email,
  };
  return (
    <AddressPrint
      address={address}
      type={a.addressType}
      download={(await searchParams).download === "1"}
    />
  );
}
