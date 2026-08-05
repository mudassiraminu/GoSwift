import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Mail, ShieldCheck, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppLogo } from "@/components/app-logo";
import { SupabaseSetupNotice } from "@/components/supabase-setup-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";
import { ROLE_HOME, useAuth } from "@/lib/supabase/auth";
import type { AppRole } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup" | "forgot" | "verify";
type Method = "email" | "phone";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "signup" ? ("signup" as const) : ("signin" as const),
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),

  head: () => ({
    meta: [
      { title: "Sign in — GOSwift" },
      {
        name: "description",
        content:
          "Sign in or create a GOSwift account with your email or phone number as a customer, delivery provider or rider.",
      },
      { property: "og:title", content: "Sign in — GOSwift" },
      {
        property: "og:description",
        content: "Access your GOSwift deliveries, quotes and rider assignments.",
      },
    ],
  }),
  component: AuthPage,
});

const SIGNUP_ROLES: { value: Exclude<AppRole, "admin">; label: string; hint: string }[] = [
  { value: "customer", label: "I need deliveries", hint: "Post jobs and compare quotes" },
  { value: "provider", label: "I run a delivery company", hint: "Quote on jobs, manage riders" },
  { value: "rider", label: "I am a rider", hint: "Join a company and deliver" },
];

/** Keeps digits and a single leading +, so Supabase always gets E.164-ish input. */
function normalizePhone(raw: string) {
  const digits = raw.replace(/[^\d+]/g, "");
  return digits.startsWith("+") ? "+" + digits.slice(1).replace(/\+/g, "") : "+" + digits;
}

