import Link from "next/link";
import { Plus, ChevronLeft, ChevronRight, ContactRound } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { database } from "@/lib/prisma";
import { addressQuery, type SearchParams } from "@/lib/address-query";
import { AddressFilters } from "@/components/addresses/address-filters";
import { AddressList } from "@/components/addresses/address-list";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
export async function AddressBook({
  params,
  overview = false,
}: {
  params: SearchParams;
  overview?: boolean;
}) {
  const user = await requireUser(),
    query = addressQuery(params, user.id),
    db = database();
  const [total, addresses] = await db.$transaction([
    db.address.count({ where: query.where }),
    db.address.findMany({
      where: query.where,
      orderBy: query.orderBy,
      take: query.pageSize,
      skip: (query.page - 1) * query.pageSize,
    }),
  ]);
  const basePath = overview ? "/dashboard" : "/addresses";
  const pages = Math.max(1, Math.ceil(total / query.pageSize));
  function href(page: number) {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params))
      if (typeof v === "string") p.set(k, v);
    p.set("page", String(page));
    return `${basePath}?${p}`;
  }
  if (query.page > pages) redirect(href(pages));
  return (
    <>
      {!overview && (
        <div className="page-heading">
          <div>
            <span className="eyebrow">EVERY DESTINATION, TOGETHER</span>
            <h1>
              Your addresses<span className="title-dot">.</span>
            </h1>
            <p>Your shipping and billing addresses, together.</p>
          </div>
          <Button asChild>
            <Link
              href={
                query.filter === "shipping" || query.filter === "billing"
                  ? `/addresses/new?type=${query.filter}`
                  : "/addresses/new"
              }
            >
              <Plus size={17} />
              Add address
            </Link>
          </Button>
        </div>
      )}
      <section className="panel" id="address-book">
        <div className="panel-heading">
          <div className="flex items-center gap-2">
            <ContactRound size={18} className="text-red-700" />
            <h2>Your address book</h2>
            <span className="count-badge">{total}</span>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">
            Organized. Accessible. Always up to date.
          </span>
        </div>
        <AddressFilters basePath={basePath} showTabs={!overview} />
        <AddressList
          addresses={addresses}
          filtered={Boolean(query.q || query.filter)}
        />
        <div className="pagination">
          <p>
            {total
              ? `${(query.page - 1) * query.pageSize + 1}–${Math.min(query.page * query.pageSize, total)} of ${total} addresses`
              : "0 addresses"}
          </p>
          <div className="flex gap-2 items-center">
            <Button asChild variant="outline" size="sm">
              <Link
                aria-disabled={query.page <= 1}
                tabIndex={query.page <= 1 ? -1 : 0}
                className={
                  query.page <= 1 ? "pointer-events-none opacity-40" : ""
                }
                href={href(Math.max(1, query.page - 1))}
              >
                <ChevronLeft size={14} />
                Previous
              </Link>
            </Button>
            <span className="text-xs px-2">
              {query.page} / {pages}
            </span>
            <Button asChild variant="outline" size="sm">
              <Link
                aria-disabled={query.page >= pages}
                tabIndex={query.page >= pages ? -1 : 0}
                className={
                  query.page >= pages ? "pointer-events-none opacity-40" : ""
                }
                href={href(Math.min(pages, query.page + 1))}
              >
                Next
                <ChevronRight size={14} />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
