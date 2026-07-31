import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Building2, CreditCard, MessageSquareQuote, Truck, Users } from "lucide-react";

import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { RoleGuard } from "@/components/role-guard";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/supabase/auth";

export const Route = createFileRoute("/_authenticated/provider")({
  head: () => ({
    meta: [
      { title: "Provider dashboard — GOSwift" },
      {
        name: "description",
        content: "Manage your delivery company: verification, quotes, riders and payouts.",
      },
      { property: "og:title", content: "Provider dashboard — GOSwift" },
      {
        property: "og:description",
        content: "Manage your delivery company: verification, quotes, riders and payouts.",
      },
    ],
  }),
  component: () => (
    <RoleGuard role="provider">
      <ProviderDashboard />
    </RoleGuard>
  ),
});

const nav: NavItem[] = [
  { label: "Overview", to: "/provider", icon: Building2 },
  { label: "Job board", icon: MessageSquareQuote },
  { label: "Riders", icon: Users },
  { label: "Deliveries", icon: Truck },
  { label: "Payouts", icon: CreditCard },
  { label: "Profile", to: "/profile", icon: BadgeCheck },
];

function ProviderDashboard() {
  const { profile } = useAuth();

  return (
    <DashboardShell
      title="Company dashboard"
      subtitle={profile?.full_name ?? "Delivery provider"}
      navItems={nav}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-6">
          <div className="flex items-start gap-3">
            <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">
                Verification pending
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload your company registration and identity documents to get the verified badge.
                Only verified companies can quote on delivery jobs. Document upload arrives in the
                next release.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "Open jobs", value: "0" },
            { label: "Quotes sent", value: "0" },
            { label: "Active riders", value: "0" },
            { label: "Earnings", value: "$0" },
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
              <MessageSquareQuote className="h-6 w-6 text-secondary-foreground" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-card-foreground">
              No delivery jobs available yet
            </h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Once customers start posting deliveries in your service areas, they show up here for
              you to quote on.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
