import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Loader2,
  MapPin,
  Star,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { MobileAppShell } from "@/components/mobile/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  acceptQuote,
  completePaymentStub,
  confirmDeliveryAndPayout,
  formatMoney,
  getDeliveryByRequest,
  getPaymentForRequest,
  getProvider,
  getRequest,
  listQuotesForRequest,
  listStatusHistory,
  rejectQuote,
  submitRating,
  updateDeliveryStatus,
} from "@/lib/marketplace/api";
import { useAuth } from "@/lib/supabase/auth";
import type {
  Delivery,
  DeliveryProvider,
  DeliveryQuote,
  DeliveryRequest,
  DeliveryStatusHistory,
  Payment,
} from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/request/$id")({
  head: () => ({
    meta: [{ title: "Delivery request — GOSwift" }],
  }),
  component: () => (
    <RoleGuard role="customer">
      <RequestDetailPage />
    </RoleGuard>
  ),
});

function RequestDetailPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<DeliveryRequest | null>(null);
  const [quotes, setQuotes] = useState<DeliveryQuote[]>([]);
  const [providers, setProviders] = useState<Record<string, DeliveryProvider>>({});
  const [payment, setPayment] = useState<Payment | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [history, setHistory] = useState<DeliveryStatusHistory[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const req = await getRequest(id);
      setRequest(req);
      const qs = await listQuotesForRequest(id);
      setQuotes(qs);
      const map: Record<string, DeliveryProvider> = {};
      await Promise.all(
        qs.map(async (q) => {
          if (!map[q.provider_id]) {
            try {
              map[q.provider_id] = await getProvider(q.provider_id);
            } catch {
              /* ignore */
            }
          }
        }),
      );
      setProviders(map);
      const pay = await getPaymentForRequest(id);
      setPayment(pay);
      const del = await getDeliveryByRequest(id);
      setDelivery(del);
      if (del) setHistory(await listStatusHistory(del.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load request");
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function onAccept(q: DeliveryQuote) {
    if (!user) return;
    setBusy(q.id);
    try {
      const res = await acceptQuote(q, user.id);
      setPayment(res.payment);
      toast.success("Quote accepted — complete payment to secure the delivery.");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not accept quote");
    } finally {
      setBusy(null);
    }
  }

  async function onReject(q: DeliveryQuote) {
    setBusy(q.id);
    try {
      await rejectQuote(q.id);
      toast.message("Quote rejected");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reject");
    } finally {
      setBusy(null);
    }
  }

  async function onPay() {
    if (!user || !payment || !quotes.find((q) => q.status === "accepted")) return;
    const accepted = quotes.find((q) => q.status === "accepted")!;
    setBusy("pay");
    try {
      await completePaymentStub({
        paymentId: payment.id,
        quote: accepted,
        customerId: user.id,
      });
      toast.success("Payment held securely. Delivery is live.");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setBusy(null);
    }
  }

  async function onConfirm() {
    if (!user || !delivery) return;
    setBusy("confirm");
    try {
      if (delivery.status === "delivered") {
        await confirmDeliveryAndPayout(delivery, user.id);
      } else {
        await updateDeliveryStatus(delivery.id, "delivered", user.id, "Marked delivered");
        const d = await getDeliveryByRequest(id);
        if (d) await confirmDeliveryAndPayout(d, user.id);
      }
      toast.success("Delivery confirmed. Provider payout queued.");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Confirm failed");
    } finally {
      setBusy(null);
    }
  }

  async function onRate() {
    if (!user || !delivery) return;
    setBusy("rate");
    try {
      await submitRating({
        delivery_id: delivery.id,
        rater_id: user.id,
        provider_id: delivery.provider_id,
        score: rating,
        review: review || undefined,
      });
      toast.success("Thanks for your rating!");
      setReview("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rating failed");
    } finally {
      setBusy(null);
    }
  }

  if (loading || !request) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  const accepted = quotes.find((q) => q.status === "accepted");
  const pendingQuotes = quotes.filter((q) => q.status === "pending");

  return (
    <MobileAppShell
      header={
        <header className="pt-safe flex items-center gap-3 border-b border-border bg-background px-4 pb-3">
          <Link
            to="/dashboard"
            className="tap-scale flex h-10 w-10 items-center justify-center rounded-xl bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-bold">Request</h1>
            <p className="text-xs capitalize text-muted-foreground">{request.status.replace("_", " ")}</p>
          </div>
        </header>
      }
    >
      <div className="space-y-5 px-5 pb-32 pt-4">
        <section className="gs-rise rounded-3xl bg-card p-4 shadow-sm">
          <div className="flex gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 text-sm">
              <p className="font-medium text-foreground">{request.pickup_address}</p>
              <p className="text-muted-foreground">{request.pickup_city}</p>
              <p className="mt-3 font-medium text-foreground">{request.dropoff_address}</p>
              <p className="text-muted-foreground">{request.dropoff_city}</p>
              {request.package_description ? (
                <p className="mt-3 text-muted-foreground">{request.package_description}</p>
              ) : null}
            </div>
          </div>
        </section>

        {pendingQuotes.length > 0 ? (
          <section className="space-y-3">
            <h2 className="font-display text-base font-bold">Quotes</h2>
            {pendingQuotes.map((q) => {
              const p = providers[q.provider_id];
              return (
                <div key={q.id} className="rounded-3xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="flex items-center gap-1.5 font-semibold">
                        {p?.company_name ?? "Provider"}
                        {p?.status === "verified" ? (
                          <BadgeCheck className="h-4 w-4 text-primary" />
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p ? `${p.avg_rating.toFixed(1)} ★ · ${p.completed_count} jobs` : null}
                        {q.eta_minutes ? ` · ~${q.eta_minutes} min` : null}
                      </p>
                    </div>
                    <p className="font-display text-lg font-bold text-primary">
                      {formatMoney(q.amount, q.currency)}
                    </p>
                  </div>
                  {q.message ? <p className="mt-2 text-sm text-muted-foreground">{q.message}</p> : null}
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 rounded-xl"
                      disabled={busy === q.id}
                      onClick={() => void onAccept(q)}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 rounded-xl"
                      disabled={busy === q.id}
                      onClick={() => void onReject(q)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </section>
        ) : null}

        {accepted && payment?.status === "pending" ? (
          <section className="rounded-3xl border border-primary/30 bg-primary/5 p-4">
            <h2 className="font-display font-bold">Secure payment</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pay {formatMoney(accepted.amount, accepted.currency)}. Funds are held until you confirm
              delivery — then the provider is paid (minus platform commission).
            </p>
            <Button
              className="mt-4 h-12 w-full rounded-xl"
              disabled={busy === "pay"}
              onClick={() => void onPay()}
            >
              {busy === "pay" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Pay & hold securely
            </Button>
          </section>
        ) : null}

        {delivery ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold">Tracking</h2>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
                {delivery.tracking_code}
              </span>
            </div>
            <p className="text-sm capitalize text-muted-foreground">
              Status: {delivery.status.replace("_", " ")}
            </p>
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h.id} className="flex gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <span className="font-medium capitalize">{h.status.replace("_", " ")}</span>
                    {h.note ? <span className="text-muted-foreground"> — {h.note}</span> : null}
                  </span>
                </li>
              ))}
            </ul>

            {delivery.status !== "confirmed" && delivery.status !== "cancelled" ? (
              <Button
                className="h-12 w-full rounded-xl"
                disabled={busy === "confirm"}
                onClick={() => void onConfirm()}
              >
                {busy === "confirm" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Confirm delivery received
              </Button>
            ) : null}

            {delivery.status === "confirmed" ? (
              <div className="rounded-3xl bg-card p-4 shadow-sm">
                <h3 className="font-display font-semibold">Rate this provider</h3>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} type="button" onClick={() => setRating(s)} className="tap-scale p-1">
                      <Star
                        className={cn(
                          "h-7 w-7",
                          s <= rating ? "fill-primary text-primary" : "text-muted-foreground",
                        )}
                      />
                    </button>
                  ))}
                </div>
                <Label className="mt-3 block" htmlFor="review">
                  Review (optional)
                </Label>
                <Input
                  id="review"
                  className="mt-1"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="How was the delivery?"
                />
                <Button
                  className="mt-3 w-full rounded-xl"
                  disabled={busy === "rate"}
                  onClick={() => void onRate()}
                >
                  Submit rating
                </Button>
              </div>
            ) : null}
          </section>
        ) : null}

        {quotes.length === 0 && !delivery ? (
          <div className="rounded-3xl border border-dashed border-border p-8 text-center">
            <p className="font-display font-semibold">Waiting for quotes</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Verified delivery companies in your area can send prices. Pull to refresh from the home
              screen or check back shortly.
            </p>
          </div>
        ) : null}
      </div>
    </MobileAppShell>
  );
}
