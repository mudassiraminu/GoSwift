import { Link } from "@tanstack/react-router";

import { AppLogo } from "@/components/app-logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-sidebar text-sidebar-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <AppLogo className="h-9 w-9 rounded-xl" labelled={false} />
            <span className="font-display text-lg font-bold">GOSwift</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-sidebar-foreground/65">
            The trusted marketplace connecting small businesses with verified delivery companies and
            their riders. Find. Compare. Accept. Pay. Deliver.
          </p>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold">Platform</h3>
          <ul className="mt-3 space-y-2.5 text-sm text-sidebar-foreground/65">
            <li>
              <Link to="/" className="transition-colors hover:text-sidebar-foreground">
                How it works
              </Link>
            </li>
            <li>
              <Link to="/for-providers" className="transition-colors hover:text-sidebar-foreground">
                Become a provider
              </Link>
            </li>
            <li>
              <Link to="/auth" className="transition-colors hover:text-sidebar-foreground">
                Sign in
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold">Trust</h3>
          <ul className="mt-3 space-y-2.5 text-sm text-sidebar-foreground/65">
            <li>Verified providers</li>
            <li>Protected payments</li>
            <li>Ratings & reputation</li>
            <li>Dispute resolution</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-sidebar-border px-4 py-5 text-center text-xs text-sidebar-foreground/50">
        &copy; {new Date().getFullYear()} GOSwift. Your trusted delivery marketplace.
      </div>
    </footer>
  );
}
