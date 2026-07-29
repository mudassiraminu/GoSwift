import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

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
 */
export function RoleGuard({ role, children }: { role: AppRole; children: ReactNode }) {
  const { loading, roles, homePath } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!roles.includes(role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-warning" />
          <h2 className="mt-4 font-display text-xl font-semibold text-card-foreground">
            {ROLE_LABEL[role]} access required
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account doesn&apos;t have the {ROLE_LABEL[role].toLowerCase()} role. If you believe
            this is a mistake, contact an administrator.
          </p>
          <Button asChild className="mt-6">
            <Link to={homePath as "/dashboard"}>Go to my dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
