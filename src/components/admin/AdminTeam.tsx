import { Route } from "@/routes/_authenticated/admin";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import type { Enums } from "@/integrations/supabase/types";
import { getAdminTeamData, setTeamRole } from "@/lib/admin.functions";
import { field } from "@/components/admin/primitives/AdminField";
import { useI18n } from "@/lib/i18n/context";

const ROLE_LABELS: Record<string, string> = {
  admin: "admin.team.role.admin",
  staff: "admin.team.role.workshop",
  technicien: "admin.team.role.technician",
  user: "admin.team.role.client",
};

export function TeamSection() {
  const { t } = useI18n();
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const getTeamFn = useServerFn(getAdminTeamData);
  const setRoleFn = useServerFn(setTeamRole);

  const team = useQuery({
    queryKey: ["team", user.id],
    queryFn: () => getTeamFn({ data: undefined }),
  });

  const isAdmin = {
    data: team.data?.isAdmin,
    isLoading: team.isLoading,
  };
  const members = {
    data: team.data?.members,
    isLoading: team.isLoading,
  };

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: Enums<"app_role"> }) => {
      await setRoleFn({ data: { userId, role } });
    },
    onSuccess: () => {
      toast.success(t("admin.team.roleUpdated"));
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : t("admin.team.updateError")),
  });

  if (members.isLoading || isAdmin.isLoading) {
    return <p className="text-sm text-muted-foreground">{t("admin.team.loading")}</p>;
  }

  const rolesByUser = new Map((members.data?.roles ?? []).map((r) => [r.user_id, r.role]));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="at-eyebrow">{t("admin.team.eyebrow")}</p>
          <h2 className="mt-1 text-xl font-semibold">{t("admin.team.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.team.description")}</p>
        </div>
      </div>
      <ul className="space-y-3">
        {(members.data?.profiles ?? []).map((p) => {
          const role = rolesByUser.get(p.id) ?? "user";
          return (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-4 border border-border bg-card p-4"
            >
              <div className="min-w-0">
                <p className="font-medium">{p.full_name ?? t("admin.team.noName")}</p>
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
                  {Object.entries(ROLE_LABELS).map(([value, key]) => (
                    <option key={value} value={value}>
                      {t(key)}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="rounded-full border border-border px-3 py-1 text-xs">
                  {t(ROLE_LABELS[role] ?? "") || role}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
