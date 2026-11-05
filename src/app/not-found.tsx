import Link from "next/link";
export default function NotFound() {
  return (
    <main className="auth-wrap">
      <div className="auth-panel">
        <h1>Address not found.</h1>
        <p className="mb-6 text-muted-foreground">
          This address may have been removed or is unavailable in your
          workspace.
        </p>
        <Link href="/addresses" className="text-red-700">
          Back to addresses →
        </Link>
      </div>
    </main>
  );
}
