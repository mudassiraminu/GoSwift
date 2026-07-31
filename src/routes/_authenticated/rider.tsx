import { createFileRoute } from "@tanstack/react-router";
import { Bike, CheckCircle2, MapPin, Route as RouteIcon, User } from "lucide-react";

import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { RoleGuard } from "@/components/role-guard";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/supabase/auth";

export const Route = createFileRoute("/_authenticated/rider")({
  head: () => ({
    meta: [
      { title: "Rider dashboard — GOSwift" },
      { name: "description", content: "See your assigned deliveries and update their status." },
      { property: "og:title", content: "Rider dashboard — GOSwift" },
      {
        property: "og:description",
        content: "See your assigned deliveries and update their status.",
      },
    ],
  }),
  component: () => (
    <RoleGuard role="rider">
      <RiderDashboard />
    </RoleGuard>
  ),
});

const nav: NavItem[] = [
  { label: "My jobs", to: "/rider", icon: Bike },
  { label: "Active route", icon: RouteIcon },
  { label: "Delivery history", icon: CheckCircle2 },
  { label: "Profile", to: "/profile", icon: User },
];

function RiderDashboard() {
  const { profile } = useAuth();

  return (
    <DashboardShell
      title="My jobs"
      subtitle={profile?.full_name ?? "Rider"}
      navItems={nav}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Assigned today", value: "0" },
            { label: "In transit", value: "0" },
            { label: "Delivered", value: "0" },
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
              <MapPin className="h-6 w-6 text-secondary-foreground" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-card-foreground">
              No deliveries assigned
            </h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              When your delivery company assigns you a job, it appears here with pickup and drop-off
              details and status controls.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
