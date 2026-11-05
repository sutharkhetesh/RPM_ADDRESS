import Link from "next/link";
import {
  Plus,
  ArrowUpRight,
  ContactRound,
  Truck,
  ReceiptText,
  Star,
  MapPin,
  ArrowRight,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { database } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { AddressList } from "@/components/addresses/address-list";
export default async function Dashboard() {
  const user = await requireUser(),
    db = database(),
    where = { userId: user.id };
  const [total, shipping, billing, defaults, recent] = await db.$transaction([
    db.address.count({ where }),
    db.address.count({
      where: { ...where, addressType: { in: ["SHIPPING", "BOTH"] } },
    }),
    db.address.count({
      where: { ...where, addressType: { in: ["BILLING", "BOTH"] } },
    }),
    db.address.count({
      where: {
        ...where,
        OR: [{ isDefaultShipping: true }, { isDefaultBilling: true }],
      },
    }),
    db.address.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: 5,
    }),
  ]);
  const stats = [
    {
      label: "Total addresses",
      value: total,
      icon: ContactRound,
      detail: "Every destination, in one place",
      color: "green",
      href: "/addresses",
    },
    {
      label: "Shipping addresses",
      value: shipping,
      icon: Truck,
      detail: "Ready for your next delivery",
      color: "blue",
      href: "/addresses?filter=shipping",
    },
    {
      label: "Billing addresses",
      value: billing,
      icon: ReceiptText,
      detail: "The details behind the business",
      color: "purple",
      href: "/addresses?filter=billing",
    },
    {
      label: "Default addresses",
      value: defaults,
      icon: Star,
      detail: "Your go-to destinations",
      color: "amber",
      href: "/addresses?filter=default",
    },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A LITTLE MORE ORGANIZED</span>
          <h1>
            Your dashboard<span className="title-dot">.</span>
          </h1>
          <p>
            Your saved shipping and billing details, ready when you need them.
          </p>
        </div>
        <Button asChild>
          <Link href="/addresses/new">
            <Plus size={17} />
            Add address
          </Link>
        </Button>
      </div>
      <section className="welcome-banner">
        <div>
          <span className="banner-tag">
            <span />
            RPM EYEWEAR · YOUR ADDRESS WORKSPACE
          </span>
          <h2>
            Your account.
            <br />
            Every destination.
          </h2>
          <p>
            Keep your shipping and billing details organized,
            <br />
            with every address securely saved to your account.
          </p>
          <Link href="/addresses" className="banner-link">
            Explore your address book <ArrowRight size={16} />
          </Link>
        </div>
        <div className="banner-art" aria-hidden="true">
          <div className="map-grid" />
          <div className="map-road road-one" />
          <div className="map-road road-two" />
          <div className="map-road road-three" />
          <div className="map-pin">
            <MapPin size={47} strokeWidth={1.6} />
          </div>
          <div className="map-card">
            <span className="map-card-icon">
              <ShieldCheck size={19} />
            </span>
            <div>
              Right place. Every time.<small>Your details, all together.</small>
            </div>
          </div>
          <span className="map-dot dot-one" />
          <span className="map-dot dot-two" />
        </div>
      </section>
      <section className="stats-grid" aria-label="Address statistics">
        {stats.map(({ label, value, icon: Icon, detail, color, href }) => (
          <Link href={href} className="stat-card" key={label}>
            <div className="stat-top">
              <span>{label}</span>
              <span className={`stat-icon ${color}`}>
                <Icon size={18} />
              </span>
            </div>
            <strong>{value.toLocaleString()}</strong>
            <div className="stat-foot">
              <span>{detail}</span>
              <ArrowUpRight size={14} />
            </div>
          </Link>
        ))}
      </section>
      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <h2>Recently added</h2>
            <p>Your latest destinations, at a glance.</p>
          </div>
          <Link
            href="/addresses"
            className="text-sm font-medium flex gap-2 items-center text-red-700"
          >
            View all addresses
            <ArrowRight size={15} />
          </Link>
        </div>
        <AddressList addresses={recent} compact />
      </section>
      <section className="tips-grid">
        <div className="tip-card">
          <span className="tip-icon">
            <Printer size={22} />
          </span>
          <div>
            <h3>From saved to sent.</h3>
            <p>
              Print clean shipping labels or download a PDF, right from any
              address.
            </p>
          </div>
        </div>
        <div className="tip-card">
          <span className="tip-icon amber">
            <Star size={22} />
          </span>
          <div>
            <h3>Your favorites, first.</h3>
            <p>
              Set your default shipping and billing addresses to keep everyday
              work simple.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
