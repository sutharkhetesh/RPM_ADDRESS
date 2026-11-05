"use client";
import { UserRound, MapPin } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { AddressInput } from "@/lib/validations/address";
const inputAttributes: Partial<
  Record<keyof AddressInput, { autoComplete?: string; maxLength: number }>
> = {
  fullName: { autoComplete: "name", maxLength: 120 },
  companyName: { autoComplete: "organization", maxLength: 160 },
  phone: { autoComplete: "tel", maxLength: 24 },
  addressLine1: { autoComplete: "address-line1", maxLength: 250 },
  addressLine2: { autoComplete: "address-line2", maxLength: 250 },
  landmark: { maxLength: 160 },
  city: { autoComplete: "address-level2", maxLength: 100 },
  state: { autoComplete: "address-level1", maxLength: 100 },
  postalCode: { autoComplete: "postal-code", maxLength: 20 },
  country: { autoComplete: "country-name", maxLength: 100 },
};
export function AddressFields({
  form,
  prefix = "address",
}: {
  form: UseFormReturn<AddressInput>;
  prefix?: string;
}) {
  const {
    register,
    formState: { errors },
  } = form;
  function field(
    name: keyof AddressInput,
    label: string,
    required = false,
    placeholder = "",
    type = "text",
  ) {
    const fieldId = `${prefix}-${name}`;
    const errorId = `${fieldId}-error`;
    return (
      <div className="field" key={name}>
        <label htmlFor={fieldId}>
          {label}
          {required && (
            <span aria-hidden="true" className="text-red-700">
              {" "}
              *
            </span>
          )}
        </label>
        <input
          id={fieldId}
          {...register(name)}
          {...inputAttributes[name]}
          type={type}
          required={required}
          placeholder={placeholder}
          aria-invalid={!!errors[name]}
          aria-describedby={errors[name] ? errorId : undefined}
        />
        {errors[name] && (
          <span id={errorId} className="field-error">
            {errors[name]?.message}
          </span>
        )}
      </div>
    );
  }
  return (
    <>
      <section className="form-section">
        <div className="section-label">
          <UserRound size={19} />
          <div>
            <h2>Contact details</h2>
            <p>Who should we address this to?</p>
          </div>
        </div>
        <div className="form-grid">
          {field("fullName", "Full name", true, "Your full name")}
          {field(
            "companyName",
            "Company name",
            false,
            "Company or organization",
          )}
          {field("phone", "Mobile number", true, "+91 98765 43210", "tel")}
        </div>
      </section>
      <section className="form-section">
        <div className="section-label">
          <MapPin size={19} />
          <div>
            <h2>Address details</h2>
            <p>Add the details that get it there.</p>
          </div>
        </div>
        <div className="form-grid">
          {field(
            "addressLine1",
            "Address line 1",
            true,
            "House, building, street",
          )}
          {field(
            "addressLine2",
            "Address line 2",
            false,
            "Apartment, floor, area",
          )}
          {field("landmark", "Landmark", false, "Near a recognizable place")}
          {field("city", "City", true, "City")}
          {field("state", "State / province", true, "State")}
          {field("postalCode", "Postal / PIN code", true, "e.g. 400001")}
          {field("country", "Country", true, "India")}
        </div>
      </section>
    </>
  );
}
