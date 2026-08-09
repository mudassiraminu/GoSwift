import { Link, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Home, Menu, User, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/supabase/auth";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  to?: string;
  icon: LucideIcon;
  soon?: boolean;
}

interface DashboardShellProps {
  title: string;
  subtitle?: string;
  navItems: NavItem[];
  children: ReactNode;
  actions?: ReactNode;
}

export function DashboardShell({
  title,
  subtitle,
  navItems,
  children,
  actions,
}: DashboardShellProps) {
  const [open, setOpen] = useState(false);
  const { profile, user, homePath, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const coreNav: NavItem[] = [
    { label: "Home", to: "/", icon: Home },
    { label: "Dashboard", to: homePath, icon: Home },
    { label: "Profile", to: "/profile", icon: User },
  ];

  // Merge without duplicate paths
  const seen = new Set<string>();
  const merged: NavItem[] = [];
  for (const item of [...coreNav, ...navItems]) {
    const key = item.to ?? item.label;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {merged.map((item) => {
        const Icon = item.icon;
        const active =
          item.to === pathname ||
          (item.to === homePath && pathname.startsWith(item.to) && item.to !== "/");
        const base =
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all";
        if (!item.to) {
          return (
            <span
              key={item.label}
              className={cn(base, "cursor-default text-sidebar-foreground/40")}
              title="Coming soon"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
              <span className="ml-auto rounded-md bg-sidebar-accent px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-sidebar-accent-foreground/60">
                Soon
              </span>
            </span>
          );
        }
        return (
          <Link
            key={`${item.label}-${item.to}`}
            to={item.to}
            onClick={() => setOpen(false)}
            className={cn(
              base,
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-primary/20"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <Link to="/" className="mb-8 flex items-center gap-2.5 px-1">
          <AppLogo className="h-10 w-10 rounded-xl" labelled={false} />
          <div>
            <span className="font-display text-lg font-bold text-sidebar-foreground">GOSwift</span>
            <p className="text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/50">
              Marketplace
            </p>
          </div>
        </Link>
        {nav}
        <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-3">
          <p className="truncate text-xs font-medium text-sidebar-foreground">
            {profile?.full_name || user?.email}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => void signOut()}
          >
            Sign out
          </Button>
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar p-4 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                <AppLogo className="h-8 w-8 rounded-lg" labelled={false} />
                <span className="font-display text-lg font-bold text-sidebar-foreground">GOSwift</span>
              </Link>
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="text-sidebar-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            <Button
              variant="ghost"
              size="sm"
              className="mt-auto w-full justify-start text-sidebar-foreground/80"
              onClick={() => void signOut()}
            >
              Sign out
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur sm:px-6">
          <button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg font-semibold text-foreground">{title}</h1>
            {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
          {actions}
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to={homePath}>Dashboard</Link>
          </Button>
          <Button asChild variant="outline" size="icon" aria-label="Profile">
            <Link to="/profile">
              <User className="h-4 w-4" />
            </Link>
          </Button>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
