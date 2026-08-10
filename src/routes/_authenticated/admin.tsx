import { createFileRoute } from "@tanstack/react-router";
import {
  Bike,
  LayoutDashboard,
  Loader2,
  Package,
  Phone,
  User,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { RoleGuard } from "@/components/role-guard";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  adminAssignCourier,
  listAllCouriers,
  listAllRequests,
} from "@/lib/marketplace/api";
import { useAuth } from "@/lib/supabase/auth";
import type { DeliveryRequest, Rider } from "@/lib/supabase/types";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin dispatch — GOSwift" },
      {
        name: "description",
        content: "See delivery requests and assign available couriers.",
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
  { label: "Dispatch", to: "/admin", icon: LayoutDashboard },
  { label: "Requests", to: "/admin", icon: Package },
  { label: "Couriers", to: "/admin", icon: Bike },
];

function AdminDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [couriers, setCouriers] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [pick, setPick] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [reqs, riders] = await Promise.all([listAllRequests(), listAllCouriers()]);
      setRequests(reqs);
      setCouriers(riders);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load dispatch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openReqs = useMemo(
    () => requests.filter((r) => ["open", "quoted", "draft"].includes(r.status)),
    [requests],
  );
  const activeCouriers = useMemo(
    () => couriers.filter((c) => c.status === "active"),
    [couriers],
  );

  async function assign(req: DeliveryRequest) {
    if (!user) return;
    const riderId = pick[req.id];
    if (!riderId) {
      toast.error("Select a courier first");
      return;
    }
    setBusy(req.id);
    try {
      await adminAssignCourier({ request: req, riderId, adminId: user.id });
      const courier = couriers.find((c) => c.id === riderId);
      toast.success(
        courier?.phone
          ? `Assigned. Call courier: ${courier.phone}`
          : "Courier assigned — check their profile for contact",
      );
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Assign failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <DashboardShell
      title="Dispatch console"
      subtitle="Requests in · pick a courier · call them"
      navItems={nav}
    >
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Open requests", value: String(openReqs.length) },
            { label: "All requests", value: String(requests.length) },
            { label: "Active couriers", value: String(activeCouriers.length) },
          ].map((s) => (
            <Card key={s.label} className="rounded-2xl">
              <CardContent className="pt-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <p className="mt-2 font-display text-2xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold">Open delivery requests</h2>
              {openReqs.length === 0 ? (
                <Card className="rounded-2xl">
                  <CardContent className="py-12 text-center text-sm text-muted-foreground">
                    No open requests right now. When a customer posts a job, it appears here.
                  </CardContent>
                </Card>
              ) : (
                openReqs.map((req) => (
                  <Card key={req.id} className="rounded-2xl">
                    <CardContent className="space-y-4 pt-6">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold">
                            {req.pickup_city || req.pickup_address}
                            <span className="text-muted-foreground"> → </span>
                            {req.dropoff_city || req.dropoff_address}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {req.package_description || "No package notes"}
                          </p>
                          <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                            {req.pickup_phone ? (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" /> Pickup {req.pickup_phone}
                              </span>
                            ) : null}
                            {req.dropoff_phone ? (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" /> Dropoff {req.dropoff_phone}
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>

                      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                        <div className="space-y-1">
                          <Label className="text-xs">Assign courier</Label>
                          <select
                            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                            value={pick[req.id] ?? ""}
                            onChange={(e) =>
                              setPick((m) => ({ ...m, [req.id]: e.target.value }))
                            }
                          >
                            <option value="">Select available courier…</option>
                            {activeCouriers.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.full_name}
                                {c.phone ? ` · ${c.phone}` : ""}
                                {c.vehicle_type ? ` · ${c.vehicle_type}` : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-end">
                          <Button
                            className="h-11 w-full sm:w-auto"
                            disabled={busy === req.id}
                            onClick={() => void assign(req)}
                          >
                            {busy === req.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : null}
                            Assign & show contact
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold">Courier directory</h2>
              <p className="text-sm text-muted-foreground">
                These are people who registered as couriers. Call the one that fits the route.
              </p>
              {couriers.length === 0 ? (
                <Card className="rounded-2xl">
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    No couriers yet. They sign up in the app as “I deliver packages”.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {couriers.map((c) => (
                    <Card key={c.id} className="rounded-2xl">
                      <CardContent className="flex items-start gap-3 pt-5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                          <User className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{c.full_name}</p>
                            <StatusBadge status={c.status} />
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {c.phone ? (
                              <a className="text-primary hover:underline" href={`tel:${c.phone}`}>
                                {c.phone}
                              </a>
                            ) : (
                              "No phone on file"
                            )}
                          </p>
                          {c.vehicle_type ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">{c.vehicle_type}</p>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {requests.length > openReqs.length ? (
              <section className="space-y-3">
                <h2 className="font-display text-lg font-bold">Recent (assigned / closed)</h2>
                {requests
                  .filter((r) => !["open", "quoted", "draft"].includes(r.status))
                  .slice(0, 12)
                  .map((req) => (
                    <Card key={req.id} className="rounded-2xl">
                      <CardContent className="flex items-center justify-between gap-3 pt-5 text-sm">
                        <span className="truncate">
                          {req.pickup_city || req.pickup_address} →{" "}
                          {req.dropoff_city || req.dropoff_address}
                        </span>
                        <StatusBadge status={req.status} />
                      </CardContent>
                    </Card>
                  ))}
              </section>
            ) : null}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
