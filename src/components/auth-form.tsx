"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { RpmBrand } from "@/components/rpm-brand";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowRight,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  Mail,
  LockKeyhole,
  UserRound,
  Eye,
  EyeOff,
  Truck,
  ReceiptText,
  Check,
  ArrowUpRight,
  TriangleAlert,
} from "lucide-react";
import { authenticate } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
function PasswordField({
  confirm = false,
  signup = false,
}: {
  confirm?: boolean;
  signup?: boolean;
}) {
  const [visible, setVisible] = useState(false),
    [caps, setCaps] = useState(false);
  const id = confirm ? "auth-confirm-password" : "auth-password";
  return (
    <div className="auth-control">
      <label htmlFor={id}>{confirm ? "Confirm password" : "Password"}</label>
      <div className="auth-input-wrap">
        <LockKeyhole size={17} aria-hidden="true" />
        <input
          id={id}
          name={confirm ? "confirmPassword" : "password"}
          type={visible ? "text" : "password"}
          autoComplete={signup ? "new-password" : "current-password"}
          minLength={signup ? 8 : 1}
          maxLength={128}
          placeholder={
            confirm
              ? "Enter your password again"
              : signup
                ? "Create a password"
                : "Enter your password"
          }
          required
          aria-describedby={
            caps
              ? `${id}-caps`
              : signup && !confirm
                ? "auth-password-hint"
                : undefined
          }
          onKeyUp={(e) => setCaps(e.getModifierState("CapsLock"))}
          onKeyDown={(e) => setCaps(e.getModifierState("CapsLock"))}
          onBlur={() => setCaps(false)}
        />
        <button
          type="button"
          className="auth-password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={`${visible ? "Hide" : "Show"} ${confirm ? "confirmation " : ""}password`}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {caps && (
        <p className="auth-input-hint auth-caps-hint" id={`${id}-caps`}>
          Caps Lock is on.
        </p>
      )}
      {signup && !confirm && (
        <p className="auth-input-hint" id="auth-password-hint">
          Use at least 8 characters.
        </p>
      )}
    </div>
  );
}
export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [message, setMessage] = useState(""),
    [pending, start] = useTransition();
  const signup = mode === "signup";
  return (
    <main className="auth-page">
      <div className="auth-content">
        <section className="auth-hero" aria-labelledby="auth-hero-title">
          <div className="auth-hero-top">
            <span className="auth-hero-tag">
              <span />
              THOUGHTFULLY ORGANIZED
            </span>
            <span className="auth-hero-index">01 — RPM EYEWEAR</span>
          </div>
          <div className="auth-hero-copy">
            <h2 id="auth-hero-title">
              Every address.
              <br />
              One workspace<span>.</span>
            </h2>
            <p>
              A simpler way to keep your shipping and billing details together.
              Ready whenever you need them.
            </p>
          </div>
          <div className="auth-address-visual" aria-hidden="true">
            <div className="auth-visual-grid" />
            <svg className="auth-route-line" viewBox="0 0 520 240" fill="none">
              <path
                d="M80 70H250C320 70 190 180 270 180H455"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="5 6"
              />
              <circle cx="80" cy="70" r="5" fill="currentColor" />
              <circle cx="455" cy="180" r="5" fill="currentColor" />
            </svg>
            <div className="auth-mini-card auth-shipping-card">
              <span className="auth-mini-icon">
                <Truck size={21} />
              </span>
              <div>
                <span className="auth-mini-label">SHIPPING ADDRESS</span>
                <strong>The right destination.</strong>
                <small>Ready for every delivery</small>
              </div>
              <span className="auth-mini-check">
                <Check size={13} />
              </span>
            </div>
            <div className="auth-visual-pin">
              <MapPin size={27} strokeWidth={1.7} />
            </div>
            <div className="auth-mini-card auth-billing-card">
              <span className="auth-mini-icon">
                <ReceiptText size={21} />
              </span>
              <div>
                <span className="auth-mini-label">BILLING ADDRESS</span>
                <strong>Every detail, in place.</strong>
                <small>All together in your address book</small>
              </div>
            </div>
          </div>
          <div className="auth-hero-bottom">
            <ShieldCheck size={17} />
            <span>Your addresses. Your private workspace.</span>
            <ArrowUpRight size={16} />
          </div>
        </section>
        <section className="auth-form-card" aria-labelledby="auth-title">
          <div className="auth-form-brand">
            <RpmBrand />
            <ThemeToggle />
          </div>
          <div className="auth-card-heading">
            <span className="auth-form-kicker">
              {signup ? "GET STARTED" : "YOUR WORKSPACE AWAITS"}
            </span>
            <h1 id="auth-title">
              {signup ? "Create your account." : "Welcome back."}
            </h1>
            <p>
              {signup
                ? "A few details, and you’re ready to go."
                : "Sign in to keep every address within reach."}
            </p>
          </div>
          <form
            className="auth-form"
            aria-busy={pending}
            onChange={() => {
              if (message) setMessage("");
            }}
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              setMessage("");
              start(async () => {
                const r = await authenticate(mode, {
                  fullName: data.get("fullName"),
                  confirmPassword: data.get("confirmPassword"),
                  email: data.get("email"),
                  password: data.get("password"),
                });
                setMessage(r.error ?? "");
              });
            }}
          >
            <fieldset disabled={pending} className="auth-fieldset">
              {signup && (
                <div className="auth-control">
                  <label htmlFor="auth-full-name">Full name</label>
                  <div className="auth-input-wrap">
                    <UserRound size={17} aria-hidden="true" />
                    <input
                      id="auth-full-name"
                      name="fullName"
                      autoComplete="name"
                      required
                      minLength={2}
                      maxLength={120}
                      placeholder="Your full name"
                    />
                  </div>
                </div>
              )}
              <div className="auth-control">
                <label htmlFor="auth-email">Email address</label>
                <div className="auth-input-wrap">
                  <Mail size={17} aria-hidden="true" />
                  <input
                    id="auth-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="you@example.com"
                    required
                    maxLength={254}
                  />
                </div>
              </div>
              <PasswordField signup={signup} />
              {signup && <PasswordField confirm signup />}
              {message && (
                <p role="status" className="auth-error">
                  <TriangleAlert size={17} aria-hidden="true" />
                  <span>{message}</span>
                </p>
              )}
              <Button disabled={pending} type="submit" className="auth-submit">
                {pending ? (
                  <>
                    <LoaderCircle className="animate-spin" size={17} />
                    {signup ? "Creating your account…" : "Signing in…"}
                  </>
                ) : (
                  <>
                    {signup ? "Create account" : "Sign in"}
                    <ArrowRight size={17} />
                  </>
                )}
              </Button>
            </fieldset>
          </form>
          <div className="auth-switch">
            <span>
              {signup ? "Already have an account?" : "New to RPM Eyewear?"}
            </span>
            <Link href={signup ? "/login" : "/signup"}>
              {signup ? "Sign in" : "Create an account"}
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <p className="auth-privacy">
            <ShieldCheck size={15} />
            Your details stay private and secure.
          </p>
        </section>
      </div>
    </main>
  );
}
