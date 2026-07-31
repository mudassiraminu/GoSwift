import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SupabaseSetupNotice } from "@/components/supabase-setup-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Set a new password — GOSwift" },
      {
        name: "description",
        content: "Choose a new password for your GOSwift account and get back to your deliveries.",
      },
      { property: "og:title", content: "Set a new password — GOSwift" },
      {
        property: "og:description",
        content: "Securely reset your GOSwift password using the link we emailed you.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { redirect: rawRedirect } = Route.useSearch();
  const redirectTo =
    rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : undefined;
  const { configured, homePath, refresh } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!configured) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-muted/40 px-4">
        <SupabaseSetupNotice />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await refresh();
      toast.success("Password updated");
      await navigate({ to: (redirectTo ?? homePath) as "/dashboard", replace: true });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not update your password. Request a new link.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-secondary/50 px-4">
      <div className="gs-pop w-full max-w-sm rounded-3xl border border-border bg-card p-8 shadow-xl shadow-primary/5">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <KeyRound className="h-5 w-5" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold text-card-foreground">
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter a new password for your account. You&apos;ll be taken straight back to where you
          left off.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>
          <Button type="submit" className="tap-scale w-full" disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Update password
          </Button>
        </form>
      </div>
    </div>
  );
}
