export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { LayoutShell } from "@/components/layout-shell";
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return <LayoutShell email={user.email}>{children}</LayoutShell>;
}
