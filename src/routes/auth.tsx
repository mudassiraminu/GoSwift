import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SupabaseSetupNotice } from "@/components/supabase-setup-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";
import { ROLE_HOME, useAuth } from "@/lib/supabase/auth";
import type { AppRole } from "@/lib/supabase/types";

type Mode = "signin" | "signup" | "forgot";

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
          "Sign in or create a GOSwift account as a customer, delivery provider or rider.",
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

function AuthPage() {
  const { mode: initialMode, redirect: rawRedirect } = Route.useSearch();
  // Only same-origin absolute paths are honoured (no open redirects).
  const redirectTo =
    rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : undefined;
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
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
        await refresh();
        toast.success("Account created");
        await navigate({
          to: (redirectTo ?? ROLE_HOME[role]) as "/dashboard",
          replace: true,
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await refresh();
        toast.success("Welcome back");
        // The effect above navigates to redirectTo (or the role home) once the session lands.
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl("/") },
    });
    if (error) toast.error(error.message);
  }


  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <Link to="/" className="flex items-center gap-2">
          <AppLogo className="h-9 w-9 rounded-lg" labelled={false} />
          <span className="font-display text-lg font-bold">GOSwift</span>
        </Link>
        <div>
          <h2 className="max-w-sm text-3xl font-bold leading-tight">
            One account for customers, delivery companies and riders.
          </h2>
          <p className="mt-4 max-w-md text-primary-foreground/70">
            Your role decides what you see: post deliveries, quote on jobs, or run your assigned
            routes.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/50">
          Protected payments &middot; Verified providers &middot; Dispute resolution
        </p>
      </div>

      <div className="flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Package className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold">GOSwift</span>
          </Link>

          <h1 className="font-display text-2xl font-bold text-foreground">
            {mode === "signin"
              ? "Sign in"
              : mode === "signup"
                ? "Create your account"
                : "Reset your password"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Welcome back. Enter your details to continue."
              : mode === "signup"
                ? "Tell us how you plan to use GOSwift."
                : "We'll email you a secure link to set a new password."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          role === r.value
                            ? "border-accent bg-accent/10"
                            : "border-border hover:bg-secondary"
                        }`}
                      >
                        <span className="block text-sm font-medium text-foreground">{r.label}</span>
                        <span className="block text-xs text-muted-foreground">{r.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

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
            {mode !== "forgot" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-accent hover:underline"
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

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
            </Button>
          </form>

          {mode !== "forgot" ? (
            <>
              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button variant="outline" className="w-full" onClick={() => void handleGoogle()}>
                Continue with Google
              </Button>
            </>
          ) : null}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : null}
            {mode === "signin" ? "No account yet?" : null}{" "}
            <button
              type="button"
              className="font-medium text-accent hover:underline"
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
