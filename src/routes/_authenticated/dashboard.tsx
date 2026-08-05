import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  Box,
  ChevronRight,
  MapPin,
  PackagePlus,
  Search,
  ScanLine,
  Truck,
} from "lucide-react";
import { useState } from "react";

import { MobileAppShell } from "@/components/mobile/app-shell";
import { PullToRefresh } from "@/components/mobile/pull-to-refresh";
import { RoleGuard } from "@/components/role-guard";
import { useAuth } from "@/lib/supabase/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My deliveries — GOSwift" },
      { name: "description", content: "Track your GOSwift parcels, quotes and payments." },
      { property: "og:title", content: "My deliveries — GOSwift" },
      {
        property: "og:description",
        content: "Track your GOSwift parcels, quotes and payments from your phone.",
      },
    ],
  }),
  component: () => (
    <RoleGuard role="customer">
      <CustomerHome />
    </RoleGuard>
  ),
});

interface Shipment {
  id: string;
  title: string;
  code: string;
  from: string;
  eta: string;
  progress: number;
  icon: typeof Box;
}

const shipments: Shipment[] = [];

function CustomerHome() {
  const { profile } = useAuth();
  const [lastSync, setLastSync] = useState<string>("just now");

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  async function handleRefresh() {
    await new Promise((r) => setTimeout(r, 900));
    setLastSync(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  }

  return (
    <MobileAppShell
      header={
        <header className="pt-safe z-20 bg-background px-5 pb-3">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold text-foreground">
                Hi {firstName}
              </p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" /> Delivering with GOSwift
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

          <div className="mt-3 flex items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-secondary px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                placeholder="Search tracking ID"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button
              type="button"
              aria-label="Scan parcel code"
              className="tap-scale flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25"
            >
              <ScanLine className="h-5 w-5" />
            </button>
          </div>
        </header>
      }
    >
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-6 px-5 pb-6">
          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
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
            </button>
            <button
              type="button"
              className="tap-scale relative overflow-hidden rounded-3xl bg-secondary p-4 text-left text-secondary-foreground"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10"
              />
              <Truck className="h-7 w-7 text-primary" />
              <span className="mt-6 block font-display text-base font-semibold leading-tight">
                Track
                <br />
                Package
              </span>
            </button>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3 rounded-3xl bg-card p-4 shadow-sm">
            {[
              { label: "In transit", value: "0", icon: Truck },
              { label: "Delivered", value: "0", icon: CheckCircle2 },
              { label: "Drafts", value: "0", icon: Clock },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="text-center">
                  <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="mt-2 font-display text-lg font-bold text-card-foreground">
                    {s.value}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* Current shipment */}
          <section>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-foreground">Current shipment</h2>
              <button type="button" className="text-xs font-medium text-primary">
                See all
              </button>
            </div>

            {shipments.length === 0 ? (
              <div className="mt-3 rounded-3xl border border-dashed border-border bg-card p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                  <Box className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-card-foreground">
                  No parcels in transit
                </h3>
                <p className="mx-auto mt-2 max-w-[16rem] text-sm text-muted-foreground">
                  Book your first delivery and it will show up here with live progress.
                </p>
                <p className="mt-4 text-[11px] text-muted-foreground">
                  Pull down to refresh · synced {lastSync}
                </p>
              </div>
            ) : (
              <ul className="mt-3 space-y-3">
                {shipments.map((s) => (
                  <li key={s.id} className="rounded-3xl bg-card p-4 shadow-sm">
                    <p className="font-semibold">{s.title}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Services */}
          <section>
            <h2 className="font-display text-base font-bold text-foreground">Services</h2>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[
                { label: "Same day", icon: Zap },
                { label: "Bulk", icon: Box },
                { label: "Nearby", icon: MapPin },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.label}
                    type="button"
                    className="tap-scale rounded-2xl bg-secondary p-3 text-center"
                  >
                    <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-card text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="mt-2 block text-[11px] font-medium text-secondary-foreground">
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Profile nudge */}
          <Link
            to="/profile"
            className="tap-scale flex items-center gap-3 rounded-3xl bg-secondary p-4"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-card text-primary">
              <Box className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-secondary-foreground">
                Complete your profile
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                Add your phone number for delivery updates
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </Link>
        </div>
      </PullToRefresh>
    </MobileAppShell>
  );
}
