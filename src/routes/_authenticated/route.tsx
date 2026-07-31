import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const search = { mode: "signin" as const, redirect: location.href };
    if (!isSupabaseConfigured) throw redirect({ to: "/auth", search });
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
