import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Laptop, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { getEquipmentByQr } from "@/lib/org.functions";

interface ScanSearch {
  q?: string;
}

export const Route = createFileRoute("/app/scan")({
  component: ScanPage,
  validateSearch: (search: Record<string, unknown>): ScanSearch => {
    const q = typeof search["q"] === "string" ? search["q"] : undefined;
    return q !== undefined ? { q } : {};
  },
});

function ScanPage() {
  const q = Route.useSearch({ select: (s: ScanSearch) => s.q });
  const { t } = useI18n();

  const result = useQuery({
    queryKey: ["app", "scan", q],
    queryFn: () => getEquipmentByQr({ data: { qr_id: q ?? "" } }),
    enabled: Boolean(q),
    retry: false,
  });

  if (!q) {
    return <p className="text-sm text-muted-foreground">Scannez un QR code d'équipement.</p>;
  }
  if (result.isLoading) {
    return <Loader2 className="size-5 animate-spin text-muted-foreground" />;
  }
  const eq = result.data?.[0];
  if (!eq) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertTriangle className="size-4" />
        Équipement introuvable ou accès non autorisé.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center bg-foreground text-background">
            <Laptop className="size-6" />
          </div>
          <div>
            <h1 className="at-display text-2xl font-bold">{eq.name}</h1>
            <p className="text-sm text-muted-foreground">
              {[eq.brand, eq.model].filter(Boolean).join(" · ") || eq.type} — {eq.org_name}
            </p>
          </div>
        </div>
        <Badge variant="outline">{t(`org.equipment.status.${eq.status}`)}</Badge>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="primaryBlock">
          <Link
            to="/app/organizations/$orgId/equipment/$equipmentId"
            params={{ orgId: eq.org_id, equipmentId: eq.id }}
          >
            {t("org.equipment.view")}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link
            to="/app/organizations/$orgId/tickets"
            params={{ orgId: eq.org_id }}
            search={{ equipment: eq.id }}
          >
            {t("org.tickets.report")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
