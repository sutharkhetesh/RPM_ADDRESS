"use client";
import { Button } from "@/components/ui/button";
export default function ErrorBoundary({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="p-10 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold mb-3">
        We couldn’t load your workspace.
      </h1>
      <p className="text-muted-foreground mb-6">
        Please try again. If the issue continues, check the database connection
        and migrations.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
