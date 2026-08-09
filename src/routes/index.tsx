import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  Star,
  Store,
  Truck,
} from "lucide-react";
import { useEffect } from "react";

import { AppLogo } from "@/components/app-logo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/supabase/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GOSwift — Your trusted delivery marketplace" },
      {
        name: "description",
        content:
          "Connect small businesses with verified delivery companies. Find. Compare. Accept. Pay. Deliver.",
      },
      { property: "og:title", content: "GOSwift — Trusted delivery marketplace" },
      {
        property: "og:description",
        content:
          "Stop hunting riders on WhatsApp. Get quotes from verified delivery companies, pay securely, and track every package.",
      },
    ],
  }),
  component: HomePage,
});

const STEPS = [
  {
    n: "01",
    title: "Enter pickup & drop-off",
    body: "Tell us where the package starts and where it needs to land.",
  },
  {
    n: "02",
    title: "Compare verified providers",
    body: "See company ratings, service areas, and clear delivery terms.",
  },
  {
    n: "03",
    title: "Accept a quote & pay",
    body: "Payment is held by GOSwift until the delivery is confirmed.",
  },
  {
    n: "04",
    title: "Track & confirm",
    body: "Follow progress live. Confirm receipt — then the provider is paid.",
  },
];

const TRUST = [
  {
    icon: BadgeCheck,
    title: "Verified companies",
    body: "We work with delivery companies — not random individuals on the street.",
  },
  {
    icon: Lock,
    title: "Payment protection",
    body: "Funds are held until you confirm successful delivery.",
  },
  {
    icon: Star,
    title: "Ratings & reputation",
    body: "Good service earns better ratings and more opportunities.",
  },
  {
    icon: ShieldCheck,
    title: "Dispute process",
    body: "Structured resolution instead of endless WhatsApp arguments.",
  },
];

function HomePage() {
  const { user, loading, homePath } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      void navigate({ to: homePath, replace: true });
    }
  }, [loading, user, homePath, navigate]);

  if (loading || user) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <AppLogo className="h-16 w-16 gs-pop" labelled={false} />
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl gs-blob" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-accent/40 blur-3xl gs-blob" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="gs-rise">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Trusted delivery marketplace
            </p>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
              Find. Compare.
              <br />
              <span className="text-primary">Accept. Pay. Deliver.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              GOSwift connects small businesses with verified delivery companies. Stop searching
              WhatsApp for riders — get clear quotes, protected payments, and full accountability.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="gs-glow">
                <Link to="/auth" search={{ mode: "signup" }}>
                  I need deliveries
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/for-providers">I run a delivery company</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Verified providers
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Held payments
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Live tracking
              </span>
            </div>
          </div>

          <div className="gs-rise relative mx-auto w-full max-w-md gs-delay-150">
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-2xl shadow-primary/10">
              <div className="flex items-center gap-3">
                <AppLogo className="h-12 w-12 rounded-2xl" labelled={false} />
                <div>
                  <p className="font-display text-lg font-bold">GOSwift</p>
                  <p className="text-xs text-muted-foreground">Business → Provider → Rider</p>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {[
                  { icon: Store, label: "Business posts a job", sub: "Pickup + drop-off + package" },
                  { icon: Building2, label: "Verified company quotes", sub: "Price + ETA in ₦" },
                  { icon: Lock, label: "Payment held securely", sub: "Released after confirm" },
                  { icon: Truck, label: "Rider delivers", sub: "Status updates live" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center gap-3 rounded-2xl bg-secondary/70 p-3"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
                      <row.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{row.label}</p>
                      <p className="text-xs text-muted-foreground">{row.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold text-foreground">
            Delivery shouldn&apos;t be a daily headache
          </h2>
          <p className="mt-3 text-muted-foreground">
            Fashion sellers, food vendors, online shops and retailers waste time calling around for
            riders, unclear prices, and unknown faces. GOSwift replaces the chaos with a simple
            marketplace process.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Hard to know which company to trust",
            "Unclear or inconsistent prices",
            "No idea who will actually deliver",
            "Little accountability when things go wrong",
            "WhatsApp threads become confusing",
            "Hours lost hunting for availability",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-border bg-card p-5 text-sm text-card-foreground shadow-sm"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-secondary/50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center font-display text-3xl font-bold text-foreground">How it works</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Four steps from request to confirmed delivery — designed for businesses without their own
            fleet.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-3xl bg-card p-6 shadow-sm">
                <span className="font-display text-2xl font-bold text-primary">{s.n}</span>
                <h3 className="mt-3 font-display text-base font-semibold text-card-foreground">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-center font-display text-3xl font-bold">The GOSwift trust model</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.title} className="rounded-3xl border border-border bg-card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <t.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display font-semibold">{t.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <MapPin className="mx-auto h-8 w-8 opacity-80" />
          <h2 className="mt-4 font-display text-3xl font-bold">
            Make reliable delivery as easy as ordering online
          </h2>
          <p className="mt-3 text-primary-foreground/80">
            Open GOSwift → enter locations → choose a verified provider → get a quote → accept → pay
            → deliver.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth" search={{ mode: "signup" }}>
                Start as a business
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to="/for-providers">Register your company</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
