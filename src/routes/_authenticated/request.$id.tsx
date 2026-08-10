import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MapPin,
  Phone,
  Star,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { MobileAppShell } from "@/components/mobile/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  confirmDeliveryAndPayout,
  formatMoney,
  getDeliveryByRequest,
  getPaymentForRequest,
  getRequest,
  listQuotesForRequest,
  listStatusHistory,
  payAdminPostedPrice,
  submitRating,
  updateDeliveryStatus,
} from "@/lib/marketplace/api";
import { parseCompanyChoice, parseCourierFromNotes } from "@/lib/marketplace/dispatch";
import { useAuth } from "@/lib/supabase/auth";
import type {
  Delivery,
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
      setQuotes(await listQuotesForRequest(id));
      setPayment(await getPaymentForRequest(id));
      const del = await getDeliveryByRequest(id);
      setDelivery(del);
      if (del) setHistory(await listStatusHistory(del.id));
      else setHistory([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function onPay() {
    if (!user || !payment || !request) return;
    const company = parseCompanyChoice(request.notes);
    const providerId =
      company.providerId || quotes.find((q) => q.status === "accepted")?.provider_id;
    if (!providerId) {
      toast.error("Missing company on this request");
      return;
    }
    setBusy("pay");
    try {
      await payAdminPostedPrice({
        paymentId: payment.id,
        requestId: request.id,
        customerId: user.id,
        amount: payment.amount,
        providerId,
      });
      toast.success("Payment received. Courier details will appear when ready.");
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
        await updateDeliveryStatus(delivery.id, "delivered", user.id);
        const d = await getDeliveryByRequest(id);
        if (d) await confirmDeliveryAndPayout(d, user.id);
      }
      toast.success("Delivery confirmed");
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

  const company = parseCompanyChoice(request.notes);
  const accepted = quotes.find((q) => q.status === "accepted");
  const courierNote = [...history].reverse().find((h) => h.note?.includes("[courier:"));
  const courier = parseCourierFromNotes(courierNote?.note);
  const paid = payment?.status === "paid";

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
            <p className="text-xs capitalize text-muted-foreground">
              {request.status.replace("_", " ")}
            </p>
          </div>
        </header>
      }
    >
      <div className="space-y-5 px-5 pb-32 pt-4">
        <section className="gs-rise rounded-3xl bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-muted-foreground">Company</p>
          <p className="font-semibold">
            {company.companyName || request.service_type || "Selected partner"}
          </p>
          <div className="mt-4 flex gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 text-sm">
              <p className="font-medium">{request.pickup_address}</p>
              <p className="text-muted-foreground">{request.pickup_city}</p>
              <p className="mt-3 font-medium">{request.dropoff_address}</p>
              <p className="text-muted-foreground">{request.dropoff_city}</p>
              {request.package_description ? (
                <p className="mt-3 text-muted-foreground">{request.package_description}</p>
              ) : null}
            </div>
          </div>
        </section>

        {request.status === "open" && !accepted ? (
          <div className="rounded-3xl border border-dashed border-border p-6 text-center">
            <p className="font-display font-semibold">Waiting for price</p>
            <p className="mt-2 text-sm text-muted-foreground">
              We are contacting the company. When they confirm the price, it will appear here for
              payment.
            </p>
          </div>
        ) : null}

        {payment?.status === "pending" && accepted ? (
          <section className="rounded-3xl border border-primary/30 bg-primary/5 p-4">
            <h2 className="font-display font-bold">Price ready</h2>
            <p className="mt-1 font-display text-2xl font-bold text-primary">
              {formatMoney(payment.amount, payment.currency)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Agreed with {company.companyName || "the company"}. Pay to confirm the job.
            </p>
            <Button
              className="mt-4 h-12 w-full rounded-xl"
              disabled={busy === "pay"}
              onClick={() => void onPay()}
            >
              {busy === "pay" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Pay now
            </Button>
          </section>
        ) : null}

        {paid && courier.name ? (
          <section className="rounded-3xl bg-card p-4 shadow-sm">
            <h2 className="font-display font-bold">Your courier</h2>
            <div className="mt-3 flex items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <User className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold">{courier.name}</p>
                {courier.phone ? (
                  <a
                    href={`tel:${courier.phone}`}
                    className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    {courier.phone}
                  </a>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {paid && !courier.name ? (
          <div className="rounded-3xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Payment received. Courier details will show when the company confirms who is coming.
          </div>
        ) : null}

        {delivery ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold">Tracking</h2>
              {delivery.tracking_code ? (
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
                  {delivery.tracking_code}
                </span>
              ) : null}
            </div>
            <ul className="space-y-2">
              {history
                .filter((h) => !h.note?.startsWith("[courier:"))
                .map((h) => (
                  <li key={h.id} className="flex gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="capitalize">{h.status.replace("_", " ")}</span>
                  </li>
                ))}
            </ul>
            {delivery.status !== "confirmed" && delivery.status !== "cancelled" ? (
              <Button
                className="h-12 w-full rounded-xl"
                disabled={busy === "confirm"}
                onClick={() => void onConfirm()}
              >
                Confirm delivery received
              </Button>
            ) : null}
            {delivery.status === "confirmed" ? (
              <div className="rounded-3xl bg-card p-4 shadow-sm">
                <h3 className="font-display font-semibold">Rate this delivery</h3>
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
      </div>
    </MobileAppShell>
  );
}
