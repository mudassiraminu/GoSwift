import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard, Loader2, Package, Phone } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { RoleGuard } from "@/components/role-guard";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listAllRequests } from "@/lib/marketplace/api";
import { supabase } from "@/lib/supabase/client";
import type { DeliveryRequest } from "@/lib/supabase/types";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Dispatch — GOSwift" },
      {
        name: "description",
        content: "See customer delivery requests and contact details for offline dispatch.",
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
  { label: "Requests", to: "/admin", icon: LayoutDashboard },
  { label: "All jobs", to: "/admin", icon: Package },
];

function AdminDashboard() {
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRequests(await listAllRequests());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load requests");
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

  async function markStatus(id: string, status: "assigned" | "cancelled" | "completed") {
    setBusy(id);
    try {
      const { error } = await supabase.from("delivery_requests").update({ status }).eq("id", id);
      if (error) throw error;
      toast.success(`Marked ${status}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <DashboardShell
      title="Dispatch board"
      subtitle="Customers request in-app · you find couriers offline"
      navItems={nav}
    >
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Need courier now", value: String(openReqs.length) },
            { label: "All requests", value: String(requests.length) },
            {
              label: "Assigned / closed",
              value: String(requests.length - openReqs.length),
            },
          ].map((s) => (
            <Card key={s.label} className="rounded-2xl">
              <CardContent className="pt-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <p className="mt-2 font-display text-2xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-2xl border-dashed">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">How dispatch works</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Customer registers and posts pickup → drop-off in the app.</li>
              <li>You see the job here with phone numbers.</li>
              <li>You find a courier outside the app (call / WhatsApp / your network).</li>
              <li>Mark the job assigned when someone is on it.</li>
            </ol>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold">Open — find a courier</h2>
              {openReqs.length === 0 ? (
                <Card className="rounded-2xl">
                  <CardContent className="py-12 text-center text-sm text-muted-foreground">
                    No open requests. When a customer posts a delivery, it appears here.
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
                          {req.notes ? (
                            <p className="mt-1 text-xs text-muted-foreground">Note: {req.notes}</p>
                          ) : null}
                        </div>
                        <StatusBadge status={req.status} />
                      </div>

                      <div className="rounded-xl bg-secondary/60 p-3 text-sm">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Contact (call outside app)
                        </p>
                        <div className="mt-2 flex flex-col gap-1">
                          {req.pickup_phone ? (
                            <a
                              href={`tel:${req.pickup_phone}`}
                              className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
                            >
                              <Phone className="h-4 w-4" />
                              Pickup: {req.pickup_phone}
                              {req.pickup_contact ? ` (${req.pickup_contact})` : ""}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">No pickup phone</span>
                          )}
                          {req.dropoff_phone ? (
                            <a
                              href={`tel:${req.dropoff_phone}`}
                              className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
                            >
                              <Phone className="h-4 w-4" />
                              Drop-off: {req.dropoff_phone}
                              {req.dropoff_contact ? ` (${req.dropoff_contact})` : ""}
                            </a>
                          ) : null}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Full addresses: {req.pickup_address} → {req.dropoff_address}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          disabled={busy === req.id}
                          onClick={() => void markStatus(req.id, "assigned")}
                        >
                          Mark assigned (courier found offline)
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy === req.id}
                          onClick={() => void markStatus(req.id, "cancelled")}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </section>

            {requests.length > openReqs.length ? (
              <section className="space-y-3">
                <h2 className="font-display text-lg font-bold">History</h2>
                {requests
                  .filter((r) => !["open", "quoted", "draft"].includes(r.status))
                  .slice(0, 20)
                  .map((req) => (
                    <Card key={req.id} className="rounded-2xl">
                      <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5 text-sm">
                        <span className="truncate">
                          {req.pickup_city || req.pickup_address} →{" "}
                          {req.dropoff_city || req.dropoff_address}
                        </span>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={req.status} />
                          {req.status === "assigned" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy === req.id}
                              onClick={() => void markStatus(req.id, "completed")}
                            >
                              Complete
                            </Button>
                          ) : null}
                        </div>
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
