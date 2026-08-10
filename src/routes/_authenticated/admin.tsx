import { createFileRoute } from "@tanstack/react-router";
import { Building2, LayoutDashboard, Loader2, Package, Phone } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { RoleGuard } from "@/components/role-guard";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminAddCompany,
  adminPostPrice,
  adminSetCourierContact,
  formatMoney,
  listAllCompaniesAdmin,
  listAllRequests,
} from "@/lib/marketplace/api";
import { parseCompanyChoice } from "@/lib/marketplace/dispatch";
import { useAuth } from "@/lib/supabase/auth";
import type { DeliveryProvider, DeliveryRequest } from "@/lib/supabase/types";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — GOSwift" },
      { name: "description", content: "Manage companies and post prices for customer requests." },
    ],
  }),
  component: () => (
    <RoleGuard role="admin">
      <AdminDashboard />
    </RoleGuard>
  ),
});

const nav: NavItem[] = [
  { label: "Requests", to: "/admin", icon: Package },
  { label: "Companies", to: "/admin", icon: Building2 },
  { label: "Overview", to: "/admin", icon: LayoutDashboard },
];

function AdminDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [companies, setCompanies] = useState<DeliveryProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({});
  const [courierName, setCourierName] = useState<Record<string, string>>({});
  const [courierPhone, setCourierPhone] = useState<Record<string, string>>({});
  const [newCo, setNewCo] = useState({
    company_name: "",
    phone: "",
    office_address: "",
    city: "",
    contact_person: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [reqs, cos] = await Promise.all([listAllRequests(), listAllCompaniesAdmin()]);
      setRequests(reqs);
      setCompanies(cos.filter((c) => c.company_name !== "GOSwift Independent Couriers"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Load failed");
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

  async function addCompany() {
    if (!user || !newCo.company_name.trim()) {
      toast.error("Company name required");
      return;
    }
    setBusy("add-co");
    try {
      await adminAddCompany(user.id, newCo);
      toast.success("Company added — customers can select it");
      setNewCo({ company_name: "", phone: "", office_address: "", city: "", contact_person: "" });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add company");
    } finally {
      setBusy(null);
    }
  }

  async function postPrice(req: DeliveryRequest) {
    if (!user) return;
    const amount = Number(priceDraft[req.id]);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid price");
      return;
    }
    setBusy(req.id + "-price");
    try {
      await adminPostPrice({ request: req, amount, adminId: user.id });
      toast.success(`Price ${formatMoney(amount)} sent to customer`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post price");
    } finally {
      setBusy(null);
    }
  }

  async function saveCourier(req: DeliveryRequest) {
    if (!user) return;
    const parsed = parseCompanyChoice(req.notes);
    if (!parsed.providerId) {
      toast.error("No company on this request");
      return;
    }
    const name = courierName[req.id]?.trim();
    const phone = courierPhone[req.id]?.trim();
    if (!name || !phone) {
      toast.error("Courier name and phone required");
      return;
    }
    setBusy(req.id + "-courier");
    try {
      await adminSetCourierContact({
        requestId: req.id,
        providerId: parsed.providerId,
        customerId: req.customer_id,
        adminId: user.id,
        courierName: name,
        courierPhone: phone,
      });
      toast.success("Courier details saved — customer sees them after payment");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <DashboardShell
      title="GOSwift ops"
      subtitle="Companies · contact offline · post price · courier details"
      navItems={nav}
    >
      <div className="mx-auto max-w-5xl space-y-10">
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold">Add delivery company</h2>
          <Card className="rounded-2xl">
            <CardContent className="grid gap-3 pt-6 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label>Company name</Label>
                <Input
                  value={newCo.company_name}
                  onChange={(e) => setNewCo((s) => ({ ...s, company_name: e.target.value }))}
                  placeholder="Swift Logistics"
                />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input
                  value={newCo.phone}
                  onChange={(e) => setNewCo((s) => ({ ...s, phone: e.target.value }))}
                  placeholder="+234…"
                />
              </div>
              <div className="space-y-1">
                <Label>City</Label>
                <Input
                  value={newCo.city}
                  onChange={(e) => setNewCo((s) => ({ ...s, city: e.target.value }))}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Office address</Label>
                <Input
                  value={newCo.office_address}
                  onChange={(e) => setNewCo((s) => ({ ...s, office_address: e.target.value }))}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Contact person</Label>
                <Input
                  value={newCo.contact_person}
                  onChange={(e) => setNewCo((s) => ({ ...s, contact_person: e.target.value }))}
                />
              </div>
              <Button
                className="sm:col-span-2"
                disabled={busy === "add-co"}
                onClick={() => void addCompany()}
              >
                {busy === "add-co" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save company to app list
              </Button>
            </CardContent>
          </Card>
          {companies.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {companies.map((c) => (
                <Card key={c.id} className="rounded-2xl">
                  <CardContent className="pt-5 text-sm">
                    <p className="font-semibold">{c.company_name}</p>
                    <p className="mt-1 text-muted-foreground">
                      {[c.city, c.office_address, c.phone].filter(Boolean).join(" · ")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </section>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <section className="space-y-3">
            <h2 className="font-display text-lg font-bold">
              Requests ({openReqs.length} open / quoted)
            </h2>
            {openReqs.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  No open requests.
                </CardContent>
              </Card>
            ) : (
              openReqs.map((req) => {
                const company = parseCompanyChoice(req.notes);
                return (
                  <Card key={req.id} className="rounded-2xl">
                    <CardContent className="space-y-4 pt-6">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">
                            {req.pickup_city || req.pickup_address} →{" "}
                            {req.dropoff_city || req.dropoff_address}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Company:{" "}
                            <span className="font-medium text-foreground">
                              {company.companyName || req.service_type || "—"}
                            </span>
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {req.package_description || "No package notes"}
                          </p>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>

                      <div className="rounded-xl bg-secondary/70 p-3 text-sm">
                        <p className="text-xs font-medium uppercase text-muted-foreground">
                          Call customer / pickup
                        </p>
                        {req.pickup_phone ? (
                          <a
                            href={`tel:${req.pickup_phone}`}
                            className="mt-1 inline-flex items-center gap-2 text-primary hover:underline"
                          >
                            <Phone className="h-4 w-4" />
                            {req.pickup_phone}
                            {req.pickup_contact ? ` (${req.pickup_contact})` : ""}
                          </a>
                        ) : (
                          <p className="text-muted-foreground">No pickup phone</p>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground">
                          {req.pickup_address} → {req.dropoff_address}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                        <div className="space-y-1">
                          <Label className="text-xs">Price from company (NGN)</Label>
                          <Input
                            type="number"
                            min={0}
                            placeholder="e.g. 3500"
                            value={priceDraft[req.id] ?? ""}
                            onChange={(e) =>
                              setPriceDraft((m) => ({ ...m, [req.id]: e.target.value }))
                            }
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            disabled={busy === req.id + "-price"}
                            onClick={() => void postPrice(req)}
                          >
                            Post price to customer
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Courier name (from company)</Label>
                          <Input
                            value={courierName[req.id] ?? ""}
                            onChange={(e) =>
                              setCourierName((m) => ({ ...m, [req.id]: e.target.value }))
                            }
                            placeholder="Sani Musa"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Courier phone</Label>
                          <Input
                            value={courierPhone[req.id] ?? ""}
                            onChange={(e) =>
                              setCourierPhone((m) => ({ ...m, [req.id]: e.target.value }))
                            }
                            placeholder="+234…"
                          />
                        </div>
                        <Button
                          className="sm:col-span-2"
                          variant="outline"
                          disabled={busy === req.id + "-courier"}
                          onClick={() => void saveCourier(req)}
                        >
                          Save courier (shown after customer pays)
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
