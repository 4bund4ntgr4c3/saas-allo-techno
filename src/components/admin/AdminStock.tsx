import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/DataTable";
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

  type StockItem = {
    slug: string;
    name: string;
    price: number;
    stock: number;
    draft: string | undefined;
    isTracked: boolean;
    isLow: boolean;
    isSaving: boolean;
  };

  const parts = useMemo<StockItem[]>(() => {
    const map = stockQuery.data;
    return ACCESSORIES.map((a) => {
      const real = map?.get(a.slug);
      const tracked = real !== undefined;
      const draft = drafts[a.slug];
      const low = tracked && (real as number) < LOW_STOCK_THRESHOLD;
      return {
        slug: a.slug,
        name: a.name,
        price: a.price,
        stock: real ?? a.stock,
        draft,
        isTracked: tracked,
        isLow: !!low,
        isSaving: savingSlug === a.slug,
      };
    });
  }, [stockQuery.data, drafts, savingSlug]);

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
      toast.error(t("admin.stock.toast.invalidQty"));
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
      toast.success(`${a.slug} : ${t("admin.stock.toast.updated")}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.stock.toast.updateError"));
    } finally {
      setSavingSlug(null);
    }
  };

  const columns = useMemo<ColumnDef<StockItem, unknown>[]>(
    () => [
      {
        accessorKey: "slug",
        header: t("admin.stock.col.reference"),
        cell: ({ row }) => (
          <span className="font-mono text-xs uppercase">{row.original.slug}</span>
        ),
      },
      {
        accessorKey: "name",
        header: t("admin.stock.col.name"),
      },
      {
        accessorKey: "price",
        header: t("admin.stock.col.price"),
        cell: ({ row }) => (
          <span className="font-mono">{formatFcfa(row.original.price)}</span>
        ),
      },
      {
        accessorKey: "stock",
        header: t("admin.stock.col.stock"),
        cell: ({ row }) => {
          const a = row.original;
          return (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                className={`${field} w-28 py-1.5 text-sm ${a.isLow ? "text-destructive" : ""}`}
                value={a.draft ?? String(a.stock)}
                onChange={(e) => setDrafts((d) => ({ ...d, [a.slug]: e.target.value }))}
              />
              {a.isTracked && (
                <span className="font-mono text-[10px] uppercase text-muted-foreground">
                  {t("admin.stock.tracked")}
                </span>
              )}
              {a.isLow && (
                <span
                  className="size-2 shrink-0 rounded-full bg-destructive"
                  title={t("admin.stock.lowStock")}
                />
              )}
            </div>
          );
        },
        enableSorting: false,
        enableGlobalFilter: false,
      },
      {
        id: "action",
        cell: ({ row }) => {
          const a = row.original;
          return (
            <Button
              variant="technical"
              size="sm"
              disabled={a.isSaving}
              onClick={() => save({ slug: a.slug, stock: a.stock })}
            >
              {a.isSaving ? "…" : t("admin.stock.update")}
            </Button>
          );
        },
        enableSorting: false,
        enableGlobalFilter: false,
      },
    ],
    [t, save],
  );

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
      <DataTable columns={columns} data={parts} searchKey="slug" searchPlaceholder={t("admin.stock.search")} />
    </div>
  );
}
