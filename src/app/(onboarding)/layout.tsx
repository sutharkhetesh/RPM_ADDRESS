import { SessionRenewal } from "@/components/session-renewal";

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
