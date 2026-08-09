import { Link, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Home, Package, Plus, User } from "lucide-react";
import type { ReactNode } from "react";

import { useAuth } from "@/lib/supabase/auth";
import { cn } from "@/lib/utils";

interface TabItem {
  label: string;
  icon: LucideIcon;
  to: string;
  match?: (pathname: string) => boolean;
}

interface MobileAppShellProps {
  children: ReactNode;
  header?: ReactNode;
}

export function MobileAppShell({ children, header }: MobileAppShellProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { homePath } = useAuth();

  const tabs: TabItem[] = [
    {
      label: "Home",
      icon: Home,
      to: homePath,
      match: (p) => p === homePath || p === "/dashboard",
    },
    {
      label: "Shipments",
      icon: Package,
      to: homePath,
      match: (p) => p.startsWith("/request") || p === "/dashboard",
    },
    {
      label: "New",
      icon: Plus,
      to: "/new-delivery",
      match: (p) => p.startsWith("/new-delivery"),
    },
    {
      label: "Profile",
      icon: User,
      to: "/profile",
      match: (p) => p.startsWith("/profile"),
    },
  ];

  return (
    <div className="flex min-h-[100dvh] justify-center bg-muted/40">
      <div className="relative flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-background shadow-xl shadow-foreground/5">
        {header}
        <div key={pathname} className="gs-rise flex min-h-0 flex-1 flex-col overflow-y-auto">
          {children}
        </div>

        <nav className="pb-safe pointer-events-none absolute inset-x-0 bottom-0 z-30 px-4">
          <ul className="pointer-events-auto mx-auto mb-3 flex max-w-sm items-center justify-between rounded-full border border-border/50 bg-sidebar px-2 py-2 shadow-lg shadow-foreground/10">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = tab.match ? tab.match(pathname) : pathname === tab.to;
              const center = tab.label === "New";

              const inner = center ? (
                <span className="tap-scale gs-glow mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/35">
                  <Icon className="h-6 w-6" />
                </span>
              ) : (
                <span
                  className={cn(
                    "tap-scale flex flex-col items-center gap-0.5 rounded-full px-2 py-1 text-[10px] font-medium transition-colors",
                    active ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/55",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition-all",
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
                  <Link to={tab.to} className="flex justify-center" aria-label={tab.label}>
                    {inner}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
