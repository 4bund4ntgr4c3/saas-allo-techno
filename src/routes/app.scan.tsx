import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, Camera, Laptop, Loader2, Search, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/context";
import { getEquipmentByQr } from "@/lib/org.functions";
import { QrCameraScanner } from "@/components/scanner/QrCameraScanner";

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
  const navigate = useNavigate();
  const { t } = useI18n();
  const [showCamera, setShowCamera] = useState(!q);
  const [manualInput, setManualInput] = useState("");

  const result = useQuery({
    queryKey: ["app", "scan", q],
    queryFn: () => getEquipmentByQr({ data: { qr_id: q ?? "" } }),
    enabled: Boolean(q),
    retry: false,
  });

  const handleScanSuccess = (decoded: string) => {
    // Si c'est une URL contenant ?q= ou ?ref= ou le code brut
    let code = decoded.trim();
    try {
      if (code.includes("http")) {
        const url = new URL(code);
        code = url.searchParams.get("q") || url.searchParams.get("ref") || url.pathname.split("/").pop() || code;
      }
    } catch {}
    setShowCamera(false);
    navigate({ to: "/app/scan", search: { q: code } });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    navigate({ to: "/app/scan", search: { q: manualInput.trim() } });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="at-display text-2xl font-bold">Scanner QR Équipement</h1>
          <p className="text-xs text-muted-foreground">
            Identification instantanée du matériel et accès à la fiche technique
          </p>
        </div>
        <Button
          variant={showCamera ? "technical" : "outline"}
          size="sm"
          onClick={() => setShowCamera((prev) => !prev)}
        >
          <Camera className="mr-1.5 size-4" />
          {showCamera ? "Masquer Caméra" : "Ouvrir Caméra"}
        </Button>
      </div>

      {/* ─── Mode Caméra Directe ─── */}
      {showCamera && (
        <div className="space-y-3">
          <QrCameraScanner
            onScan={handleScanSuccess}
            onClose={() => setShowCamera(false)}
          />
        </div>
      )}

      {/* ─── Mode Saisie Manuelle de Code QR ─── */}
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <QrCode className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-9 text-xs font-mono"
            placeholder="Ou saisissez le code QR / Réf (ex: EQ-1049, LAP-001...)"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary" size="sm">
          <Search className="size-4 mr-1" />
          Rechercher
        </Button>
      </form>

      {/* ─── Résultat de la Recherche / Scan ─── */}
      {result.isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      )}

      {q && !result.isLoading && !result.data?.[0] && (
        <div className="border border-destructive/30 bg-destructive/5 p-4 rounded-lg flex items-center gap-3">
          <AlertTriangle className="size-5 text-destructive shrink-0" />
          <div>
            <strong className="text-sm font-semibold text-destructive block">Équipement introuvable</strong>
            <p className="text-xs text-muted-foreground">
              Le code QR "{q}" ne correspond à aucun matériel actif dans vos organisations.
            </p>
          </div>
        </div>
      )}

      {result.data?.[0] && (
        <div className="border border-border bg-card p-5 rounded-lg space-y-4 shadow-sm animate-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center bg-primary/10 text-primary rounded-md">
                <Laptop className="size-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{result.data[0].name}</h2>
                <p className="text-xs text-muted-foreground">
                  {[result.data[0].brand, result.data[0].model].filter(Boolean).join(" · ") || result.data[0].type} — {result.data[0].org_name}
                </p>
              </div>
            </div>
            <Badge variant="outline">{t(`org.equipment.status.${result.data[0].status}`)}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs border-t border-border pt-3">
            <div>
              <span className="text-muted-foreground block">Code QR :</span>
              <span className="font-mono font-bold text-foreground">{result.data[0].qr_id}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Organisation :</span>
              <span className="font-medium text-foreground">{result.data[0].org_name}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Type :</span>
              <span className="font-medium text-foreground uppercase">{result.data[0].type}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Modèle :</span>
              <span className="font-medium">{result.data[0].model || result.data[0].brand || "Standard"}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            <Button asChild variant="primaryBlock" size="sm">
              <Link
                to="/app/organizations/$orgId/equipment/$equipmentId"
                params={{ orgId: result.data[0].org_id, equipmentId: result.data[0].id }}
              >
                {t("org.equipment.view")} &rarr;
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link
                to="/app/organizations/$orgId/tickets"
                params={{ orgId: result.data[0].org_id }}
                search={{ equipment: result.data[0].id }}
              >
                {t("org.tickets.report")}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
