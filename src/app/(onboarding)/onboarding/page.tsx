export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { database } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AddressSetup } from "@/components/addresses/address-setup";
import { emptyAddress, type AddressInput } from "@/lib/validations/address";
export default async function Onboarding() {
  const user = await requireUser();
  if (user.onboardingCompletedAt) redirect("/dashboard");
  const rows = await database().address.findMany({
    where: { userId: user.id },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const shipping =
    rows.find((a) => a.isDefaultShipping) ??
    rows.find((a) => a.addressType !== "BILLING");
  const billing =
    rows.find((a) => a.isDefaultBilling) ??
    rows.find((a) => a.addressType !== "SHIPPING");
  function initial(
    a: typeof shipping,
    type: "SHIPPING" | "BILLING",
  ): AddressInput {
    return {
      ...emptyAddress,
      fullName: user.fullName,
      email: user.email,
      ...(a
        ? {
            fullName: a.fullName,
            companyName: a.companyName ?? "",
            email: a.email ?? user.email,
            phone: a.phone,
            alternatePhone: a.alternatePhone ?? "",
            addressLine1: a.addressLine1,
            addressLine2: a.addressLine2 ?? "",
            landmark: a.landmark ?? "",
            city: a.city,
            state: a.state,
            country: a.country,
            postalCode: a.postalCode,
            addressLabel: a.addressLabel,
            notes: a.notes ?? "",
          }
        : {}),
      addressType: type,
      isDefaultShipping: type === "SHIPPING",
      isDefaultBilling: type === "BILLING",
    };
  }
  return (
    <AddressSetup
      shippingInitial={initial(shipping, "SHIPPING")}
      billingInitial={initial(billing, "BILLING")}
    />
  );
}
