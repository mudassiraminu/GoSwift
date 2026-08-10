import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppLogo } from "@/components/app-logo";
import { SupabaseSetupNotice } from "@/components/supabase-setup-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";
import {
  ROLE_HOME,
  safeRedirectPath,
  useAuth,
  type RoleHomePath,
} from "@/lib/supabase/auth";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup" | "forgot" | "verify";
type Method = "email" | "phone";

const KNOWN_HOME_PATHS = new Set<string>(Object.values(ROLE_HOME));

function resolveDestination(
  redirectTo: string | undefined,
  fallback: RoleHomePath,
): { kind: "home"; path: RoleHomePath } | { kind: "href"; href: string } {
  if (!redirectTo) return { kind: "home", path: fallback };
  const pathOnly = redirectTo.split("?")[0]?.split("#")[0] ?? "";
  if (KNOWN_HOME_PATHS.has(pathOnly) || pathOnly === "/profile") {
    if (pathOnly === "/profile") return { kind: "href", href: redirectTo };
    return { kind: "home", path: pathOnly as RoleHomePath };
  }
  return { kind: "href", href: redirectTo };
}

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
        content: "Request a delivery. GOSwift handles finding a courier for you.",
      },
    ],
  }),
  component: AuthPage,
});

function normalizePhone(raw: string) {
  const digits = raw.replace(/[^\d+]/g, "");
  return digits.startsWith("+") ? "+" + digits.slice(1).replace(/\+/g, "") : "+" + digits;
}

function phoneDigits(raw: string) {
  return raw.replace(/\D/g, "");
}

function validateEmail(value: string) {
  const v = value.trim();
  if (!v) return "Enter your email address.";
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) return "That doesn't look like a valid email.";
  return undefined;
}

function validatePhone(value: string) {
  const raw = value.trim();
  if (!raw) return "Enter your phone number.";
  if (!raw.startsWith("+")) return "Start with your country code, e.g. +234.";
  const digits = phoneDigits(raw);
  if (digits.length < 8) return "That number looks too short.";
  if (digits.length > 15) return "That number looks too long.";
  return undefined;
}

function validatePassword(value: string, mode: Mode) {
  if (!value) return "Enter your password.";
  if (value.length < 6) return "Password must be at least 6 characters.";
  if (mode === "signup") {
    if (value.length < 8) return "Use at least 8 characters for a new account.";
    if (!/[a-zA-Z]/.test(value) || !/\d/.test(value))
      return "Mix letters and numbers to make it harder to guess.";
  }
  return undefined;
}

function passwordScore(value: string) {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^\w\s]/.test(value)) score++;
  return score;
}

