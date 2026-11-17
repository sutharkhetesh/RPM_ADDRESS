export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { LayoutShell } from "@/components/layout/layout-shell";
import { SessionRenewal } from "@/components/auth/session-renewal";
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <LayoutShell email={user.email}>
      <SessionRenewal />
      {children}
    </LayoutShell>
  );
}
