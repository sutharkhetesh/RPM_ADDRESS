"use client";
import Link from "next/link";
import { RpmBrand } from "@/components/rpm-brand";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LayoutDashboard,
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
  const params = useSearchParams();
  const filter = params.get("filter") ?? params.get("type") ?? "";
  const path = usePathname(),
    [open, setOpen] = useState(false);
  const sidebar = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  function isActive(href: string) {
    return href === "/dashboard"
      ? path === href
      : path.startsWith("/addresses") &&
          new URL(href, "http://localhost").searchParams.get("filter") ===
            filter;
  }
  useEffect(() => {
    if (!open) return;
    const media = window.matchMedia("(min-width: 768px)");
    if (media.matches) {
      setOpen(false);
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    function onResize() {
      if (media.matches) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const controls = sidebar.current?.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])",
      );
      const first = controls?.[0],
        last = controls?.[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    media.addEventListener("change", onResize);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      media.removeEventListener("change", onResize);
      menuButton.current?.focus();
    };
  }, [open]);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#workspace-main">
        Skip to content
      </a>
      {open && (
        <div className="mobile-overlay" onClick={() => setOpen(false)} />
      )}
      <aside
        ref={sidebar}
        id="workspace-navigation"
        role={open ? "dialog" : undefined}
        aria-modal={open || undefined}
        aria-label="Workspace navigation"
        className={cn("sidebar", open && "is-open")}
      >
        <Link href="/dashboard" className="brand">
          <RpmBrand />
        </Link>
        <Button
          ref={closeButton}
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
              className={cn("nav-link", isActive(href) && "active")}
              aria-current={isActive(href) ? "page" : undefined}
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
      <div className="main-area" inert={open}>
        <header className="topbar">
          <div className="flex items-center gap-3">
            <Button
              ref={menuButton}
              variant="ghost"
              size="icon"
              className="mobile-menu"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
              aria-expanded={open}
              aria-controls="workspace-navigation"
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
        <main id="workspace-main" tabIndex={-1} className="page-content">
          {children}
        </main>
        <footer className="app-footer">
          RPM Eyewear · Address Management
          <span>Your shipping and billing addresses.</span>
        </footer>
      </div>
    </div>
  );
}
