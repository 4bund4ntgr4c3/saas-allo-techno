import { Route } from "@/routes/_authenticated/admin";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";

const field =
  "h-11 w-full rounded-sm border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrateur",
  staff: "Personnel atelier",
  technicien: "Technicien",
  user: "Client",
};

export function TeamSection() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();

  const isAdmin = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (error) throw error;
      return Boolean(data);
    },
  });

  const members = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const { data: profiles, error: pError } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, created_at")
        .order("created_at", { ascending: true })
        .limit(200);
      if (pError) throw pError;
      const { data: roles, error: rError } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rError) throw rError;
      return {
        profiles,
        roles,
      };
    },
  });

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: Enums<"app_role"> }) => {
      const { error } = await supabase.rpc("set_user_role", {
        _user_id: userId,
        _role: role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rôle mis à jour");
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Mise à jour impossible"),
  });

  if (members.isLoading || isAdmin.isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement de l'équipe…</p>;
  }

  const rolesByUser = new Map((members.data?.roles ?? []).map((r) => [r.user_id, r.role]));

  return (
    <div>
      <h2 className="text-lg font-semibold">Équipe</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Attribuez les rôles : administrateur, personnel atelier, technicien ou client.
      </p>
      <ul className="mt-6 space-y-3">
        {(members.data?.profiles ?? []).map((p) => {
          const role = rolesByUser.get(p.id) ?? "user";
          return (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-4 border border-border bg-card p-4"
            >
              <div className="min-w-0">
                <p className="font-medium">{p.full_name ?? "Sans nom"}</p>
                <p className="text-xs text-muted-foreground">{p.email ?? p.phone ?? p.id}</p>
              </div>
              {isAdmin.data ? (
                <select
                  className={`${field} max-w-xs`}
                  value={role}
                  disabled={setRole.isPending}
                  onChange={(e) =>
                    setRole.mutate({
                      userId: p.id,
                      role: e.target.value as Enums<"app_role">,
                    })
                  }
                >
                  {Object.entries(ROLE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="rounded-full border border-border px-3 py-1 text-xs">
                  {ROLE_LABEL[role] ?? role}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
