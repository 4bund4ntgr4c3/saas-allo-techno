import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ACTIVE_SECURITY_ADVISORIES } from "@/lib/security-advisory";

export function SecurityAdvisoryFeed() {
  return (
    <div className="border border-border bg-card p-5 sm:p-7 rounded-2xl space-y-5 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="size-5 text-destructive shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Bulletin de Veille Cybersécurité &amp; Vulnérabilités DSI
            </h3>
            <p className="text-xs text-muted-foreground">
              Alertes de failles matérielles, firmwares et menaces actives en zone UEMOA
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] text-destructive border-destructive/40 bg-destructive/10 uppercase font-bold">
          Veille SIEM Active
        </Badge>
      </div>

      <div className="space-y-4">
        {ACTIVE_SECURITY_ADVISORIES.map((advisory) => (
          <div
            key={advisory.cveId}
            className="p-4 rounded-xl border border-border bg-surface/60 space-y-2.5 shadow-xs transition-all hover:border-border/80"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20">
                  {advisory.cveId}
                </span>
                <h4 className="text-xs font-bold text-foreground">{advisory.title}</h4>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-[10px] text-destructive border-destructive/30">
                  {advisory.severity}
                </Badge>
                <span className="text-[10px] text-muted-foreground">{advisory.publishDate}</span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Matériel affecté : <strong className="text-foreground">{advisory.affectedHardware}</strong>
            </div>

            <div className="bg-background p-3 rounded-lg border border-border text-xs space-y-1">
              <span className="font-bold text-foreground block text-[11px]">Action de remédiation préconisée :</span>
              <p className="text-muted-foreground">{advisory.mitigationAction}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border">
        <p className="text-[11px] text-muted-foreground">
          Nos techniciens appliquent les correctifs de micro-code et firmwares lors des visites préventives mensuelles.
        </p>
        <Button asChild variant="outline" size="sm" className="text-xs font-bold shrink-0">
          <a
            href={`https://wa.me/22960000000?text=${encodeURIComponent(
              "Bonjour Allô Techno Sécurité, nous souhaitons planifier un audit de vulnérabilités firmware et de configuration BIOS sur notre parc informatique.",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Demander un Audit Sécurité Matérielle &rarr;
          </a>
        </Button>
      </div>
    </div>
  );
}
