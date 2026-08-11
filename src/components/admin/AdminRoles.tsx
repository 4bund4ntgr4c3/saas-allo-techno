import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserRoles, setUserRole, type UserRole } from "@/lib/user-roles";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { useState } from "react";
import { Shield, UserPlus } from "lucide-react";
import { toast } from "sonner";

export function AdminRoles() {
  const { t } = useI18n();
  const ROLES: { value: string; label: string; color: string }[] = [
    { value: "admin", label: "Admin", color: "bg-red-100 text-red-800" },
    { value: "staff", label: "Staff", color: "bg-blue-100 text-blue-800" },
    { value: "technicien", label: t("admin.roles.label.technicien"), color: "bg-purple-100 text-purple-800" },
    { value: "user", label: "User", color: "bg-gray-100 text-gray-600" },
  ];
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<string>("staff");

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["admin", "user-roles"],
    queryFn: () => getUserRoles(),
  });

  const setRoleMutation = useMutation({
    mutationFn: () => setUserRole({ data: { user_id: userId, role: role as UserRole["role"] } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user-roles"] });
      toast.success(t("admin.roles.toast.assigned"));
      setUserId("");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : t("admin.roles.toast.error"));
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="size-5" />
        <h2 className="text-lg font-bold">{t("admin.roles.title")}</h2>
      </div>

      <div className="flex gap-2">
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="User UUID"
          className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-mono"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          onClick={() => setRoleMutation.mutate()}
          disabled={!userId || setRoleMutation.isPending}
        >
          <UserPlus className="mr-1 size-3" />
          {t("admin.roles.assign")}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("admin.roles.loading")}</p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {roles.map((r) => {
            const roleInfo = ROLES.find((rl) => rl.value === r.role);
            return (
              <div key={`${r.user_id}-${r.role}`} className="flex items-center justify-between bg-card px-4 py-3">
                <div>
                  <code className="text-xs font-mono">{r.user_id.slice(0, 8)}...</code>
                  {r.email && <span className="ml-2 text-xs text-muted-foreground">{r.email}</span>}
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${roleInfo?.color ?? "bg-gray-100"}`}>
                  {roleInfo?.label ?? r.role}
                </span>
              </div>
            );
          })}
          {roles.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t("admin.roles.empty")}</p>
          )}
        </div>
      )}
    </div>
  );
}
