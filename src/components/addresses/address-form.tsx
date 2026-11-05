"use client";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, LoaderCircle, Check } from "lucide-react";
import {
  addressSchema,
  emptyAddress,
  type AddressInput,
} from "@/lib/validations/address";
import { saveAddress } from "@/actions/address.actions";
import { Button } from "@/components/ui/button";
import { AddressFields } from "./address-fields";
export function AddressForm({
  initial,
  id,
}: {
  initial?: AddressInput;
  id?: string;
}) {
  const router = useRouter(),
    [pending, start] = useTransition();
  const form = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: initial ?? emptyAddress,
  });
  const type = form.watch("addressType");
  useEffect(() => {
    if (type === "BILLING") form.setValue("isDefaultShipping", false);
    if (type === "SHIPPING") form.setValue("isDefaultBilling", false);
  }, [type, form]);
  return (
    <>
      <Link href="/addresses" className="back-link">
        <ArrowLeft size={15} />
        Back to addresses
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">RPM EYEWEAR · YOUR ADDRESS BOOK</span>
          <h1>{id ? "Edit address" : "Add an address."}</h1>
          <p>Keep your shipping and billing details up to date.</p>
        </div>
      </div>
      <form
        className="address-form"
        onSubmit={form.handleSubmit((data) =>
          start(async () => {
            const result = await saveAddress(data, id);
            if (!result.success) {
              toast.error(result.error);
              return;
            }
            toast.success(id ? "Address updated" : "Address added");
            router.push("/addresses");
            router.refresh();
          }),
        )}
      >
        <AddressFields form={form} />
        <section className="form-section">
          <h2 className="font-semibold mb-5">Address preferences</h2>
          <div className="form-grid">
            <label className="field">
              Address type
              <select {...form.register("addressType")}>
                <option value="SHIPPING">Shipping</option>
                <option value="BILLING">Billing</option>
                <option value="BOTH">Shipping & billing</option>
              </select>
            </label>
            <label className="field">
              Address label
              <select {...form.register("addressLabel")}>
                <option value="HOME">Home</option>
                <option value="OFFICE">Office</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
          </div>
          <div className="default-options">
            <label>
              <input
                type="checkbox"
                {...form.register("isDefaultShipping")}
                disabled={type === "BILLING"}
              />
              Set as default shipping address
            </label>
            <label>
              <input
                type="checkbox"
                {...form.register("isDefaultBilling")}
                disabled={type === "SHIPPING"}
              />
              Set as default billing address
            </label>
          </div>
        </section>
        <div className="form-footer">
          <p>* Required fields</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push("/addresses")}
            >
              Cancel
            </Button>
            <Button disabled={pending}>
              {pending ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}{" "}
              {id ? "Save changes" : "Save address"}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
