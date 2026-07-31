import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, ChevronRight, ShieldCheck, Truck } from "lucide-react";

import heroImg from "@/assets/goswift-hero.png";
import { Button } from "@/components/ui/button";

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
        content: "Book a courier, track your parcel live and pay securely with GOSwift.",
      },
    ],
  }),
  component: SplashPage,
});

function SplashPage() {
  return (
    <div className="flex min-h-[100dvh] justify-center bg-secondary/60">
      <main className="relative flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-background shadow-xl shadow-primary/5">
        {/* Sky / illustration */}
        <section className="pt-safe relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-accent/25 via-primary/10 to-background px-6">
          <div className="pointer-events-none absolute -left-16 top-10 h-52 w-52 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-12 top-32 h-44 w-44 rounded-full bg-accent/25 blur-3xl" />

          <div className="relative mt-6 text-center animate-fade-in">
            <h1 className="font-display text-4xl font-bold text-foreground">Fast Delivery</h1>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.55em] text-primary">
              Quickly
            </p>
          </div>

          <img
            src={heroImg}
            alt="GOSwift courier pushing a hand truck loaded with parcels"
            width={1024}
            height={1024}
            className="relative mt-2 w-[78%] max-w-xs drop-shadow-2xl animate-scale-in"
          />
        </section>

        {/* Bottom sheet */}
        <section className="pb-safe relative -mt-8 rounded-t-[2rem] bg-card px-6 pt-8 shadow-[0_-12px_40px_-24px_oklch(0.62_0.19_290_/_0.6)]">
          <span className="mx-auto mb-6 block h-1.5 w-12 rounded-full bg-border" />
          <h2 className="text-center font-display text-2xl font-bold leading-snug text-card-foreground">
            Receive the world at
            <br />
            your doorstep
          </h2>
          <p className="mx-auto mt-3 max-w-xs text-center text-sm text-muted-foreground">
            Verified couriers, live tracking and payment released only when your parcel lands.
          </p>

          <div className="mt-5 flex justify-center gap-4 text-[11px] font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-primary" /> Verified
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-primary" /> Live tracking
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" /> Secure pay
            </span>
          </div>

          <Button asChild size="lg" className="tap-scale mt-7 h-14 w-full rounded-2xl text-base">
            <Link to="/auth" search={{ mode: "signup" }}>
              Get Started
            </Link>
          </Button>

          <div className="mt-4 flex items-center justify-between pb-4 text-sm">
            <Link to="/auth" className="font-medium text-primary">
              I already have an account
            </Link>
            <Link
              to="/for-providers"
              className="inline-flex items-center text-muted-foreground hover:text-foreground"
            >
              Drive with us <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
