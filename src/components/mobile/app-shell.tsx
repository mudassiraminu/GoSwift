import { Link, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Home, Package, PackagePlus, Receipt, User } from "lucide-react";
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
  { label: "Shipments", icon: Package },
  { label: "New", icon: PackagePlus },
  { label: "Activity", icon: Receipt },
  { label: "Profile", icon: User, to: "/profile" },
];

interface MobileAppShellProps {
  children: ReactNode;
  /** Rendered above the scroll area, stays pinned. */
  header?: ReactNode;
}

/**
 * Phone-sized app frame. On desktop the app is centred in a device-like column
 * so the same layout reads well on iOS, Android and the browser.
 */
export function MobileAppShell({ children, header }: MobileAppShellProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-[100dvh] justify-center bg-secondary/60">
      <div className="relative flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-background shadow-xl shadow-primary/5">
        {header}
        <div key={pathname} className="gs-rise flex min-h-0 flex-1 flex-col">
          {children}
        </div>

        {/* Bottom tab bar */}
        <nav className="pb-safe relative z-20 border-t border-border/70 bg-card/95 backdrop-blur">
          <ul className="flex items-end justify-between px-4 pt-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = tab.to === pathname;
              const center = tab.label === "New";

              const inner = center ? (
                <span className="tap-scale -mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/35 transition-shadow hover:shadow-primary/50">
                  <Icon className="h-6 w-6" />
                </span>
              ) : (
                <span
                  className={cn(
                    "tap-scale flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-medium transition-colors duration-200",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-transform duration-300",
                      active && "-translate-y-0.5 scale-110",
                    )}
                  />
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
                      onClick={() => toast.info(`${tab.label} is coming in the next release`)}
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
