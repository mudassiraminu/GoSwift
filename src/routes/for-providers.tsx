import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, ClipboardCheck, Coins, MapPin, Star, Users } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/for-providers")({
  head: () => ({
    meta: [
      { title: "For delivery companies — GOSwift" },
      {
        name: "description",
        content:
          "Get verified, receive qualified delivery leads, manage riders, and get paid after confirmed delivery.",
      },
    ],
  }),
  component: ForProvidersPage,
});

const benefits = [
  {
    icon: ClipboardCheck,
    title: "Qualified job leads",
    body: "Receive requests from businesses already looking for delivery — not cold calls.",
  },
  {
    icon: BadgeCheck,
    title: "Verified badge",
    body: "Stand out to businesses once admin approves your company documents.",
  },
  {
    icon: Users,
    title: "Rider management",
    body: "Add riders, assign jobs, and keep status updates in one place.",
  },
  {
    icon: Coins,
    title: "Protected payouts",
    body: "Customer pays up front. You receive funds after successful, confirmed delivery.",
  },
  {
    icon: MapPin,
    title: "Your service areas",
    body: "Define cities and areas so you only see jobs you can actually cover.",
  },
  {
    icon: Star,
    title: "Build reputation",
    body: "Better service → better ratings → more trust → more opportunities.",
  },
];

function ForProvidersPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-secondary via-secondary/40 to-background">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
                For delivery companies
              </p>
              <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
                A new channel of customers — without abandoning the ones you already have.
              </h1>
              <p className="mt-5 text-lg text-muted-foreground">
                GOSwift sends you delivery jobs from businesses in your area. Quote your price,
                assign a rider, complete the job, and get paid after confirmation.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Register your company
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/">See how the marketplace works</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <b.icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 font-display text-base font-semibold text-card-foreground">
                  {b.title}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">{b.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-primary py-20 text-primary-foreground">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="font-display text-3xl font-bold">Getting verified takes three steps</h2>
            <div className="mt-10 grid gap-6 text-left sm:grid-cols-3">
              {[
                "Create your provider account and add company details.",
                "Upload registration and identity documents for review.",
                "Get approved, set service areas, and start quoting.",
              ].map((step, i) => (
                <div
                  key={step}
                  className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 p-5"
                >
                  <span className="font-display text-2xl font-bold text-accent">0{i + 1}</span>
                  <p className="mt-2 text-sm text-primary-foreground/85">{step}</p>
                </div>
              ))}
            </div>
            <Button asChild size="lg" variant="secondary" className="mt-10">
              <Link to="/auth" search={{ mode: "signup" }}>
                Start verification
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
