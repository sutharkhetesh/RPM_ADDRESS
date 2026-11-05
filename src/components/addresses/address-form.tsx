"use client";
import { useEffect, useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { unstable_rethrow, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, LoaderCircle, Check, Tags } from "lucide-react";
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
  const submitting = useRef(false);
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
        noValidate
        aria-busy={pending}
        onSubmit={form.handleSubmit((data) =>
          start(async () => {
            if (submitting.current) return;
            submitting.current = true;
            try {
              const result = await saveAddress(data, id);
              if (!result.success) {
                toast.error(result.error);
                return;
              }
              toast.success(id ? "Address updated" : "Address added");
              router.push("/dashboard");
              router.refresh();
            } catch (error) {
              unstable_rethrow(error);
              toast.error(
                "Unable to save. Check your connection and try again.",
              );
            } finally {
              submitting.current = false;
            }
          }),
        )}
      >
        <fieldset disabled={pending} className="address-fieldset">
          <legend className="sr-only">Address information</legend>
          <section className="form-section">
            <div className="section-label">
              <Tags size={19} />
              <div>
                <h2>Address type</h2>
                <p>Choose how you’ll use this address.</p>
              </div>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="address-type">Address type</label>
                <select id="address-type" {...form.register("addressType")}>
                  <option value="SHIPPING">Shipping</option>
                  <option value="BILLING">Billing</option>
                  <option value="BOTH">Shipping & billing</option>
                </select>
              </div>
            </div>
          </section>
          <AddressFields form={form} />
        </fieldset>
        <div className="form-footer">
          <p>* Required fields</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              type="button"
              disabled={pending}
              onClick={() => router.push("/dashboard")}
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
