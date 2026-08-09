import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { formatFcfa } from "@/data/catalog/company";
import { Check, X } from "lucide-react";

interface DevisItem {
  id: string;
  device: string;
  fault: string;
  price: number;
  duration: string;
  warranty: string;
  parts: string[];
}

interface Props {
  devis: DevisItem[];
  onRemove?: (id: string) => void;
  onSelect?: (id: string) => void;
  selectedId?: string;
}

export function DevisComparison({ devis, onRemove, onSelect, selectedId }: Props) {
  const { t } = useI18n();
  const [highlightDiffs, setHighlightDiffs] = useState(true);

  if (devis.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">{t("devis.compare.empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">
          {t("devis.compare.title")} ({devis.length})
        </h3>
        {devis.length >= 2 && (
          <button
            onClick={() => setHighlightDiffs(!highlightDiffs)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {highlightDiffs
              ? t("devis.compare.hideDiffs")
              : t("devis.compare.showDiffs")}
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid gap-px bg-border"
          style={{
            gridTemplateColumns: `repeat(${devis.length}, minmax(200px, 1fr))`,
          }}
        >
          {devis.map((d) => (
            <div
              key={d.id}
              className={`bg-card p-4 space-y-3 ${
                selectedId === d.id ? "ring-2 ring-primary" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold">{d.device}</h4>
                  <p className="text-xs text-muted-foreground">{d.fault}</p>
                </div>
                {onRemove && (
                  <button
                    onClick={() => onRemove(d.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <div className={`rounded-md p-2 ${highlightDiffs ? "bg-primary/5" : ""}`}>
                  <span className="text-[10px] uppercase text-muted-foreground">
                    {t("devis.compare.price")}
                  </span>
                  <p className="text-lg font-bold text-primary">{formatFcfa(d.price)}</p>
                </div>

                <div className={`rounded-md p-2 ${highlightDiffs ? "bg-primary/5" : ""}`}>
                  <span className="text-[10px] uppercase text-muted-foreground">
                    {t("devis.compare.duration")}
                  </span>
                  <p className="text-sm font-medium">{d.duration}</p>
                </div>

                <div className={`rounded-md p-2 ${highlightDiffs ? "bg-primary/5" : ""}`}>
                  <span className="text-[10px] uppercase text-muted-foreground">
                    {t("devis.compare.warranty")}
                  </span>
                  <p className="text-sm font-medium">{d.warranty}</p>
                </div>
              </div>

              {d.parts.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground">
                    {t("devis.compare.parts")}
                  </span>
                  <ul className="mt-1 space-y-0.5">
                    {d.parts.map((p) => (
                      <li key={p} className="flex items-center gap-1 text-xs">
                        <Check className="size-2 text-success" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {onSelect && (
                <Button
                  size="sm"
                  variant={selectedId === d.id ? "default" : "outline"}
                  className="w-full"
                  onClick={() => onSelect(d.id)}
                >
                  {selectedId === d.id
                    ? t("devis.compare.selected")
                    : t("devis.compare.choose")}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
