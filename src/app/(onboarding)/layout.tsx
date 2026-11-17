import { SessionRenewal } from "@/components/auth/session-renewal";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SessionRenewal />
      {children}
    </>
  );
}
