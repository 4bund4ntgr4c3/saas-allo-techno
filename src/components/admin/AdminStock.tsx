import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ACCESSORIES, formatFcfa } from "@/data/catalog";
import { setInventory } from "@/lib/content.functions";
import { useI18n } from "@/lib/i18n/context";
import { field } from "@/components/admin/primitives/AdminField";

const LOW_STOCK_THRESHOLD = 5;

export function StockAdmin() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const stockQuery = useQuery({
    queryKey: ["admin-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("slug, quantity, updated_at")
        .order("slug");
      if (error) throw error;
      const map = new Map<string, number>();
      for (const row of data ?? []) map.set(row.slug, row.quantity);
      return map;
    },
  });
  const setFn = useServerFn(setInventory);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingSlug, setSavingSlug] = useState<string | null>(null);

  const lowItems = useMemo(() => {
    const map = stockQuery.data;
    if (!map) return [];
    return ACCESSORIES.map((a) => {
      const quantity = map.get(a.slug);
      return quantity !== undefined && quantity < LOW_STOCK_THRESHOLD
        ? { slug: a.slug, name: a.name, quantity }
        : null;
    })
      .filter((x): x is { slug: string; name: string; quantity: number } => x !== null)
      .sort((a, b) => a.quantity - b.quantity);
  }, [stockQuery.data]);

  const save = async (a: { slug: string; stock: number }) => {
    const value = Number(drafts[a.slug] ?? a.stock);
    if (!Number.isFinite(value) || value < 0) {
      toast.error("Quantité invalide");
      return;
    }
    setSavingSlug(a.slug);
    try {
      await setFn({ data: { slug: a.slug, quantity: value } });
      queryClient.invalidateQueries({ queryKey: ["admin-stock"] });
      setDrafts((d) => {
        const next = { ...d };
        delete next[a.slug];
        return next;
      });
      toast.success(`${a.slug} : stock mis à jour`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Mise à jour impossible");
    } finally {
      setSavingSlug(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      {lowItems.length > 0 && (
        <div className="mb-4 rounded-sm border border-destructive/40 bg-destructive/5 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <ShieldAlert className="size-4" />
            {t("admin.stock.low.title")}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {lowItems.map((item) => (
              <li key={item.slug}>
                {item.name} —{" "}
                <span className="font-mono text-destructive">
                  {item.quantity === 1
                    ? t("admin.stock.low.remaining.one", [item.quantity])
                    : t("admin.stock.low.remaining.other", [item.quantity])}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2">Référence</th>
            <th className="px-4 py-2">Désignation</th>
            <th className="px-4 py-2">Prix</th>
            <th className="px-4 py-2">Stock</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {ACCESSORIES.map((a) => {
            const real = stockQuery.data?.get(a.slug);
            const tracked = real !== undefined;
            const draft = drafts[a.slug];
            const low = tracked && real < LOW_STOCK_THRESHOLD;
            return (
              <tr
                key={a.slug}
                className={`border-b border-border ${low ? "bg-destructive/5" : ""}`}
              >
                <td className="px-4 py-2 font-mono text-xs uppercase">{a.slug}</td>
                <td className="px-4 py-2">{a.name}</td>
                <td className="px-4 py-2 font-mono">{formatFcfa(a.price)}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      className={`${field} w-28 py-1.5 text-sm ${low ? "text-destructive" : ""}`}
                      value={draft ?? String(tracked ? (real as number) : a.stock)}
                      onChange={(e) => setDrafts((d) => ({ ...d, [a.slug]: e.target.value }))}
                    />
                    {tracked && (
                      <span className="font-mono text-[10px] uppercase text-muted-foreground">
                        suivi
                      </span>
                    )}
                    {low && (
                      <span
                        className="size-2 shrink-0 rounded-full bg-destructive"
                        title="Stock faible"
                      />
                    )}
                  </div>
                </td>
                <td className="px-4 py-2">
                  <Button
                    variant="technical"
                    size="sm"
                    disabled={savingSlug === a.slug}
                    onClick={() => save({ slug: a.slug, stock: real ?? a.stock })}
                  >
                    {savingSlug === a.slug ? "…" : "Mettre à jour"}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
