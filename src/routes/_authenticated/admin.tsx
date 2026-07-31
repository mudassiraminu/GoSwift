import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, BadgeCheck, LayoutDashboard, Package, Users } from "lucide-react";

import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { RoleGuard } from "@/components/role-guard";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin console — GOSwift" },
      {
        name: "description",
        content: "Verify providers, monitor deliveries and resolve disputes across the platform.",
      },
      { property: "og:title", content: "Admin console — GOSwift" },
      {
        property: "og:description",
        content: "Verify providers, monitor deliveries and resolve disputes.",
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
  { label: "Provider verification", icon: BadgeCheck },
  { label: "Users", icon: Users },
  { label: "Deliveries", icon: Package },
  { label: "Disputes", icon: AlertTriangle },
];

function AdminDashboard() {
  return (
    <DashboardShell
      title="Admin console"
      subtitle="Platform oversight and provider verification"
      navItems={nav}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "Pending verifications", value: "0" },
            { label: "Total users", value: "0" },
            { label: "Deliveries today", value: "0" },
            { label: "Open disputes", value: "0" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <p className="mt-2 font-display text-2xl font-bold text-card-foreground">
                  {s.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="flex flex-col items-center py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <BadgeCheck className="h-6 w-6 text-secondary-foreground" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-card-foreground">
              Verification queue is empty
            </h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Delivery companies awaiting document review will be listed here. Admin roles are
              granted directly in your Supabase project&apos;s <code>user_roles</code> table.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