const STRENGTH = [
  { label: "Too weak", bar: "bg-destructive", width: "w-1/4" },
  { label: "Weak", bar: "bg-destructive", width: "w-1/4" },
  { label: "Fair", bar: "bg-warning", width: "w-2/4" },
  { label: "Good", bar: "bg-primary", width: "w-3/4" },
  { label: "Strong", bar: "bg-success", width: "w-full" },
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs font-medium text-destructive" role="alert">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

function AuthPage() {
  const { mode: initialMode, redirect: rawRedirect } = Route.useSearch();
  const redirectTo = safeRedirectPath(rawRedirect);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [method, setMethod] = useState<Method>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { configured, user, loading, homePath, refresh } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();

  const errors: Record<string, string | undefined> = {};
  if (mode === "signup" && !fullName.trim()) errors.fullName = "Tell us your name.";
  if (mode === "forgot" || (mode !== "verify" && method === "email"))
    errors.email = validateEmail(email);
  if (mode !== "verify" && mode !== "forgot" && method === "phone")
    errors.phone = validatePhone(phone);
  if (mode !== "verify" && mode !== "forgot") errors.password = validatePassword(password, mode);
  if (mode === "verify" && phoneDigits(otp).length !== 6)
    errors.otp = "Enter the 6-digit code from the SMS.";

  const show = (field: string) => (touched[field] ? errors[field] : undefined);
  const markTouched = (field: string) => setTouched((t) => ({ ...t, [field]: true }));
  const hasErrors = Object.values(errors).some(Boolean);

  async function navigateAfterAuth(fallback: RoleHomePath) {
    const dest = resolveDestination(redirectTo, fallback);
    if (dest.kind === "home") {
      await navigate({ to: dest.path, replace: true });
    } else {
      router.history.replace(dest.href);
    }
  }

  useEffect(() => {
    if (!loading && user && mode !== "forgot") {
      void navigateAfterAuth(homePath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, homePath, redirectTo, mode]);

  if (!configured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <SupabaseSetupNotice />
      </div>
    );
  }

  function callbackUrl(path = "/") {
    const url = new URL(path, window.location.origin);
    if (redirectTo) url.searchParams.set("redirect", redirectTo);
    return url.toString();
  }

  async function finishSignup(userId: string) {
    await supabase.from("user_roles").upsert(
      { user_id: userId, role: "customer" },
      { onConflict: "user_id,role" },
    );
    if (fullName.trim() || (method === "phone" && phone)) {
      await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          phone: method === "phone" ? normalizePhone(phone) : undefined,
        })
        .eq("id", userId);
    }
    await refresh();
    await navigateAfterAuth("/dashboard");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (hasErrors) {
      setTouched({ fullName: true, email: true, phone: true, password: true, otp: true });
      toast.error(Object.values(errors).find(Boolean) ?? "Please check the form.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "verify") {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: normalizePhone(phone),
          token: otp.trim(),
          type: "sms",
        });
        if (error) throw error;
        if (data.user) await finishSignup(data.user.id);
        else {
          toast.success("Phone verified");
          await refresh();
        }
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
        const meta = { full_name: fullName, role: "customer" };

        if (method === "phone") {
          const { data, error } = await supabase.auth.signUp({
            phone: normalizePhone(phone),
            password,
            options: { data: { ...meta, phone: normalizePhone(phone) } },
          });
          if (error) throw error;
          if (!data.session) {
            toast.success("We sent you a 6-digit code by SMS.");
            setMode("verify");
            return;
          }
          if (data.user) {
            toast.success("Account created");
            await finishSignup(data.user.id);
          }
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: callbackUrl("/"),
            data: meta,
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your inbox to confirm your email address.");
          setMode("signin");
          return;
        }
        if (data.user) {
          toast.success("Account created");
          await finishSignup(data.user.id);
        }
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
        ? "Create account"
        : mode === "verify"
          ? "Verify your phone"
          : "Reset your password";

  const sub =
    mode === "signin"
      ? "Sign in to request a delivery."
      : mode === "signup"
        ? "Only people who need a package delivered register here."
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
        <Link to="/" className="relative flex items-center gap-2">
          <AppLogo className="h-9 w-9 rounded-lg" labelled={false} />
          <span className="font-display text-lg font-bold">GOSwift</span>
        </Link>
        <div className="relative">
          <h2 className="max-w-sm font-display text-3xl font-bold leading-tight">
            Request a delivery. We handle the rest.
          </h2>
          <p className="mt-4 max-w-md text-primary-foreground/75">
            Tell us pickup, drop-off and package details. Our team finds a suitable courier outside
            the app and keeps you updated.
          </p>
        </div>
        <p className="relative inline-flex items-center gap-2 text-xs text-primary-foreground/60">
          <ShieldCheck className="h-4 w-4" />
          Simple requests · Human dispatch · Clear updates
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
                ] as const
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
              <div className="space-y-2">
                <Label htmlFor="fullName">Your name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={() => markTouched("fullName")}
                  aria-invalid={!!show("fullName")}
                  placeholder="Ada Okonkwo"
                />
                <FieldError message={show("fullName")} />
              </div>
            ) : null}

            {mode === "verify" ? (
              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onBlur={() => markTouched("otp")}
                  aria-invalid={!!show("otp")}
                  placeholder="123456"
                  maxLength={6}
                  className="text-center text-lg tracking-[0.4em]"
                />
                <FieldError message={show("otp")} />
              </div>
            ) : null}

            {mode !== "verify" && (method === "email" || mode === "forgot") ? (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => markTouched("email")}
                  aria-invalid={!!show("email")}
                  placeholder="you@email.com"
                />
                <FieldError message={show("email")} />
              </div>
            ) : null}

            {mode !== "verify" && mode !== "forgot" && method === "phone" ? (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onFocus={() => {
                    if (!phone) setPhone("+234 ");
                  }}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s-]/g, ""))}
                  onBlur={() => markTouched("phone")}
                  aria-invalid={!!show("phone")}
                  placeholder="+234 801 234 5678"
                />
                <FieldError message={show("phone")} />
              </div>
            ) : null}

            {mode !== "forgot" && mode !== "verify" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-primary hover:underline"
                      onClick={() => setMode("forgot")}
                    >
                      Forgot password?
                    </button>
                  ) : null}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => markTouched("password")}
                    aria-invalid={!!show("password")}
                    placeholder="••••••••"
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="tap-scale absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <FieldError message={show("password")} />
                {mode === "signup" && password ? (
                  <div className="space-y-1.5 pt-0.5">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          STRENGTH[passwordScore(password)].bar,
                          STRENGTH[passwordScore(password)].width,
                        )}
                      />
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {passwordScore(password) >= 3 ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : null}
                      Strength: {STRENGTH[passwordScore(password)].label}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <Button type="submit" className="h-12 w-full" disabled={submitting}>
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
              onClick={() =>
                setMode(mode === "signup" ? "signin" : mode === "signin" ? "signup" : "signin")
              }
            >
              {mode === "signin" ? "Create one" : mode === "signup" ? "Sign in" : "Back to sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
