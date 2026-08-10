import { createFileRoute } from "@tanstack/react-router";
import { Bike, CheckCircle2, Loader2, MapPin, Phone, User } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ensureCourierProfile,
  getRiderByUserId,
  listDeliveriesForRider,
  setCourierStatus,
  updateDeliveryStatus,
} from "@/lib/marketplace/api";
import { useAuth } from "@/lib/supabase/auth";
import type { Delivery, Rider } from "@/lib/supabase/types";

export const Route = createFileRoute("/_authenticated/rider")({
  head: () => ({
    meta: [
      { title: "Courier — GOSwift" },
      { name: "description", content: "Your courier profile and assigned jobs." },
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
  { label: "Profile", to: "/profile", icon: User },
];

function RiderDashboard() {
  const { profile, user, refresh } = useAuth();
  const [rider, setRider] = useState<Rider | null>(null);
  const [jobs, setJobs] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [vehicle, setVehicle] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const r = await getRiderByUserId(user.id);
      setRider(r);
      if (r) {
        setFullName(r.full_name);
        setPhone(r.phone ?? "");
        setCity(r.vehicle_type?.includes("·") ? "" : "");
        setVehicle(r.vehicle_type ?? "");
        setJobs(await listDeliveriesForRider(r.id));
      } else {
        setFullName(profile?.full_name ?? "");
        setPhone(profile?.phone ?? "");
        setJobs([]);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveProfile() {
    if (!user) return;
    setBusy("profile");
    try {
      const r = await ensureCourierProfile(user.id, {
        full_name: fullName || profile?.full_name || "Courier",
        phone: phone || undefined,
        city: city || undefined,
        vehicle_type: [city, vehicle].filter(Boolean).join(" · ") || undefined,
      });
      setRider(r);
      await refresh();
      toast.success("Courier profile saved — admin can contact you");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function toggleActive() {
    if (!rider) return;
    setBusy("status");
    try {
      const next = rider.status === "active" ? "inactive" : "active";
      const r = await setCourierStatus(rider.id, next);
      setRider(r);
      toast.success(next === "active" ? "You are available" : "You are offline");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update status");
    } finally {
      setBusy(null);
    }
  }

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
    <DashboardShell
      title="Courier home"
      subtitle={profile?.full_name ?? "Mai kai kaya"}
      navItems={nav}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="rounded-2xl">
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-semibold">Your contact card</h2>
                <p className="text-sm text-muted-foreground">
                  Admin uses this to call you when there is a job in your area.
                </p>
              </div>
              {rider ? (
                <Button
                  size="sm"
                  variant={rider.status === "active" ? "default" : "outline"}
                  disabled={busy === "status"}
                  onClick={() => void toggleActive()}
                >
                  {rider.status === "active" ? "Available" : "Offline"}
                </Button>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234…"
                />
              </div>
              <div className="space-y-2">
                <Label>City / area</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Kano" />
              </div>
              <div className="space-y-2">
                <Label>Vehicle</Label>
                <Input
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  placeholder="Bike / Keke / Van"
                />
              </div>
            </div>
            <Button disabled={busy === "profile"} onClick={() => void saveProfile()}>
              {busy === "profile" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save courier profile
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Assigned", value: String(active.length), icon: MapPin },
            {
              label: "In transit",
              value: String(jobs.filter((j) => j.status === "in_transit").length),
              icon: Bike,
            },
            {
              label: "Done",
              value: String(
                jobs.filter((j) => j.status === "delivered" || j.status === "confirmed").length,
              ),
              icon: CheckCircle2,
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="rounded-2xl">
                <CardContent className="pt-6">
                  <Icon className="h-4 w-4 text-primary" />
                  <p className="mt-2 font-display text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : active.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col items-center py-14 text-center">
              <Phone className="h-8 w-8 text-muted-foreground" />
              <h3 className="mt-4 font-display text-lg font-semibold">No job assigned yet</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Keep your phone on. When admin assigns you a delivery, it shows up here.
              </p>
            </CardContent>
          </Card>
        ) : (
          active.map((d) => (
            <Card key={d.id} className="rounded-2xl">
              <CardContent className="space-y-3 pt-6">
                <p className="font-mono font-semibold">{d.tracking_code}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {d.status.replace("_", " ")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {d.status === "assigned" ? (
                    <Button
                      size="sm"
                      disabled={busy === d.id}
                      onClick={() => void advance(d, "picked_up")}
                    >
                      Picked up
                    </Button>
                  ) : null}
                  {d.status === "picked_up" ? (
                    <Button
                      size="sm"
                      disabled={busy === d.id}
                      onClick={() => void advance(d, "in_transit")}
                    >
                      In transit
                    </Button>
                  ) : null}
                  {d.status === "in_transit" ? (
                    <Button
                      size="sm"
                      disabled={busy === d.id}
                      onClick={() => void advance(d, "delivered")}
                    >
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
