import { Laptop, MapPin, Phone, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { OrgSite } from "@/lib/org.functions";
import { useI18n } from "@/lib/i18n/context";

export interface SiteCardProps {
  site: OrgSite;
  onClick: () => void;
}

export function SiteCard({ site, onClick }: SiteCardProps) {
  const { t } = useI18n();

  return (
    <li
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group cursor-pointer flex flex-col gap-3 border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-md rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center bg-accent/10 text-accent group-hover:bg-primary/10 group-hover:text-primary transition-colors rounded-md">
            <MapPin className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold group-hover:text-primary transition-colors">
              {site.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {[site.address, site.city].filter(Boolean).join(", ")}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase font-mono">
          Gérer / Éditer
        </Badge>
      </div>

      <dl className="mt-auto space-y-1.5 text-xs text-muted-foreground">
        {site.phone ? (
          <div className="flex items-center gap-1.5">
            <Phone className="size-3 shrink-0" />
            <span>{site.phone}</span>
          </div>
        ) : null}
        {site.manager ? (
          <div className="flex items-center gap-1.5">
            <User className="size-3 shrink-0" />
            <span className="text-foreground">{site.manager}</span>
          </div>
        ) : null}
        {site.departments && site.departments.length > 0 ? (
          <div className="flex flex-wrap gap-1 pt-1">
            {site.departments.map((d) => (
              <Badge key={d} variant="outline" className="text-[10px] font-normal">
                {d}
              </Badge>
            ))}
          </div>
        ) : null}
      </dl>

      <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Laptop className="size-3" />
          {t("org.sites.equipmentCount").replace("{0}", String(site.equipment_count))}
        </span>
        <span className="text-primary font-medium text-[11px] group-hover:underline">
          Gérer départements &rarr;
        </span>
      </div>
    </li>
  );
}
