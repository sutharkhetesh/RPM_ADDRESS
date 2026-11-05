"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Truck,
  ReceiptText,
  Check,
  ArrowLeft,
  ArrowRight,
  LoaderCircle,
  LogOut,
} from "lucide-react";
import { addressSchema, type AddressInput } from "@/lib/validations/address";
import { AddressFields } from "./address-fields";
import { RpmBrand } from "@/components/rpm-brand";
import { Button } from "@/components/ui/button";
import { finishAddressSetup } from "@/actions/onboarding.actions";
import { signOut } from "@/actions/auth.actions";
export function AddressSetup({
  shippingInitial,
  billingInitial,
}: {
  shippingInitial: AddressInput;
  billingInitial: AddressInput;
}) {
  const [step, setStep] = useState<1 | 2>(1),
    [same, setSame] = useState(false),
    [message, setMessage] = useState(""),
    [pending, start] = useTransition();
  const shipping = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: shippingInitial,
  });
  const billing = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: billingInitial,
  });
  const submitting = useRef(false);
  const previousBilling = useRef<AddressInput | null>(null);
  const stepTitle = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    stepTitle.current?.focus({ preventScroll: true });
  }, [step]);
  function copyShipping() {
    billing.reset({
      ...shipping.getValues(),
      addressType: "BILLING",
      isDefaultShipping: false,
      isDefaultBilling: true,
    });
  }
  function save() {
    start(async () => {
      if (submitting.current) return;
      submitting.current = true;
      setMessage("");
      try {
        const result = await finishAddressSetup({
          shipping: shipping.getValues(),
          billing: billing.getValues(),
          sameAsShipping: same,
        });
        if (result?.error) setMessage(result.error);
      } catch (error) {
        unstable_rethrow(error);
        setMessage("Unable to save. Check your connection and try again.");
      } finally {
        submitting.current = false;
      }
    });
  }
  return (
    <div className="onboarding-page">
      <header className="onboarding-header">
        <RpmBrand />
        <form action={signOut}>
          <Button variant="ghost" size="sm">
            <LogOut size={15} />
            Sign out
          </Button>
        </form>
      </header>
      <main className="onboarding-main">
        <span className="eyebrow">YOUR ACCOUNT IS READY</span>
        <h1>Let’s get your addresses set up.</h1>
        <p className="onboarding-subtitle">
          Add your shipping address, then your billing address. Both are saved
          securely to your account.
        </p>
        <ol className="onboarding-steps" aria-label="Address setup progress">
          <li
            className={step === 1 ? "current" : "complete"}
            aria-current={step === 1 ? "step" : undefined}
          >
            <span>
              {step === 1 ? <Truck size={17} /> : <Check size={17} />}
            </span>
            Shipping address
          </li>
          <li
            className={step === 2 ? "current" : ""}
            aria-current={step === 2 ? "step" : undefined}
          >
            <span>
              <ReceiptText size={17} />
            </span>
            Billing address
          </li>
        </ol>
        <h2 ref={stepTitle} className="onboarding-step-title" tabIndex={-1}>
          {step === 1
            ? "Add your shipping address"
            : "Add your billing address"}
        </h2>
        {step === 1 ? (
          <form
            onSubmit={shipping.handleSubmit(() => {
              if (same) copyShipping();
              setStep(2);
              setMessage("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            })}
            noValidate
          >
            <AddressFields form={shipping} prefix="shipping" />
            <div className="onboarding-footer">
              <span>* Required fields</span>
              <Button type="submit">
                Continue to billing
                <ArrowRight size={16} />
              </Button>
            </div>
          </form>
        ) : (
          <form
            aria-busy={pending}
            onSubmit={async (e) => {
              e.preventDefault();
              if (pending || submitting.current) return;
              if (same) {
                copyShipping();
                save();
              } else {
                await billing.handleSubmit(save)();
              }
            }}
            noValidate
          >
            <label className="same-shipping">
              <input
                type="checkbox"
                disabled={pending}
                checked={same}
                onChange={(e) => {
                  setSame(e.target.checked);
                  if (e.target.checked) {
                    previousBilling.current = billing.getValues();
                    copyShipping();
                  } else {
                    billing.reset(previousBilling.current ?? billingInitial);
                  }
                }}
              />
              <span>
                Same as Shipping Address
                <small>
                  Copy your shipping details into the billing fields below.
                </small>
              </span>
            </label>
            <fieldset
              disabled={same || pending}
              className={same ? "copied-address" : ""}
            >
              <legend className="sr-only">Billing address fields</legend>
              <AddressFields form={billing} prefix="billing" />
            </fieldset>
            {message && (
              <p role="alert" className="onboarding-error">
                {message}
              </p>
            )}
            <div className="onboarding-footer">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => {
                  setStep(1);
                  setMessage("");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <ArrowLeft size={16} />
                Back to shipping
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Save addresses
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
