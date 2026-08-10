import { Link } from "@tanstack/react-router";
import { X, ArrowRight } from "lucide-react";
import { useCompare, MAX_COMPARE } from "@/components/shop/compare";
import { ACCESSORIES, formatFcfa } from "@/data/catalog";
import { useI18n } from "@/lib/i18n/context";

export function CompareBar() {
  const { slugs, remove } = useCompare();
  const { locale, t } = useI18n();

  if (slugs.length === 0) return null;

  const products = slugs.map((s) => ACCESSORIES.find((a) => a.slug === s)).filter(Boolean);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 shadow-[0_-4px_16px_rgba(0,0,0,.08)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
          {slugs.length}/{MAX_COMPARE}
        </span>
        <div className="flex flex-1 gap-2 overflow-x-auto">
          {products.map((p) => (
            <div
              key={p!.slug}
              className="flex shrink-0 items-center gap-2 rounded-sm border border-border bg-surface px-3 py-1.5"
            >
              <span className="text-xs font-bold line-clamp-1">{p!.name}</span>
              <span className="font-mono text-[10px] text-primary">{formatFcfa(p!.price)}</span>
              <button
                onClick={() => remove(p!.slug)}
                className="ml-1 text-muted-foreground hover:text-destructive"
                aria-label={`Retirer ${p!.name}`}
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
        {slugs.length >= 2 && (
          <Link
            to="/$locale/boutique/comparer"
            params={{ locale }}
            className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("boutique.compare.go")} <ArrowRight className="size-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
