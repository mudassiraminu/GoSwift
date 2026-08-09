import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  Box,
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  PackagePlus,
  Search,
  Truck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { MobileAppShell } from "@/components/mobile/app-shell";
import { PullToRefresh } from "@/components/mobile/pull-to-refresh";
import { RoleGuard } from "@/components/role-guard";
import { listMyRequests } from "@/lib/marketplace/api";
import { useAuth } from "@/lib/supabase/auth";
import type { DeliveryRequest } from "@/lib/supabase/types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My deliveries — GOSwift" },
      { name: "description", content: "Track your GOSwift parcels, quotes and payments." },
    ],
  }),
  component: () => (
    <RoleGuard role="customer">
      <CustomerHome />
    </RoleGuard>
  ),
});

function CustomerHome() {
  const { profile, user } = useAuth();
  const [lastSync, setLastSync] = useState("just now");
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const rows = await listMyRequests(user.id);
      setRequests(rows);
    } catch {
      /* empty ok when schema not migrated yet */
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const openCount = requests.filter((r) => ["open", "quoted", "assigned"].includes(r.status)).length;
  const doneCount = requests.filter((r) => ["completed", "delivered"].includes(r.status)).length;

  async function handleRefresh() {
    await load();
    setLastSync(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  }

  return (
    <MobileAppShell
      header={
        <header className="pt-safe z-20 bg-background px-5 pb-3">
          <div className="gs-rise grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold text-foreground">
                Hi {firstName}
              </p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" /> Find. Compare. Accept. Pay. Deliver.
              </p>
            </div>
            <button
              type="button"
              aria-label="Notifications"
              className="tap-scale flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground"
            >
              <Bell className="h-5 w-5" />
            </button>
          </div>

          <div className="gs-rise mt-3 flex items-center gap-2 gs-delay-100">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-secondary px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                placeholder="Search tracking ID"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </header>
      }
    >
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="gs-stagger space-y-6 px-5 pb-32">
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/new-delivery"
              className="tap-scale relative overflow-hidden rounded-3xl bg-primary p-4 text-left text-primary-foreground shadow-lg shadow-primary/25"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary-foreground/10"
              />
              <PackagePlus className="h-7 w-7" />
              <span className="mt-6 block font-display text-base font-semibold leading-tight">
                New
                <br />
                Delivery
              </span>
            </Link>
            <Link
              to="/dashboard"
              className="tap-scale relative overflow-hidden rounded-3xl bg-secondary p-4 text-left text-secondary-foreground"
            >
              <Truck className="h-7 w-7 text-primary" />
              <span className="mt-6 block font-display text-base font-semibold leading-tight">
                My
                <br />
                Requests
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-3xl bg-card p-4 shadow-sm">
            {[
              { label: "Active", value: String(openCount), icon: Truck },
              { label: "Done", value: String(doneCount), icon: CheckCircle2 },
              { label: "All", value: String(requests.length), icon: Clock },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="text-center">
                  <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="mt-2 font-display text-lg font-bold text-card-foreground">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              );
            })}
          </div>

          <section>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-foreground">Your deliveries</h2>
            </div>

            {requests.length === 0 ? (
              <div className="mt-3 rounded-3xl border border-dashed border-border bg-card p-8 text-center">
                <div className="gs-pop mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                  <Box className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-card-foreground">
                  No deliveries yet
                </h3>
                <p className="mx-auto mt-2 max-w-[16rem] text-sm text-muted-foreground">
                  Post a request, get quotes from verified companies, pay securely, and track to the
                  door.
                </p>
                <Link
                  to="/new-delivery"
                  className="mt-4 inline-flex text-sm font-medium text-primary"
                >
                  Create first delivery
                </Link>
                <p className="mt-4 text-[11px] text-muted-foreground">
                  Pull down to refresh · synced {lastSync}
                </p>
              </div>
            ) : (
              <ul className="mt-3 space-y-3">
                {requests.map((r) => (
                  <li key={r.id}>
                    <Link
                      to="/request/$id"
                      params={{ id: r.id }}
                      className="tap-scale block rounded-3xl bg-card p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-card-foreground">
                            {r.dropoff_city || r.dropoff_address}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            From {r.pickup_city || r.pickup_address}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium capitalize text-secondary-foreground">
                          {r.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="mt-2 flex items-center gap-1 text-xs text-primary">
                        Open <ChevronRight className="h-3.5 w-3.5" />
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </PullToRefresh>
    </MobileAppShell>
  );
}
