import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldAlert } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/supabase/auth";
import type { AppRole } from "@/lib/supabase/types";

const ROLE_LABEL: Record<AppRole, string> = {
  customer: "Customer",
  provider: "Delivery Provider",
  rider: "Rider",
  admin: "Administrator",
};

/**
 * Presentational guard only — real authorization is enforced by RLS in Postgres.
 * Users who have a different role are redirected to their own home instead of
 * hitting a dead end.
 */
export function RoleGuard({ role, children }: { role: AppRole; children: ReactNode }) {
  const { loading, roles, homePath } = useAuth();
  const navigate = useNavigate();
  const allowed = roles.includes(role);
  const canRedirect = !loading && !allowed && roles.length > 0;

  useEffect(() => {
    if (canRedirect) {
      void navigate({ to: homePath, replace: true });
    }
  }, [canRedirect, homePath, navigate]);

  if (loading || canRedirect) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-secondary/50">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-secondary/50 px-4">
        <div className="gs-pop max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-xl shadow-primary/5">
          <ShieldAlert className="mx-auto h-10 w-10 text-warning" />
          <h2 className="mt-4 font-display text-xl font-semibold text-card-foreground">
            {ROLE_LABEL[role]} access required
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account doesn&apos;t have the {ROLE_LABEL[role].toLowerCase()} role yet. If you
            believe this is a mistake, contact an administrator.
          </p>
          <Button asChild className="tap-scale mt-6">
            <Link to="/profile">Go to my profile</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
