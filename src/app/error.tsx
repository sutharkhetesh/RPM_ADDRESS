"use client";
import { Button } from "@/components/ui/button";
export default function ErrorBoundary({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="auth-wrap">
      <div className="auth-panel" role="alert">
        <h1 className="text-2xl font-semibold mb-3">
          We couldn’t load your workspace.
        </h1>
        <p className="text-muted-foreground mb-6">
          Please try again. If the issue continues, wait a moment and reload the
          page.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
