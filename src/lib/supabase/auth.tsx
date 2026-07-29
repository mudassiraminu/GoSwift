import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { supabase, isSupabaseConfigured } from "./client";
import type { AppRole, Profile } from "./types";

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  configured: boolean;
  hasRole: (role: AppRole) => boolean;
  primaryRole: AppRole | null;
  homePath: string;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const ROLE_PRIORITY: AppRole[] = ["admin", "provider", "rider", "customer"];

export const ROLE_HOME: Record<AppRole, string> = {
  admin: "/admin",
  provider: "/provider",
  rider: "/rider",
  customer: "/dashboard",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const queryClient = useQueryClient();
  const router = useRouter();

  const loadIdentity = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      setRoles([]);
      return;
    }
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile((profileRes.data as Profile | null) ?? null);
    setRoles(((rolesRes.data as { role: AppRole }[] | null) ?? []).map((r) => r.role));
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (event === "SIGNED_OUT") {
        setProfile(null);
        setRoles([]);
        return;
      }
      // Defer Supabase calls out of the callback to avoid deadlocks.
      setTimeout(() => {
        void loadIdentity(nextSession?.user?.id);
      }, 0);
    });

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      await loadIdentity(data.session?.user?.id);
      if (active) setLoading(false);
    })();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadIdentity]);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    await loadIdentity(data.session?.user?.id);
  }, [loadIdentity]);

  const signOut = useCallback(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setRoles([]);
    await router.navigate({ to: "/auth", replace: true });
  }, [queryClient, router]);

  const value = useMemo<AuthState>(() => {
    const primaryRole = ROLE_PRIORITY.find((r) => roles.includes(r)) ?? null;
    return {
      session,
      user: session?.user ?? null,
      profile,
      roles,
      loading,
      configured: isSupabaseConfigured,
      hasRole: (role: AppRole) => roles.includes(role),
      primaryRole,
      homePath: primaryRole ? ROLE_HOME[primaryRole] : "/dashboard",
      refresh,
      signOut,
    };
  }, [session, profile, roles, loading, refresh, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
