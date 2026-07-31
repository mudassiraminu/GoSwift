import { Link } from "@tanstack/react-router";
import { Package } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/10">
              <Package className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold">GOSwift</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-primary-foreground/70">
            A marketplace connecting businesses and individuals with verified delivery companies.
            Compare quotes, track deliveries, and pay securely.
          </p>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold">Platform</h3>
          <ul className="mt-3 space-y-2 text-sm text-primary-foreground/70">
            <li>
              <Link to="/" className="hover:text-primary-foreground">
                How it works
              </Link>
            </li>
            <li>
              <Link to="/for-providers" className="hover:text-primary-foreground">
                Become a provider
              </Link>
            </li>
            <li>
              <Link to="/auth" className="hover:text-primary-foreground">
                Sign in
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold">Trust</h3>
          <ul className="mt-3 space-y-2 text-sm text-primary-foreground/70">
            <li>Verified providers</li>
            <li>Protected payments</li>
            <li>Dispute resolution</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 px-4 py-5 text-center text-xs text-primary-foreground/60">
        &copy; {new Date().getFullYear()} GOSwift. All rights reserved.
      </div>
    </footer>
  );
}
