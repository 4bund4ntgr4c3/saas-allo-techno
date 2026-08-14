import { ShieldCheck, PhoneCall } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatFcfa } from "@/data/catalog/company";

export interface OrgContractData {
  contractNumber: string;
  formula: string;
  monthlyPrice: number;
  responseSlaHours: number;
  resolutionSlaHours: number;
  coveredEquipmentCount: number;
  equipmentLimit: number;
}

export interface ActiveContractCardProps {
  contract: OrgContractData;
  onPayMobileMoney: () => void;
}

export function ActiveContractCard({ contract, onPayMobileMoney }: ActiveContractCardProps) {
  return (
    <div className="border border-primary/40 bg-primary/5 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-lg shadow-xs animate-in fade-in duration-150">
      <div className="flex items-center gap-4">
        <div className="size-12 border border-primary bg-primary text-primary-foreground flex items-center justify-center font-bold rounded-md">
          <ShieldCheck className="size-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-mono text-base font-extrabold uppercase text-foreground">
              Contrat SLA Actif — {contract.contractNumber}
            </h3>
            <Badge
              variant="outline"
              className="border-success text-success bg-success/10 uppercase font-mono text-[10px]"
            >
              {contract.formula} SLA
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Engagements :{" "}
            <strong className="text-foreground">
              Garantie Prise en Charge {contract.responseSlaHours}h
            </strong>{" "}
            ·{" "}
            <strong className="text-foreground">
              Résolution {contract.resolutionSlaHours}h
            </strong>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-primary/20 pt-3 md:pt-0 md:pl-6">
        <div>
          <span className="at-eyebrow text-[10px] text-muted-foreground block">
            Forfait Mensuel
          </span>
          <span className="font-mono text-lg font-bold text-primary">
            {formatFcfa(contract.monthlyPrice)} /mois
          </span>
        </div>
        <div>
          <span className="at-eyebrow text-[10px] text-muted-foreground block">
            Flotte Couverte
          </span>
          <span className="font-mono text-sm font-bold text-foreground">
            {contract.coveredEquipmentCount} / {contract.equipmentLimit} appareils
          </span>
        </div>
        <Button
          size="sm"
          onClick={onPayMobileMoney}
          className="gap-1.5 font-mono text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <PhoneCall className="size-3.5" />
          <span>Payer SLA (Mobile Money)</span>
        </Button>
      </div>
    </div>
  );
}
