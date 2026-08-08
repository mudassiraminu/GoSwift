import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  ChevronRight,
  Loader2,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useEffect } from "react";

import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/supabase/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GOSwift — Fast Parcel Delivery App" },
      {
        name: "description",
        content:
          "GOSwift delivers your parcels quickly with verified couriers, live tracking and secure payment. Available on iOS and Android.",
      },
      { property: "og:title", content: "GOSwift — Fast Parcel Delivery App" },
      {
        property: "og:description",
        content:
          "GOSwift delivers your parcels quickly with verified couriers, live tracking and secure payment. Available on iOS and Android.",
      },
    ],
  }),
  component: SplashPage,
});

function HeroArt() {
  return (
    <div className="relative mt-2 flex h-52 w-full max-w-[17rem] items-center justify-center sm:h-56">
      {/* Soft road line */}
      <div className="absolute inset-x-4 bottom-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Drifting courier */}
      <span className="gs-drift absolute bottom-7 left-0 flex items-center gap-1">
        <Truck className="h-6 w-6 text-primary" strokeWidth={2.25} />
        <span className="h-1.5 w-1.5 rounded-full bg-primary/50" />
      </span>

      {/* Destination pin with pulse */}
      <span className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center">
        <span className="gs-ring absolute h-11 w-11 rounded-full bg-primary/35" />
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-md shadow-primary/15 ring-1 ring-border">
          <MapPin className="h-4.5 w-4.5 text-primary" strokeWidth={2.25} />
        </span>
      </span>

      {/* Brand mark */}
      <div className="gs-float-slow relative flex h-40 w-40 items-center justify-center sm:h-44 sm:w-44">
        <span className="absolute inset-2 rounded-[2.25rem] bg-primary/15 blur-2xl" />
        <span className="absolute inset-6 rounded-[1.75rem] bg-accent/30 blur-xl" />
        <AppLogo className="gs-pop relative h-36 w-36 drop-shadow-sm sm:h-40 sm:w-40 gs-delay-150" />
      </div>
    </div>
  );
}

function SplashPage() {
  const { user, loading, homePath } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      void navigate({ to: homePath, replace: true });
    }
  }, [loading, user, homePath, navigate]);

  // Avoid flashing the marketing splash for signed-in users.
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
    <div className="flex min-h-[100dvh] justify-center bg-secondary/50">
      <main className="relative flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-background shadow-xl shadow-primary/5">
        {/* Hero */}
        <section className="pt-safe relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-accent/30 via-primary/8 to-background px-6">
          <div className="pointer-events-none absolute -left-20 top-8 h-56 w-56 rounded-full bg-primary/12 blur-3xl gs-blob" />
          <div className="pointer-events-none absolute -right-16 top-28 h-48 w-48 rounded-full bg-accent/30 blur-3xl gs-blob gs-delay-400" />

          <div className="gs-rise relative flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/80 px-3 py-1 shadow-sm backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                GOSwift
              </span>
            </div>
            <h1 className="mt-3 font-display text-[2.15rem] font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
              Fast delivery,
              <br />
              <span className="text-primary">zero stress</span>
            </h1>
            <p className="mt-2 max-w-[16rem] text-sm text-muted-foreground">
              Verified couriers from pickup to your door.
            </p>
          </div>

          <HeroArt />
        </section>

        {/* Bottom sheet CTA */}
        <section className="pb-safe gs-slide-up relative -mt-6 rounded-t-[1.75rem] bg-card px-6 pt-5 shadow-[0_-16px_48px_-28px_oklch(0.64_0.19_36_/_0.45)]">
          <span className="mx-auto mb-5 block h-1.5 w-10 rounded-full bg-border" />

          <h2 className="gs-rise text-center font-display text-xl font-bold leading-snug text-card-foreground sm:text-2xl gs-delay-100">
            Receive the world at
            <br />
            your doorstep
          </h2>
          <p className="gs-rise mx-auto mt-2.5 max-w-xs text-center text-sm leading-relaxed text-muted-foreground gs-delay-150">
            Transparent quotes, live tracking, and payment released only when your parcel arrives.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { icon: BadgeCheck, label: "Verified" },
              { icon: Package, label: "Tracked" },
              { icon: ShieldCheck, label: "Secure pay" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`gs-rise flex flex-col items-center gap-1.5 rounded-2xl bg-secondary/80 px-2 py-3 gs-delay-${200 + i * 80}`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
                    <Icon className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">{item.label}</span>
                </div>
              );
            })}
          </div>

          <Button
            asChild
            size="lg"
            className="tap-scale gs-glow mt-6 h-14 w-full rounded-2xl text-base font-semibold gs-rise gs-delay-450"
          >
            <Link to="/auth" search={{ mode: "signup" }}>
              Get started
            </Link>
          </Button>

          <div className="gs-rise mt-4 flex items-center justify-between gap-3 pb-3 text-sm gs-delay-500">
            <Link
              to="/auth"
              search={{ mode: "signin" }}
              className="font-semibold text-primary transition-colors hover:text-primary/80"
            >
              I already have an account
            </Link>
            <Link
              to="/for-providers"
              className="inline-flex items-center gap-0.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              Drive with us
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Progress dots — single splash for now */}
          <div className="flex justify-center gap-1.5 pb-1" aria-hidden>
            <span className="h-1.5 w-5 rounded-full bg-primary" />
            <span className="h-1.5 w-1.5 rounded-full bg-border" />
            <span className="h-1.5 w-1.5 rounded-full bg-border" />
          </div>
        </section>
      </main>
    </div>
  );
}
