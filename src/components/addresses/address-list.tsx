import Link from "next/link";
import { format } from "date-fns";
import {
  MapPin,
  Plus,
  Star,
  Building2,
  House,
  ArrowUpRight,
} from "lucide-react";
import type { Address } from "@/generated/prisma/client";
import { AddressActions } from "./address-actions";
import { Button } from "@/components/ui/button";
export function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={`badge ${type === "BILLING" ? "badge-purple" : type === "BOTH" ? "badge-blue" : "badge-green"}`}
    >
      {type === "BOTH"
        ? "Shipping & billing"
        : type === "BILLING"
          ? "Billing"
          : "Shipping"}
    </span>
  );
}
export function DefaultBadge({
  a,
}: {
  a: Pick<Address, "isDefaultShipping" | "isDefaultBilling">;
}) {
  return a.isDefaultShipping || a.isDefaultBilling ? (
    <span
      className="default-badge"
      title={[
        a.isDefaultShipping && "Default shipping",
        a.isDefaultBilling && "Default billing",
      ]
        .filter(Boolean)
        .join(" · ")}
    >
      <Star size={12} fill="currentColor" />
      {a.isDefaultShipping && a.isDefaultBilling
        ? "Shipping & billing"
        : a.isDefaultShipping
          ? "Shipping"
          : "Billing"}
    </span>
  ) : (
    <span className="text-muted-foreground">—</span>
  );
}
export function AddressList({
  addresses,
  filtered = false,
}: {
  addresses: Address[];
  filtered?: boolean;
}) {
  if (!addresses.length)
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <MapPin size={31} strokeWidth={1.5} />
        </div>
        <h3>
          {filtered
            ? "No addresses found"
            : "Your next destination starts here."}
        </h3>
        <p>
          {filtered
            ? "Try a different search or clear your filters."
            : "Add your first address. Keep the details close, wherever life takes you."}
        </p>
        <Button asChild className="mt-5">
          <Link href={filtered ? "/dashboard" : "/addresses/new"}>
            {filtered ? (
              "Clear filters"
            ) : (
              <>
                <Plus size={16} />
                Add your first address
              </>
            )}
          </Link>
        </Button>
      </div>
    );
  return (
    <>
      <div className="table-wrap">
        <table>
          <caption className="sr-only">
            Saved addresses and available actions
          </caption>
          <thead>
            <tr>
              <th scope="col">NAME / CONTACT</th>
              <th scope="col">ADDRESS</th>
              <th scope="col">TYPE</th>
              <th scope="col">DEFAULT</th>
              <th scope="col">ADDED ON</th>
              <th scope="col" className="text-right">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {addresses.map((a) => (
              <tr key={a.id}>
                <td>
                  <div className="contact-cell">
                    <span className="contact-avatar">
                      {a.fullName
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </span>
                    <div>
                      <Link
                        className="contact-name"
                        href={`/addresses/${a.id}/edit`}
                      >
                        {a.fullName}
                      </Link>
                      {a.companyName && (
                        <span className="contact-company">{a.companyName}</span>
                      )}
                      <span className="contact-phone">{a.phone}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="address-cell">
                    <span>
                      {a.addressLine1}
                      {a.addressLine2 ? `, ${a.addressLine2}` : ""}
                    </span>
                    <span>
                      {a.city}, {a.state} · {a.postalCode}
                    </span>
                    <small>
                      {a.addressLabel === "OFFICE" ? (
                        <Building2 size={11} />
                      ) : (
                        <House size={11} />
                      )}{" "}
                      {a.addressLabel.toLowerCase()} · {a.country}
                    </small>
                  </div>
                </td>
                <td>
                  <TypeBadge type={a.addressType} />
                </td>
                <td>
                  <DefaultBadge a={a} />
                </td>
                <td className="date-cell">
                  {format(a.createdAt, "dd MMM yyyy")}
                </td>
                <td>
                  <AddressActions id={a.id} name={a.fullName} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mobile-addresses">
        {addresses.map((a) => (
          <article className="address-card" key={a.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  href={`/addresses/${a.id}/edit`}
                  className="font-semibold"
                >
                  {a.fullName}
                  <ArrowUpRight size={14} className="inline ml-1" />
                </Link>
                <p className="text-sm text-muted-foreground mt-1">{a.phone}</p>
              </div>
              <TypeBadge type={a.addressType} />
            </div>
            <p className="text-sm leading-6 my-4">
              {a.addressLine1}
              {a.addressLine2 && `, ${a.addressLine2}`}
              <br />
              {a.city}, {a.state} · {a.postalCode}
              <br />
              {a.country}
            </p>
            <div className="flex items-center justify-between">
              <DefaultBadge a={a} />
              <AddressActions id={a.id} name={a.fullName} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
