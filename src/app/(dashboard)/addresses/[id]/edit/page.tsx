import { requireUser } from "@/lib/auth";
import { database } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AddressForm } from "@/components/addresses/address-form";
export default async function Edit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser(),
    { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const a = await database().address.findFirst({
    where: { id, userId: user.id },
  });
  if (!a) notFound();
  const initial = {
    ...a,
    companyName: a.companyName ?? "",
    email: a.email ?? "",
    alternatePhone: a.alternatePhone ?? "",
    addressLine2: a.addressLine2 ?? "",
    landmark: a.landmark ?? "",
    notes: a.notes ?? "",
  };
  return <AddressForm initial={initial} id={id} />;
}
