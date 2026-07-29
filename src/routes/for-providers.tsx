import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, ClipboardCheck, Coins, Users } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/for-providers")({
  head: () => ({
    meta: [
      { title: "For delivery companies — Dispatchly" },
      {
        name: "description",
        content:
          "Get verified, receive delivery jobs in your service areas, manage riders and get paid on Dispatchly.",
      },
      { property: "og:title", content: "For delivery companies — Dispatchly" },
      {
        property: "og:description",
        content: "Get verified, win delivery jobs and manage your riders on Dispatchly.",
      },
    ],
  }),
  component: ForProvidersPage,
});

const benefits = [
  {
    icon: ClipboardCheck,
    title: "Qualified job leads",
    body: "Only see delivery requests inside the service areas and service types you actually cover.",
  },
  {
    icon: BadgeCheck,
    title: "A verified badge",
    body: "Submit your registration and identity documents once. Verified companies rank higher and win more jobs.",
  },
  {
    icon: Users,
    title: "Rider management",
    body: "Add riders to your company, assign deliveries and follow their progress in one place.",
  },
  {
    icon: Coins,
    title: "Clear payouts",
    body: "Platform commission is shown upfront and payouts are tracked per completed delivery.",
  },
];

function ForProvidersPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-secondary/60">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
                Grow your delivery company with steady, verified demand.
              </h1>
              <p className="mt-5 text-lg text-muted-foreground">
                Dispatchly sends you delivery jobs from customers in your area. Quote your price,
                assign a rider, complete the job and get paid.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Register your company
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/">See how it works</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-6 md:grid-cols-2">
            {benefits.map((b) => (
              <Card key={b.title}>
                <CardContent className="flex gap-4 pt-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <b.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-card-foreground">{b.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{b.body}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-primary py-20 text-primary-foreground">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold">Getting verified takes three steps</h2>
            <div className="mt-10 grid gap-6 text-left sm:grid-cols-3">
              {[
                "Create your provider account and add company details.",
                "Upload registration and identity documents for review.",
                "Get approved, set service areas and start quoting.",
              ].map((step, i) => (
                <div
                  key={step}
                  className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 p-5"
                >
                  <span className="font-display text-2xl font-bold text-accent">0{i + 1}</span>
                  <p className="mt-2 text-sm text-primary-foreground/80">{step}</p>
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
