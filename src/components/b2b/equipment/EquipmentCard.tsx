import { Laptop, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EquipmentItem } from "@/lib/org.functions";
import { useI18n } from "@/lib/i18n/context";

export interface EquipmentCardProps {
  equipment: EquipmentItem;
  onClick: () => void;
}

export function EquipmentCard({ equipment, onClick }: EquipmentCardProps) {
  const { t } = useI18n();

  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        className="group cursor-pointer flex h-full flex-col gap-3 border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-md rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors rounded-md">
              <Laptop className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-bold group-hover:text-primary transition-colors">
                {equipment.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {[equipment.brand, equipment.model].filter(Boolean).join(" ") || equipment.type}
              </p>
            </div>
          </div>
          <Badge variant="outline">{t(`org.equipment.status.${equipment.status}`)}</Badge>
        </div>

        <dl className="mt-auto space-y-1 text-xs text-muted-foreground">
          {equipment.serial_number ? (
            <div className="flex justify-between gap-2">
              <dt>{t("org.equipment.form.serial")}</dt>
              <dd className="truncate text-foreground font-mono">{equipment.serial_number}</dd>
            </div>
          ) : null}
          {equipment.asset_tag ? (
            <div className="flex justify-between gap-2">
              <dt>{t("org.equipment.form.assetTag")}</dt>
              <dd className="truncate text-foreground font-mono">{equipment.asset_tag}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-2">
            <dt>{t("org.equipment.form.location")}</dt>
            <dd className="truncate text-foreground font-semibold text-primary">
              {[equipment.location, equipment.site_name].filter(Boolean).join(" · ") ||
                "Site principal"}
            </dd>
          </div>
        </dl>

        <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
          <span className="inline-flex items-center gap-1 text-muted-foreground font-mono">
            <QrCode className="size-3" />
            {equipment.qr_id}
          </span>
          <span className="font-bold text-primary group-hover:underline">
            Gérer / Transférer &rarr;
          </span>
        </div>
      </div>
    </li>
  );
}
