import { AlertTriangle } from "lucide-react";

export function SupabaseSetupNotice() {
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-warning/40 bg-warning/10 p-6">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">
            Supabase is not connected yet
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This app talks to your own Supabase project. Add these environment variables to enable
            authentication, the database and storage:
          </p>
          <ul className="mt-3 space-y-1 font-mono text-xs text-foreground">
            <li>VITE_SUPABASE_URL</li>
            <li>VITE_SUPABASE_ANON_KEY</li>
          </ul>
          <p className="mt-3 text-sm text-muted-foreground">
            Then run <span className="font-mono text-xs">schema.sql</span> in your Supabase SQL
            Editor to create the tables, policies and storage buckets.
          </p>
        </div>
      </div>
    </div>
  );
}
