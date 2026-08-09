import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, BadgeCheck, LayoutDashboard, Loader2, Package, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { RoleGuard } from "@/components/role-guard";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import type { DeliveryProvider } from "@/lib/supabase/types";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin console — GOSwift" },
      {
        name: "description",
        content: "Verify providers, monitor the marketplace, and keep trust high.",
      },
    ],
  }),
  component: () => (
    <RoleGuard role="admin">
      <AdminDashboard />
    </RoleGuard>
  ),
});

const nav: NavItem[] = [
  { label: "Overview", to: "/admin", icon: LayoutDashboard },
  { label: "Provider verification", to: "/admin", icon: BadgeCheck },
  { label: "Users", icon: Users },
  { label: "Deliveries", icon: Package },
  { label: "Disputes", icon: AlertTriangle },
];

function AdminDashboard() {
  const [providers, setProviders] = useState<DeliveryProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("delivery_providers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setProviders((data ?? []) as DeliveryProvider[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load providers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: "verified" | "rejected" | "under_review" | "suspended") {
    setBusy(id);
    try {
      const patch: Record<string, unknown> = { status };
      if (status === "verified") patch.verified_at = new Date().toISOString();
      const { error } = await supabase.from("delivery_providers").update(patch).eq("id", id);
      if (error) throw error;
      toast.success(`Provider marked ${status.replace("_", " ")}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  const pending = providers.filter((p) =>
    ["pending", "under_review"].includes(p.status),
  ).length;

  return (
    <DashboardShell
      title="Admin console"
      subtitle="Verify companies and protect marketplace trust"
      navItems={nav}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "Pending verification", value: String(pending) },
            { label: "Total providers", value: String(providers.length) },
            {
              label: "Verified",
              value: String(providers.filter((p) => p.status === "verified").length),
            },
            {
              label: "Suspended",
              value: String(providers.filter((p) => p.status === "suspended").length),
            },
          ].map((s) => (
            <Card key={s.label} className="rounded-2xl border-border shadow-sm">
              <CardContent className="pt-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <p className="mt-2 font-display text-2xl font-bold text-card-foreground">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold">Provider verification queue</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : providers.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="flex flex-col items-center py-14 text-center">
                <BadgeCheck className="h-8 w-8 text-muted-foreground" />
                <h3 className="mt-4 font-display text-lg font-semibold">No companies yet</h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  When delivery companies register, they appear here for review. Grant yourself admin
                  via <code className="text-xs">user_roles</code> in Supabase if needed.
                </p>
              </CardContent>
            </Card>
          ) : (
            providers.map((p) => (
              <Card key={p.id} className="rounded-2xl">
                <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display font-semibold text-card-foreground">
                        {p.company_name}
                      </p>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[p.city, p.phone, p.email].filter(Boolean).join(" · ") || "No contact details"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.avg_rating.toFixed(1)} ★ · {p.completed_count} completed
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={busy === p.id || p.status === "verified"}
                      onClick={() => void setStatus(p.id, "verified")}
                    >
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === p.id}
                      onClick={() => void setStatus(p.id, "under_review")}
                    >
                      Review
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === p.id}
                      onClick={() => void setStatus(p.id, "rejected")}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busy === p.id}
                      onClick={() => void setStatus(p.id, "suspended")}
                    >
                      Suspend
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
