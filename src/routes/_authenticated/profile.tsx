import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { MobileAppShell } from "@/components/mobile/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — GOSwift" },
      { name: "description", content: "Manage your GOSwift account settings." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, user, roles, homePath, refresh, signOut } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() || null, phone: phone.trim() || null })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
    toast.success("Profile updated");
  }

  return (
    <MobileAppShell
      header={
        <header className="pt-safe z-20 border-b border-border/60 bg-background px-5 pb-3">
          <div className="flex items-center gap-3">
            <Link
              to={homePath}
              className="tap-scale flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground"
              aria-label="Back to app"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-lg font-bold text-foreground">Profile</h1>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </header>
      }
    >
      <div className="gs-stagger space-y-5 px-5 pb-32 pt-4">
        <div className="rounded-3xl bg-card p-5 shadow-sm">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="h-12 rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234…"
                className="h-12 rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled className="h-12 rounded-2xl" />
            </div>
            <div className="space-y-2">
              <Label>Roles</Label>
              <div className="flex flex-wrap gap-2">
                {roles.length === 0 ? (
                  <span className="text-sm text-muted-foreground">Customer</span>
                ) : (
                  roles.map((r) => (
                    <span
                      key={r}
                      className="rounded-full bg-secondary px-3 py-1 text-xs font-medium capitalize text-secondary-foreground"
                    >
                      {r}
                    </span>
                  ))
                )}
              </div>
            </div>
            <Button type="submit" className="h-12 w-full rounded-2xl" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save changes
            </Button>
          </form>
        </div>

        <div className="rounded-3xl bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            You're still in the main app. Use the bottom bar or the back button to return anytime.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button asChild variant="outline" className="h-12 rounded-2xl">
              <Link to={homePath}>Back to dashboard</Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-12 rounded-2xl text-destructive hover:text-destructive"
              onClick={() => void signOut()}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </MobileAppShell>
  );
}
