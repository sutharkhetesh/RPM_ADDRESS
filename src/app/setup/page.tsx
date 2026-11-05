import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
export default function Setup() {
  return (
    <main className="auth-wrap">
      <div className="auth-panel">
        <MapPin className="text-red-700" size={36} />
        <span className="eyebrow">WELCOME TO ADDRESSLY</span>
        <h1>Your workspace starts here.</h1>
        <p className="text-muted-foreground">
          Connect your Supabase project to securely manage your real addresses.
        </p>
        <ol className="my-6 space-y-4 text-sm leading-6">
          <li>
            1. Copy <code>.env.example</code> to <code>.env</code>.
          </li>
          <li>2. Add your Supabase connection as DATABASE_URL in .env.</li>
          <li>
            3. Run <code>npm run db:deploy</code>, then restart the app.
          </li>
        </ol>
        <p className="text-sm text-muted-foreground mb-6">
          The README includes connection and migration setup instructions.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-red-700 font-semibold"
        >
          Go to sign in <ArrowRight size={16} />
        </Link>
      </div>
    </main>
  );
}
