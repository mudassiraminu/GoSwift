import { Link, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Home, Package, Plus, Radar, User } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

interface TabItem {
  label: string;
  icon: LucideIcon;
  to?: string;
}

const tabs: TabItem[] = [
  { label: "Home", icon: Home, to: "/dashboard" },
  { label: "Shipment", icon: Package, to: "/dashboard" },
  { label: "New", icon: Plus, to: "/new-delivery" },
  { label: "Tracking", icon: Radar, to: "/dashboard" },
  { label: "Profile", icon: User, to: "/profile" },
];

interface MobileAppShellProps {
  children: ReactNode;
  header?: ReactNode;
}

export function MobileAppShell({ children, header }: MobileAppShellProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-[100dvh] justify-center bg-accent/25">
      <div className="relative flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-background shadow-xl shadow-foreground/5">
        {header}
        <div key={pathname} className="gs-rise flex min-h-0 flex-1 flex-col">
          {children}
        </div>

        <nav className="pb-safe pointer-events-none absolute inset-x-0 bottom-0 z-30 px-5">
          <ul className="pointer-events-auto mx-auto mb-3 flex max-w-sm items-center justify-between rounded-full bg-sidebar px-3 py-2 shadow-[0_18px_40px_-16px_oklch(0.2_0.012_50_/_0.55)]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active =
                tab.to === pathname ||
                (tab.to === "/new-delivery" && pathname.startsWith("/new-delivery")) ||
                (tab.to === "/dashboard" && pathname.startsWith("/request"));
              const center = tab.label === "New";

              const inner = center ? (
                <span className="tap-scale gs-glow mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40">
                  <Icon className="h-6 w-6" />
                </span>
              ) : (
                <span
                  className={cn(
                    "tap-scale flex flex-col items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium transition-colors duration-200",
                    active
                      ? "text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/60",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300",
                      active && "scale-105 bg-primary text-primary-foreground",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  {tab.label}
                </span>
              );

              return (
                <li key={tab.label} className="flex-1">
                  {tab.to ? (
                    <Link to={tab.to} className="flex justify-center" aria-label={tab.label}>
                      {inner}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      aria-label={`${tab.label} (coming soon)`}
                      onClick={() => toast.info(`${tab.label} is coming soon`)}
                      className="flex w-full justify-center"
                    >
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
