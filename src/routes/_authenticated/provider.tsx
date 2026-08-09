import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  Building2,
  CreditCard,
  Loader2,
  MessageSquareQuote,
  Plus,
  Truck,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { RoleGuard } from "@/components/role-guard";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth";
import type {
  Delivery,
  DeliveryProvider,
  DeliveryQuote,
  DeliveryRequest,
  ProviderServiceArea,
  Rider,
} from "@/lib/supabase/types";

export const Route = createFileRoute("/_authenticated/provider")({
  head: () => ({
    meta: [
      { title: "Provider dashboard — GOSwift" },
      {
        name: "description",
        content: "Manage company profile, leads, quotes, riders and deliveries.",
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
  const [areas, setAreas] = useState<ProviderServiceArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [quoteAmounts, setQuoteAmounts] = useState<Record<string, string>>({});
  const [quoteEtas, setQuoteEtas] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [terms, setTerms] = useState("");
  const [description, setDescription] = useState("");
  const [areaCity, setAreaCity] = useState("");
  const [areaName, setAreaName] = useState("");
  const [riderName, setRiderName] = useState("");
  const [riderPhone, setRiderPhone] = useState("");

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
      setCompanyName(p.company_name);
      setCity(p.city ?? "");
      setPhone(p.phone ?? "");
      setTerms(p.delivery_terms ?? "");
      setDescription(p.description ?? "");

      const [openReqs, qs, dels, rs, ar] = await Promise.all([
        listOpenRequestsForProviders(),
        listQuotesForProvider(p.id),
        listDeliveriesForProvider(p.id),
        listRiders(p.id),
        supabase.from("provider_service_areas").select("*").eq("provider_id", p.id),
      ]);
      setLeads(openReqs);
      setQuotes(qs);
      setDeliveries(dels);
      setRiders(rs);
      setAreas((ar.data ?? []) as ProviderServiceArea[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load provider data");
    } finally {
      setLoading(false);
    }
  }, [user, profile, refresh]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveProfile() {
    if (!provider) return;
    setBusy("profile");
    try {
      const { error } = await supabase
        .from("delivery_providers")
        .update({
          company_name: companyName.trim(),
          city: city.trim() || null,
          phone: phone.trim() || null,
          delivery_terms: terms.trim() || null,
          description: description.trim() || null,
        })
        .eq("id", provider.id);
      if (error) throw error;
      toast.success("Company profile saved");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function addArea() {
    if (!provider || !areaCity.trim()) {
      toast.error("City is required");
      return;
    }
    setBusy("area");
    try {
      const { error } = await supabase.from("provider_service_areas").insert({
        provider_id: provider.id,
        city: areaCity.trim(),
        area: areaName.trim() || null,
        country: "Nigeria",
      });
      if (error) throw error;
      setAreaCity("");
      setAreaName("");
      toast.success("Service area added");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add area");
    } finally {
      setBusy(null);
    }
  }

  async function addRider() {
    if (!provider || !riderName.trim()) {
      toast.error("Rider name is required");
      return;
    }
    setBusy("rider");
    try {
      const { error } = await supabase.from("riders").insert({
        provider_id: provider.id,
        full_name: riderName.trim(),
        phone: riderPhone.trim() || null,
        status: "active",
      });
      if (error) throw error;
      setRiderName("");
      setRiderPhone("");
      toast.success("Rider added — link a user account later for app access");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add rider");
    } finally {
      setBusy(null);
    }
  }

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
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold">Verification status</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Only verified companies appear as trusted options to businesses.
              </p>
            </div>
            {provider ? <StatusBadge status={provider.status} /> : null}
          </div>
          {!verified ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Complete your profile below. An admin will review and grant the verified badge.
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "Open jobs", value: String(leads.length) },
            { label: "Quotes sent", value: String(quotes.length) },
            { label: "Riders", value: String(riders.length) },
            {
              label: "Active jobs",
              value: String(deliveries.filter((d) => d.status !== "confirmed").length),
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

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold">Company profile</h2>
              <Card className="rounded-2xl">
                <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Company name</Label>
                    <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Lagos" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234…" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>About</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      placeholder="What types of deliveries do you handle?"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Delivery terms</Label>
                    <Textarea
                      value={terms}
                      onChange={(e) => setTerms(e.target.value)}
                      rows={2}
                      placeholder="Same-day within city, fragile handling…"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button disabled={busy === "profile"} onClick={() => void saveProfile()}>
                      Save profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold">Service areas</h2>
              <Card className="rounded-2xl">
                <CardContent className="space-y-4 pt-6">
                  {areas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No areas yet — add cities you cover.</p>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {areas.map((a) => (
                        <li
                          key={a.id}
                          className="rounded-full bg-secondary px-3 py-1 text-xs font-medium"
                        >
                          {a.city}
                          {a.area ? ` · ${a.area}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Input
                      placeholder="City"
                      value={areaCity}
                      onChange={(e) => setAreaCity(e.target.value)}
                    />
                    <Input
                      placeholder="Area (optional)"
                      value={areaName}
                      onChange={(e) => setAreaName(e.target.value)}
                    />
                    <Button variant="outline" disabled={busy === "area"} onClick={() => void addArea()}>
                      <Plus className="h-4 w-4" /> Add area
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold">Riders</h2>
              <Card className="rounded-2xl">
                <CardContent className="space-y-4 pt-6">
                  {riders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Add riders here. They remain under your company — no public rider signup.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {riders.map((r) => (
                        <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                          <span className="font-medium">{r.full_name}</span>
                          <span className="text-muted-foreground">{r.phone || "No phone"}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Input
                      placeholder="Rider name"
                      value={riderName}
                      onChange={(e) => setRiderName(e.target.value)}
                    />
                    <Input
                      placeholder="Phone"
                      value={riderPhone}
                      onChange={(e) => setRiderPhone(e.target.value)}
                    />
                    <Button variant="outline" disabled={busy === "rider"} onClick={() => void addRider()}>
                      <Plus className="h-4 w-4" /> Add rider
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold">Job board</h2>
              {leads.length === 0 ? (
                <Card className="rounded-2xl">
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    No open delivery requests right now.
                  </CardContent>
                </Card>
              ) : (
                leads.map((lead) => (
                  <Card key={lead.id} className="rounded-2xl">
                    <CardContent className="space-y-3 pt-6">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{lead.pickup_city || lead.pickup_address}</p>
                          <p className="text-sm text-muted-foreground">
                            → {lead.dropoff_city || lead.dropoff_address}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {lead.package_description}
                          </p>
                        </div>
                        <StatusBadge status={lead.status} />
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
                          <Label>ETA (min)</Label>
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
                <Card className="rounded-2xl">
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    Accepted & paid jobs appear here.
                  </CardContent>
                </Card>
              ) : (
                deliveries.map((d) => (
                  <Card key={d.id} className="rounded-2xl">
                    <CardContent className="space-y-3 pt-6">
                      <div className="flex justify-between gap-2">
                        <p className="font-mono text-sm font-semibold">{d.tracking_code}</p>
                        <StatusBadge status={d.status} />
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

            {quotes.length > 0 ? (
              <section className="space-y-3">
                <h2 className="font-display text-lg font-bold">Your quotes</h2>
                {quotes.slice(0, 8).map((q) => (
                  <Card key={q.id} className="rounded-2xl">
                    <CardContent className="flex items-center justify-between pt-6 text-sm">
                      <StatusBadge status={q.status} />
                      <span className="font-semibold">{formatMoney(q.amount, q.currency)}</span>
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