function AuthPage() {
  const { mode: initialMode, redirect: rawRedirect } = Route.useSearch();
  // Only same-origin absolute paths are honoured (no open redirects).
  const redirectTo =
    rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : undefined;
  const [mode, setMode] = useState<Mode>(initialMode);
  const [method, setMethod] = useState<Method>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Exclude<AppRole, "admin">>("customer");
  const [submitting, setSubmitting] = useState(false);
  const { configured, user, loading, homePath, refresh } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && mode !== "forgot") {
      void navigate({ to: (redirectTo ?? homePath) as "/dashboard", replace: true });
    }
  }, [loading, user, homePath, redirectTo, mode, navigate]);

  if (!configured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <SupabaseSetupNotice />
      </div>
    );
  }

  /** Absolute URL Supabase should send the user back to, keeping ?redirect intact. */
  function callbackUrl(path = "/") {
    const url = new URL(path, window.location.origin);
    if (redirectTo) url.searchParams.set("redirect", redirectTo);
    return url.toString();
  }

  async function goHome() {
    await refresh();
    await navigate({
      to: (redirectTo ?? ROLE_HOME[role]) as "/dashboard",
      replace: true,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "verify") {
        const { error } = await supabase.auth.verifyOtp({
          phone: normalizePhone(phone),
          token: otp.trim(),
          type: "sms",
        });
        if (error) throw error;
        toast.success("Phone verified");
        await goHome();
        return;
      }

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: callbackUrl("/reset-password"),
        });
        if (error) throw error;
        toast.success("Password reset link sent — check your inbox.");
        setMode("signin");
        return;
      }

      if (mode === "signup") {
        if (method === "phone") {
          const { data, error } = await supabase.auth.signUp({
            phone: normalizePhone(phone),
            password,
            options: { data: { full_name: fullName, role, phone: normalizePhone(phone) } },
          });
          if (error) throw error;
          if (!data.session) {
            toast.success("We sent you a 6-digit code by SMS.");
            setMode("verify");
            return;
          }
          toast.success("Account created");
          await goHome();
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: callbackUrl("/"),
            data: { full_name: fullName, role },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your inbox to confirm your email address.");
          setMode("signin");
          return;
        }
        toast.success("Account created");
        await goHome();
        return;
      }

      const { error } =
        method === "phone"
          ? await supabase.auth.signInWithPassword({
              phone: normalizePhone(phone),
              password,
            })
          : await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await refresh();
      toast.success("Welcome back");
      // The effect above navigates to redirectTo (or the role home) once the session lands.
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const heading =
    mode === "signin"
      ? "Sign in"
      : mode === "signup"
        ? "Create your account"
        : mode === "verify"
          ? "Verify your phone"
          : "Reset your password";

  const sub =
    mode === "signin"
      ? "Welcome back. Enter your details to continue."
      : mode === "signup"
        ? "Tell us how you plan to use GOSwift."
        : mode === "verify"
          ? `Enter the 6-digit code we sent to ${normalizePhone(phone)}.`
          : "We'll email you a secure link to set a new password.";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary-foreground/10 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-primary-foreground/5 blur-3xl"
        />
        <Link to="/" className="relative flex items-center gap-2">
          <AppLogo className="h-9 w-9 rounded-lg" labelled={false} />
          <span className="font-display text-lg font-bold">GOSwift</span>
        </Link>
        <div className="relative">
          <h2 className="max-w-sm font-display text-3xl font-bold leading-tight">
            One account for customers, delivery companies and riders.
          </h2>
          <p className="mt-4 max-w-md text-primary-foreground/70">
            Your role decides what you see: post deliveries, quote on jobs, or run your assigned
            routes.
          </p>
        </div>
        <p className="relative inline-flex items-center gap-2 text-xs text-primary-foreground/60">
          <ShieldCheck className="h-4 w-4" />
          Protected payments &middot; Verified providers &middot; Dispute resolution
        </p>
      </div>

      <div className="flex items-center justify-center bg-background px-5 py-12">
        <div className="gs-rise w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <AppLogo className="h-10 w-10 rounded-xl" labelled={false} />
            <span className="font-display text-lg font-bold">GOSwift</span>
          </Link>

          <h1 className="font-display text-2xl font-bold text-foreground">{heading}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{sub}</p>

          {mode === "signin" || mode === "signup" ? (
            <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1">
              {(
                [
                  { key: "email" as const, label: "Email", icon: Mail },
                  { key: "phone" as const, label: "Phone", icon: Smartphone },
                ]
              ).map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMethod(m.key)}
                    className={cn(
                      "tap-scale flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      method === m.key
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Morgan"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>I am signing up as</Label>
                  <div className="grid gap-2">
                    {SIGNUP_ROLES.map((r) => (
                      <button
                        type="button"
                        key={r.value}
                        onClick={() => setRole(r.value)}
                        className={cn(
                          "tap-scale rounded-xl border p-3 text-left transition-colors",
                          role === r.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-secondary",
                        )}
                      >
                        <span className="block text-sm font-medium text-foreground">{r.label}</span>
                        <span className="block text-xs text-muted-foreground">{r.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

            {mode === "verify" ? (
              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={8}
                  className="text-center text-lg tracking-[0.4em]"
                  required
                />
              </div>
            ) : null}

            {mode !== "verify" && (method === "email" || mode === "forgot") ? (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>
            ) : null}

            {mode !== "verify" && mode !== "forgot" && method === "phone" ? (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 801 234 5678"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Include your country code, e.g. +234 for Nigeria.
                </p>
              </div>
            ) : null}

            {mode !== "forgot" && mode !== "verify" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" && method === "email" ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-primary hover:underline"
                      onClick={() => setMode("forgot")}
                    >
                      Forgot password?
                    </button>
                  ) : null}
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
            ) : null}

            <Button type="submit" className="h-12 w-full rounded-xl" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : mode === "verify"
                    ? "Verify & continue"
                    : "Send reset link"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : null}
            {mode === "signin" ? "No account yet?" : null}{" "}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => setMode(mode === "signup" ? "signin" : mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Create one" : mode === "signup" ? "Sign in" : "Back to sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
