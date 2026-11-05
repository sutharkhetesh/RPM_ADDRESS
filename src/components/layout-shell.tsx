"use client";
import Link from "next/link";
import { RpmBrand } from "@/components/rpm-brand";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LayoutDashboard,
  ContactRound,
  Truck,
  ReceiptText,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { signOut } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/addresses", label: "All addresses", icon: ContactRound },
  { href: "/addresses?filter=shipping", label: "Shipping", icon: Truck },
  { href: "/addresses?filter=billing", label: "Billing", icon: ReceiptText },
];
export function LayoutShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email: string;
}) {
  const filter = useSearchParams().get("filter") ?? "";
  const path = usePathname(),
    [open, setOpen] = useState(false);
  return (
    <div className="app-shell">
      {open && (
        <div className="mobile-overlay" onClick={() => setOpen(false)} />
      )}
      <aside className={cn("sidebar", open && "is-open")}>
        <Link href="/dashboard" className="brand">
          <RpmBrand />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="mobile-close"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        >
          <X size={20} />
        </Button>
        <span className="nav-caption">WORKSPACE</span>
        <nav aria-label="Main navigation">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              onClick={() => setOpen(false)}
              className={cn(
                "nav-link",
                (href === "/dashboard"
                  ? path === href
                  : path.startsWith("/addresses") &&
                    (new URL(href, "http://localhost").searchParams.get(
                      "filter",
                    ) ?? "") === filter) && "active",
              )}
              key={href}
              href={href}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <ShieldCheck size={16} />
          <span>RPM Eyewear · Your private workspace</span>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="mobile-menu"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </Button>
            <span className="text-muted-foreground text-sm">Workspace</span>
            <ChevronRight size={14} className="text-muted-foreground" />
            <span className="text-sm font-medium">
              {path.startsWith("/dashboard") ? "Overview" : "Addresses"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="top-divider" />
            <div className="user-avatar" title={email}>
              {email.slice(0, 2).toUpperCase()}
            </div>
            <form action={signOut}>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={17} />
              </Button>
            </form>
          </div>
        </header>
        <main className="page-content">{children}</main>
        <footer className="app-footer">
          RPM Eyewear · Address Management
          <span>Your shipping and billing addresses.</span>
        </footer>
      </div>
    </div>
  );
}
