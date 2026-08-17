import * as React from "react";
import { FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { generatePssiPolicy } from "@/lib/pssi-policy-generator";

export function PssiGeneratorModal() {
  const formTopRef = React.useRef<HTMLDivElement>(null);
  const [companyName, setCompanyName] = React.useState("Banque Internationale du Bénin (BIBE)");
  const [allowRemoteWork, setAllowRemoteWork] = React.useState(true);
  const [requireBitLocker, setRequireBitLocker] = React.useState(true);
  const [strictUsbBan, setStrictUsbBan] = React.useState(true);

  const pssi = React.useMemo(() => {
    return generatePssiPolicy(companyName, allowRemoteWork, requireBitLocker, strictUsbBan);
  }, [companyName, allowRemoteWork, requireBitLocker, strictUsbBan]);

  return (
    <div
      ref={formTopRef}
      className="border border-border bg-card p-5 sm:p-7 rounded-2xl max-w-3xl mx-auto space-y-6 shadow-xl animate-in fade-in duration-200"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <FileText className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Générateur de PSSI &amp; Charte Informatique DSI
            </h3>
            <p className="text-xs text-muted-foreground">
              Création instantanée des règles de sécurité des données et des postes conforme APDP
              Bénin
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-xs text-emerald-600 border-emerald-600/40 bg-emerald-600/10 font-bold"
        >
          Conforme APDP Bénin
        </Badge>
      </div>

      {/* Configuration */}
      <div className="space-y-4 text-xs">
        <div>
          <label className="text-muted-foreground block mb-1">
            Raison Sociale de l'Organisation :
          </label>
          <Input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setRequireBitLocker(!requireBitLocker)}
            className={`p-3 rounded-xl border text-left transition-all ${
              requireBitLocker ? "border-primary bg-primary/10" : "border-border bg-surface"
            }`}
          >
            <strong className="text-foreground block text-xs">Chiffrement BitLocker</strong>
            <span className="text-[10px] text-muted-foreground">
              Obligatoire sur tous les disques
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAllowRemoteWork(!allowRemoteWork)}
            className={`p-3 rounded-xl border text-left transition-all ${
              allowRemoteWork ? "border-primary bg-primary/10" : "border-border bg-surface"
            }`}
          >
            <strong className="text-foreground block text-xs">Télétravail Sécurisé</strong>
            <span className="text-[10px] text-muted-foreground">Accès via VPN d'entreprise</span>
          </button>

          <button
            type="button"
            onClick={() => setStrictUsbBan(!strictUsbBan)}
            className={`p-3 rounded-xl border text-left transition-all ${
              strictUsbBan ? "border-primary bg-primary/10" : "border-border bg-surface"
            }`}
          >
            <strong className="text-foreground block text-xs">Contrôle Clés USB</strong>
            <span className="text-[10px] text-muted-foreground">
              Analyse antivirus systématique
            </span>
          </button>
        </div>
      </div>

      {/* Generated Policy Preview */}
      <div className="border border-border bg-surface/70 p-5 rounded-2xl space-y-4 text-xs">
        <div className="flex justify-between items-center border-b border-border/60 pb-2">
          <strong className="text-foreground text-sm">{pssi.title}</strong>
          <span className="font-mono text-[10px] text-muted-foreground">{pssi.generatedDate}</span>
        </div>

        <div className="space-y-4">
          {pssi.sections.map((section, idx) => (
            <div key={idx} className="space-y-1.5">
              <h4 className="font-bold text-primary uppercase text-[11px] tracking-wide">
                {section.title}
              </h4>
              <ul className="space-y-1 pl-4 list-disc text-muted-foreground text-xs leading-relaxed">
                {section.rules.map((rule, rIdx) => (
                  <li key={rIdx}>{rule}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="technical"
          onClick={() => window.print()}
          className="w-full font-bold uppercase tracking-wider text-xs h-9"
        >
          <Printer className="size-3.5 mr-1.5" /> Imprimer / Exporter la Charte PSSI en PDF
        </Button>
      </div>
    </div>
  );
}
