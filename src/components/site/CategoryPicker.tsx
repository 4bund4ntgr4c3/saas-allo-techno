import { CATEGORIES } from "@/data/catalog/static";
import { categoryMedia } from "@/data/device-media";

/**
 * Grille des catégories d'appareils. Isolée du gros module DeviceSearch pour
 * pouvoir être importée depuis la page d'accueil sans charger tout le catalogue
 * de données (~500 Ko) dans le bundle du premier rendu.
 */
export function CategoryPicker({ onSelect }: { onSelect: (category: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-3">
      {CATEGORIES.map((c) => {
        const media = categoryMedia(c);
        const Icon = media?.icon;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onSelect(c)}
            className="group flex flex-col items-start gap-3 bg-card p-5 text-left transition-colors hover:bg-surface"
          >
            <span className="flex size-14 items-center justify-center border border-border text-primary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
              {Icon && <Icon className="size-7" strokeWidth={1.5} />}
            </span>
            <span className="text-sm font-bold tracking-tight">{c}</span>
            <span className="font-mono text-[10px] uppercase text-muted-foreground">
              {media?.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}
