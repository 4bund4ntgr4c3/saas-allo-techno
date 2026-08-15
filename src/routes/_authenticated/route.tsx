import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

// Garde d'authentification côté serveur : le JWT est vérifié via le header
// Authorization attaché par le middleware client (auth-attacher). Le garde
// client seul serait contournable en appelant directement les RPC/policies.
const requireAuthServer = createServerFn({ method: "GET" }).handler(async () => {
  const [{ supabaseAdmin }, { currentUserId }] = await Promise.all([
    import("@/integrations/supabase/client.server"),
    import("@/lib/rbac"),
  ]);
  const userId = await currentUserId(supabaseAdmin);
  return { authenticated: userId !== null };
});

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const { authenticated } = await requireAuthServer();
    if (!authenticated) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
