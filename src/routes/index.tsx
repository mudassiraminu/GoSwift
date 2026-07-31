import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  ClipboardList,
  CreditCard,
  MapPin,
  MessageSquareQuote,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GOSwift — Verified Delivery Marketplace" },
      {
        name: "description",
        content:
          "Post a delivery, compare quotes from verified delivery companies, track it live and pay securely with dispute protection.",
      },
      { property: "og:title", content: "GOSwift — Verified Delivery Marketplace" },
      {
        property: "og:description",
        content:
          "Compare quotes from verified delivery companies, track shipments and pay securely.",
      },
    ],
  }),
  component: HomePage,
});

const steps = [
  {
    icon: ClipboardList,
    title: "Post your delivery",
    body: "Enter pickup and destination details, package size and when it needs to move.",
  },
  {
    icon: MessageSquareQuote,
    title: "Compare quotes",
    body: "Verified delivery companies respond with pricing and estimated delivery times.",
  },
  {
    icon: Truck,
    title: "Track to the door",
    body: "A rider is assigned and you follow every status change until it is delivered.",
  },
  {
    icon: CreditCard,
    title: "Pay on confirmation",
    body: "Funds are released to the provider only after you confirm a successful delivery.",
  },
];

const trust = [
  {
    icon: BadgeCheck,
    title: "Verified companies only",
    body: "Every delivery company submits registration and identity documents that our team reviews before they appear in search.",
  },
  {
    icon: ShieldCheck,
    title: "Protected payments",
    body: "Payments are held until delivery is confirmed. Disputes are reviewed by the platform with evidence from both sides.",
  },
  {
    icon: Star,
    title: "Transparent ratings",
    body: "Ratings and reviews come from completed deliveries only, so the scores you see reflect real jobs.",
  },
  {
    icon: MapPin,
    title: "Local coverage",
    body: "Providers list the cities and areas they actually serve, so you only see companies that can reach you.",
  },
];

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-primary text-primary-foreground">
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/25 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-medium">
                <BadgeCheck className="h-3.5 w-3.5" /> Every provider is verified
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
                Send anything, with a delivery company you can actually trust.
              </h1>
              <p className="mt-5 max-w-xl text-base text-primary-foreground/75 sm:text-lg">
                GOSwift connects businesses and individuals with vetted delivery companies.
                Compare real quotes, assign a rider, track the journey and pay only when the parcel
                lands.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" variant="secondary">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Send a delivery
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <Link to="/for-providers">List your delivery company</Link>
                </Button>
              </div>
            </div>

            <div className="lg:pl-8">
              <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 p-6 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/60">
                  Live quote preview
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    { name: "Northline Couriers", price: "$18.50", eta: "45 min", rating: "4.9" },
                    { name: "Metro Swift Logistics", price: "$21.00", eta: "30 min", rating: "4.8" },
                    { name: "CityHaul Express", price: "$16.00", eta: "70 min", rating: "4.6" },
                  ].map((q) => (
                    <div
                      key={q.name}
                      className="flex items-center justify-between rounded-lg bg-background/95 p-4 text-foreground"
                    >
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                          {q.name}
                          <BadgeCheck className="h-4 w-4 shrink-0 text-accent" />
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ETA {q.eta} &middot; {q.rating} ★
                        </p>
                      </div>
                      <span className="font-display text-base font-bold">{q.price}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-primary-foreground/50">
                  Illustrative example. Real quotes come from verified providers in your area.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-foreground">How it works</h2>
            <p className="mt-3 text-muted-foreground">
              Four steps from request to payout — no phone tag, no guessing at prices.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Card key={s.title} className="border-border">
                <CardContent className="pt-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-accent">
                    Step {i + 1}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-card-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Trust */}
        <section className="bg-secondary/60 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold text-foreground">Built on trust and safety</h2>
              <p className="mt-3 text-muted-foreground">
                Handing over a parcel means handing over responsibility. Here is how we reduce the
                risk on both sides.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {trust.map((t) => (
                <div
                  key={t.title}
                  className="flex gap-4 rounded-xl border border-border bg-card p-6"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <t.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-card-foreground">{t.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{t.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Provider CTA */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="overflow-hidden rounded-2xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12">
            <h2 className="text-3xl font-bold">Run a delivery company?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-primary-foreground/75">
              Get verified once and start receiving delivery leads from customers in your service
              areas. Manage your riders, quotes and payouts from a single dashboard.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-8">
              <Link to="/auth" search={{ mode: "signup" }}>
                Register your company
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
