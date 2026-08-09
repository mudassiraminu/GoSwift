import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  Building2,
  CreditCard,
  Loader2,
  MessageSquareQuote,
  Truck,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  assignRider,
  ensureProviderProfile,
  formatMoney,
  getMyProvider,
  listDeliveriesForProvider,
  listOpenRequestsForProviders,
  listQuotesForProvider,
  listRiders,
  submitQuote,
  updateDeliveryStatus,
} from "@/lib/marketplace/api";
import { useAuth } from "@/lib/supabase/auth";
import type {
  Delivery,
  DeliveryProvider,
  DeliveryQuote,
  DeliveryRequest,
  Rider,
} from "@/lib/supabase/types";

export const Route = createFileRoute("/_authenticated/provider")({
  head: () => ({
    meta: [
      { title: "Provider dashboard — GOSwift" },
      {
        name: "description",
        content: "Manage leads, quotes, riders and deliveries for your company.",
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
  { label: "Job board", to: "/provider", icon: MessageSquareQuote },
  { label: "Riders", to: "/provider", icon: Users },
  { label: "Deliveries", to: "/provider", icon: Truck },
  { label: "Payouts", to: "/provider", icon: CreditCard },
  { label: "Profile", to: "/profile", icon: BadgeCheck },
];

function ProviderDashboard() {
  const { profile, user, refresh } = useAuth();
  const [provider, setProvider] = useState<DeliveryProvider | null>(null);
  const [leads, setLeads] = useState<DeliveryRequest[]>([]);
  const [quotes, setQuotes] = useState<DeliveryQuote[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [quoteAmounts, setQuoteAmounts] = useState<Record<string, string>>({});
  const [quoteEtas, setQuoteEtas] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let p = await getMyProvider(user.id);
      if (!p) {
        p = await ensureProviderProfile(
          user.id,
          profile?.full_name ? `${profile.full_name}'s Company` : "My Delivery Co",
          profile?.phone ?? undefined,
        );
        await refresh();
      }
      setProvider(p);
      const [openReqs, qs, dels, rs] = await Promise.all([
        listOpenRequestsForProviders(),
        listQuotesForProvider(p.id),
        listDeliveriesForProvider(p.id),
        listRiders(p.id),
      ]);
      setLeads(openReqs);
      setQuotes(qs);
      setDeliveries(dels);
      setRiders(rs);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load provider data");
    } finally {
      setLoading(false);
    }
  }, [user, profile, refresh]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onQuote(requestId: string) {
    if (!provider) return;
    const amount = Number(quoteAmounts[requestId]);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid quote amount (₦)");
      return;
    }
    setBusy(requestId);
    try {
      await submitQuote({
        request_id: requestId,
        provider_id: provider.id,
        amount,
        eta_minutes: quoteEtas[requestId] ? Number(quoteEtas[requestId]) : undefined,
        currency: "NGN",
      });
      toast.success("Quote sent to the business");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send quote");
    } finally {
      setBusy(null);
    }
  }

  async function onAssign(deliveryId: string, riderId: string) {
    if (!user) return;
    setBusy(deliveryId);
    try {
      await assignRider(deliveryId, riderId, user.id);
      toast.success("Rider assigned");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Assign failed");
    } finally {
      setBusy(null);
    }
  }

  async function onAdvance(delivery: Delivery, status: "picked_up" | "in_transit" | "delivered") {
    if (!user) return;
    setBusy(delivery.id);
    try {
      await updateDeliveryStatus(delivery.id, status, user.id);
      toast.success(`Marked ${status.replace("_", " ")}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  const verified = provider?.status === "verified";

  return (
    <DashboardShell
      title="Company dashboard"
      subtitle={provider?.company_name ?? profile?.full_name ?? "Delivery provider"}
      navItems={nav}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        {!verified ? (
          <div className="rounded-xl border border-warning/40 bg-warning/10 p-6">
            <div className="flex items-start gap-3">
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div>
                <h2 className="font-display text-base font-semibold text-foreground">
                  Verification: {provider?.status ?? "pending"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Only verified companies appear publicly. You can still quote on open leads while
                  under review if RLS allows. Ask an admin to set your status to verified in
                  Supabase.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "Open jobs", value: String(leads.length) },
            { label: "Quotes sent", value: String(quotes.length) },
            { label: "Active riders", value: String(riders.filter((r) => r.status === "active").length) },
            {
              label: "Active deliveries",
              value: String(deliveries.filter((d) => d.status !== "confirmed").length),
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <p className="mt-2 font-display text-2xl font-bold text-card-foreground">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold">Job board</h2>
              {leads.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    No open delivery requests right now.
                  </CardContent>
                </Card>
              ) : (
                leads.map((lead) => (
                  <Card key={lead.id}>
                    <CardContent className="space-y-3 pt-6">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{lead.pickup_city || lead.pickup_address}</p>
                          <p className="text-sm text-muted-foreground">→ {lead.dropoff_city || lead.dropoff_address}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{lead.package_description}</p>
                        </div>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium capitalize">
                          {lead.status}
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div>
                          <Label>Quote (₦)</Label>
                          <Input
                            type="number"
                            min={1}
                            value={quoteAmounts[lead.id] ?? ""}
                            onChange={(e) =>
                              setQuoteAmounts((m) => ({ ...m, [lead.id]: e.target.value }))
                            }
                            placeholder="3000"
                          />
                        </div>
                        <div>
                          <Label>ETA (minutes)</Label>
                          <Input
                            type="number"
                            min={1}
                            value={quoteEtas[lead.id] ?? ""}
                            onChange={(e) =>
                              setQuoteEtas((m) => ({ ...m, [lead.id]: e.target.value }))
                            }
                            placeholder="90"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            className="w-full"
                            disabled={busy === lead.id}
                            onClick={() => void onQuote(lead.id)}
                          >
                            Send quote
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold">Active deliveries</h2>
              {deliveries.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    Accepted & paid jobs appear here.
                  </CardContent>
                </Card>
              ) : (
                deliveries.map((d) => (
                  <Card key={d.id}>
                    <CardContent className="space-y-3 pt-6">
                      <div className="flex justify-between gap-2">
                        <div>
                          <p className="font-mono text-sm font-semibold">{d.tracking_code}</p>
                          <p className="text-xs capitalize text-muted-foreground">{d.status}</p>
                        </div>
                      </div>
                      {!d.rider_id && riders.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {riders.map((r) => (
                            <Button
                              key={r.id}
                              size="sm"
                              variant="outline"
                              disabled={busy === d.id}
                              onClick={() => void onAssign(d.id, r.id)}
                            >
                              Assign {r.full_name}
                            </Button>
                          ))}
                        </div>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        {d.status === "assigned" ? (
                          <Button size="sm" onClick={() => void onAdvance(d, "picked_up")}>
                            Picked up
                          </Button>
                        ) : null}
                        {d.status === "picked_up" ? (
                          <Button size="sm" onClick={() => void onAdvance(d, "in_transit")}>
                            In transit
                          </Button>
                        ) : null}
                        {d.status === "in_transit" ? (
                          <Button size="sm" onClick={() => void onAdvance(d, "delivered")}>
                            Delivered
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold">Your quotes</h2>
              {quotes.slice(0, 8).map((q) => (
                <Card key={q.id}>
                  <CardContent className="flex items-center justify-between pt-6 text-sm">
                    <span className="capitalize text-muted-foreground">{q.status}</span>
                    <span className="font-semibold">{formatMoney(q.amount, q.currency)}</span>
                  </CardContent>
                </Card>
              ))}
            </section>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
