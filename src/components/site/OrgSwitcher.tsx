import { useState } from "react";
import { Building2, ChevronDown, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export type OrgOption = {
  id: string;
  name: string;
  role: "owner" | "admin" | "member";
};

export function OrgSwitcher({
  organizations,
  currentOrgId,
  onSelectOrg,
  onCreateOrg,
}: {
  organizations: OrgOption[];
  currentOrgId?: string;
  onSelectOrg: (orgId: string) => void;
  onCreateOrg?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const currentOrg = organizations.find((o) => o.id === currentOrgId) ?? organizations[0];

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition-all rounded-xs shadow-xs"
        aria-expanded={open}
      >
        <Building2 className="size-4 text-primary shrink-0" />
        <span className="truncate max-w-[140px] font-medium">{currentOrg?.name ?? "Mon Organisation"}</span>
        <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 border border-primary/40 bg-primary/10 text-primary font-bold">
          {currentOrg?.role ?? "Admin"}
        </span>
        <ChevronDown className={`size-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-64 border border-border bg-card shadow-lg z-50 p-1.5 space-y-1 at-in">
          <div className="px-2 py-1.5 border-b border-border mb-1">
            <span className="at-eyebrow text-[10px] text-muted-foreground block">Vos Organisations B2B</span>
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto">
            {organizations.map((org) => {
              const selected = org.id === currentOrg?.id;
              return (
                <button
                  key={org.id}
                  onClick={() => {
                    onSelectOrg(org.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 text-left text-xs transition-colors rounded-xs ${
                    selected ? "bg-primary/10 border border-primary/30 text-foreground font-bold" : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className={`size-3.5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="truncate">{org.name}</span>
                  </div>
                  {selected && <Check className="size-3.5 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>

          {onCreateOrg && (
            <div className="border-t border-border pt-1 mt-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs text-primary gap-1.5 h-8 font-medium"
                onClick={() => {
                  onCreateOrg();
                  setOpen(false);
                }}
              >
                <Plus className="size-3.5" />
                <span>Ajouter une Entreprise</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
