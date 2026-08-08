import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Prefer pathname + search so redirects stay relative and match /auth validateSearch.
    const redirectPath =
      location.pathname + (location.searchStr || "") + (location.hash || "");
    const search = { mode: "signin" as const, redirect: redirectPath };

    if (!isSupabaseConfigured) {
      throw redirect({ to: "/auth", search });
    }

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search });
    }

    return { user: data.user };
  },
  component: () => <Outlet />,
});
