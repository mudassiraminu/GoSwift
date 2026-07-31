import { createFileRoute, Link } from "@tanstack/react-router";
import { CreditCard, MapPin, MessageSquareQuote, Package, PackagePlus, Star } from "lucide-react";

import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/supabase/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My deliveries — GOSwift" },
      { name: "description", content: "Track your delivery requests, quotes and payments." },
      { property: "og:title", content: "My deliveries — GOSwift" },
      { property: "og:description", content: "Track your delivery requests, quotes and payments." },
    ],
  }),
  component: () => (
    <RoleGuard role="customer">
      <CustomerDashboard />
    </RoleGuard>
  ),
});

const nav: NavItem[] = [
  { label: "Overview", to: "/dashboard", icon: Package },
  { label: "New delivery", icon: PackagePlus },
  { label: "Quotes", icon: MessageSquareQuote },
  { label: "Tracking", icon: MapPin },
  { label: "Payments", icon: CreditCard },
  { label: "Reviews", icon: Star },
  { label: "Profile", to: "/profile", icon: Star },
];

function CustomerDashboard() {
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <DashboardShell
      title="My deliveries"
      subtitle="Everything you have sent and everything in transit"
      navItems={nav}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-xl bg-primary p-6 text-primary-foreground">
          <h2 className="font-display text-xl font-bold">Hi {firstName} 👋</h2>
          <p className="mt-1 text-sm text-primary-foreground/70">
            Your account is ready. Delivery requests and quotes will appear here.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Active deliveries", value: "0" },
            { label: "Pending quotes", value: "0" },
            { label: "Completed", value: "0" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <p className="mt-2 font-display text-3xl font-bold text-card-foreground">
                  {s.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="flex flex-col items-center py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <PackagePlus className="h-6 w-6 text-secondary-foreground" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-card-foreground">
              No deliveries yet
            </h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Delivery requests, provider quotes and live tracking arrive in the next release. Your
              account and profile are already set up.
            </p>
            <Button className="mt-6" disabled>
              Create a delivery request
            </Button>
            <Link to="/profile" className="mt-3 text-sm text-accent hover:underline">
              Complete your profile
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
