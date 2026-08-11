import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFeatureFlags,
  toggleFeatureFlag,
  createFeatureFlag,
  deleteFeatureFlag,
} from "@/lib/feature-flags";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { useState } from "react";
import { field } from "@/components/admin/primitives/AdminField";
import { Trash2, Plus, ToggleLeft, ToggleRight } from "lucide-react";

export function AdminFeatureFlags() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [newKey, setNewKey] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const { data: flags = [], isLoading } = useQuery({
    queryKey: ["admin", "feature-flags"],
    queryFn: () => getFeatureFlags(),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      toggleFeatureFlag({ data: { key, enabled } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "feature-flags"] }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createFeatureFlag({ data: { key: newKey, description: newDesc || undefined } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "feature-flags"] });
      setNewKey("");
      setNewDesc("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) => deleteFeatureFlag({ data: { key } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "feature-flags"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{t("admin.feature-flags")}</h2>
      </div>

      <div className="flex gap-2">
        <input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="feature-key"
          className={field}
        />
        <input
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          placeholder={t("admin.feature-flags.description")}
          className={field}
        />
        <Button
          size="sm"
          onClick={() => createMutation.mutate()}
          disabled={!newKey || createMutation.isPending}
        >
          <Plus className="mr-1 size-3" />
          {t("admin.feature-flags.add")}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("admin.feature-flags.loading")}</p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {flags.map((flag) => (
            <div key={flag.key} className="flex items-center justify-between bg-card px-4 py-3">
              <div className="flex-1">
                <code className="text-sm font-mono">{flag.key}</code>
                {flag.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleMutation.mutate({ key: flag.key, enabled: !flag.enabled })}
                  className="transition-colors"
                >
                  {flag.enabled ? (
                    <ToggleRight className="size-6 text-success" />
                  ) : (
                    <ToggleLeft className="size-6 text-muted-foreground" />
                  )}
                </button>
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(flag.key)}>
                  <Trash2 className="size-3 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {flags.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              {t("admin.feature-flags.empty")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
