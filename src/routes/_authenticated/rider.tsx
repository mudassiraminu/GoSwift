import { createFileRoute } from "@tanstack/react-router";
import { Bike, CheckCircle2, Loader2, MapPin, Route as RouteIcon, User } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getRiderByUserId,
  listDeliveriesForRider,
  updateDeliveryStatus,
} from "@/lib/marketplace/api";
import { useAuth } from "@/lib/supabase/auth";
import type { Delivery, Rider } from "@/lib/supabase/types";

export const Route = createFileRoute("/_authenticated/rider")({
  head: () => ({
    meta: [
      { title: "Rider dashboard — GOSwift" },
      { name: "description", content: "See assigned deliveries and update status." },
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
  { label: "Active route", to: "/rider", icon: RouteIcon },
  { label: "History", to: "/rider", icon: CheckCircle2 },
  { label: "Profile", to: "/profile", icon: User },
];

function RiderDashboard() {
  const { profile, user } = useAuth();
  const [rider, setRider] = useState<Rider | null>(null);
  const [jobs, setJobs] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const r = await getRiderByUserId(user.id);
      setRider(r);
      if (r) setJobs(await listDeliveriesForRider(r.id));
      else setJobs([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function advance(d: Delivery, status: "picked_up" | "in_transit" | "delivered") {
    if (!user) return;
    setBusy(d.id);
    try {
      await updateDeliveryStatus(d.id, status, user.id);
      toast.success(`Status: ${status.replace("_", " ")}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  const active = jobs.filter((j) => !["confirmed", "cancelled", "failed"].includes(j.status));

  return (
    <DashboardShell title="My jobs" subtitle={profile?.full_name ?? "Rider"} navItems={nav}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Assigned", value: String(active.length) },
            {
              label: "In transit",
              value: String(jobs.filter((j) => j.status === "in_transit").length),
            },
            {
              label: "Delivered",
              value: String(jobs.filter((j) => j.status === "delivered" || j.status === "confirmed").length),
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <p className="mt-2 font-display text-2xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : !rider ? (
          <Card>
            <CardContent className="flex flex-col items-center py-14 text-center">
              <MapPin className="h-8 w-8 text-muted-foreground" />
              <h3 className="mt-4 font-display text-lg font-semibold">Not linked to a company yet</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Your delivery company must add you as a rider and link your account. Riders do not
                sign up independently on GoSwift.
              </p>
            </CardContent>
          </Card>
        ) : active.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-14 text-center">
              <MapPin className="h-8 w-8 text-muted-foreground" />
              <h3 className="mt-4 font-display text-lg font-semibold">No deliveries assigned</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                When your company assigns a job, it appears here with status controls.
              </p>
            </CardContent>
          </Card>
        ) : (
          active.map((d) => (
            <Card key={d.id}>
              <CardContent className="space-y-3 pt-6">
                <p className="font-mono font-semibold">{d.tracking_code}</p>
                <p className="text-xs capitalize text-muted-foreground">{d.status.replace("_", " ")}</p>
                <div className="flex flex-wrap gap-2">
                  {d.status === "assigned" ? (
                    <Button size="sm" disabled={busy === d.id} onClick={() => void advance(d, "picked_up")}>
                      Picked up
                    </Button>
                  ) : null}
                  {d.status === "picked_up" ? (
                    <Button size="sm" disabled={busy === d.id} onClick={() => void advance(d, "in_transit")}>
                      In transit
                    </Button>
                  ) : null}
                  {d.status === "in_transit" ? (
                    <Button size="sm" disabled={busy === d.id} onClick={() => void advance(d, "delivered")}>
                      Mark delivered
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
