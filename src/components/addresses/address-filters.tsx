"use client";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal, LoaderCircle } from "lucide-react";
const filters = [
  ["shipping", "Shipping"],
  ["billing", "Billing"],
];
export function AddressFilters({
  basePath = "/addresses",
  showTabs = true,
}: {
  basePath?: string;
  showTabs?: boolean;
}) {
  const params = useSearchParams(),
    router = useRouter(),
    [pending, start] = useTransition();
  const [text, setText] = useState(params.get("q") ?? "");
  const urlQuery = params.get("q") ?? "";
  const latest = useRef(params);
  latest.current = params;
  useEffect(() => setText(urlQuery), [urlQuery]);
  const update = useCallback(
    (key: string, value: string) => {
      if ((latest.current.get(key) ?? "") === value) return;
      const next = new URLSearchParams(latest.current.toString());
      value ? next.set(key, value) : next.delete(key);
      next.delete("page");
      start(() =>
        router.replace(`${basePath}?${next.toString()}`, { scroll: false }),
      );
    },
    [basePath, router],
  );
  useEffect(() => {
    if (text === urlQuery) return;
    const timer = setTimeout(() => update("q", text), 350);
    return () => clearTimeout(timer);
  }, [text, urlQuery, update]);
  return (
    <div className="filters">
      {showTabs && (
        <div className="filter-tabs" aria-label="Filter addresses">
          {filters.map(([value, label]) => (
            <button
              type="button"
              aria-pressed={(params.get("filter") ?? "") === value}
              disabled={pending}
              key={value}
              onClick={() => update("filter", value)}
              className={
                (params.get("filter") ?? "") === value ? "selected" : ""
              }
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <div className="search-row">
        <div className="search-input">
          <Search size={17} />
          <input
            aria-label="Search addresses"
            maxLength={200}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search names, cities, PIN codes…"
          />
          {pending ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            text && (
              <button
                type="button"
                onClick={() => setText("")}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )
          )}
        </div>
        <div className="sort-control">
          <SlidersHorizontal size={15} />
          <select
            aria-label="Sort addresses"
            value={params.get("sort") ?? "newest"}
            onChange={(e) => update("sort", e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="city">City A–Z</option>
          </select>
        </div>
        <select
          className="page-size"
          aria-label="Addresses per page"
          value={params.get("size") ?? "10"}
          onChange={(e) => update("size", e.target.value)}
        >
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n} per page
            </option>
          ))}
        </select>
      </div>
      <span className="sr-only" role="status">
        {pending ? "Updating addresses…" : ""}
      </span>
    </div>
  );
}
