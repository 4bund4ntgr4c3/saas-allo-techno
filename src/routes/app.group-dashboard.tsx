import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, Globe2, Laptop, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMyOrganizations } from "@/lib/org.functions";

export const Route = createFileRoute("/app/group-dashboard")({
  component: GroupDashboardPage,
});

function GroupDashboardPage() {
  const orgs = useQuery({ queryKey: ["app", "orgs"], queryFn: () => getMyOrganizations() });
  const list = orgs.data ?? [];

  const totalEquipment = list.reduce((sum, o) => sum + (o.equipment_count ?? 0), 0);
  const totalSites = list.reduce((sum, o) => sum + (o.site_count ?? 0), 0);

  return (
    <div className="space-y-8">
      {/* ─── Header ─── */}
      <div className="at-in">
        <Link
          to="/app"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Retour au Portail
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="at-eyebrow mb-1 block">Console Holding / Multi-Filiales</span>
            <h1 className="at-display text-2xl font-bold md:text-3xl">Vue Consolidée du Groupe</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Supervision régionale consolidée de toutes les filiales et entités B2B Allô Techno.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-primary/40 text-primary bg-primary/10 font-mono text-xs uppercase"
          >
            Groupe Régional UEMOA
          </Badge>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="at-in grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="border border-border bg-card p-5 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="at-eyebrow text-[10px]">Filiales Actives</span>
            <Building2 className="size-4 text-primary" />
          </div>
          <p className="font-mono text-3xl font-extrabold">{list.length}</p>
          <p className="text-xs text-muted-foreground">Entités gérées</p>
        </div>

        <div className="border border-border bg-card p-5 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="at-eyebrow text-[10px]">Parc Global</span>
            <Laptop className="size-4 text-accent" />
          </div>
          <p className="font-mono text-3xl font-extrabold">{totalEquipment}</p>
          <p className="text-xs text-muted-foreground">Équipements répertoriés</p>
        </div>

        <div className="border border-border bg-card p-5 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="at-eyebrow text-[10px]">Sites Réseau</span>
            <Globe2 className="size-4 text-success" />
          </div>
          <p className="font-mono text-3xl font-extrabold">{totalSites}</p>
          <p className="text-xs text-muted-foreground">Agences & Ateliers</p>
        </div>

        <div className="border border-border bg-card p-5 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="at-eyebrow text-[10px]">Conformité SLA</span>
            <ShieldCheck className="size-4 text-emerald-600" />
          </div>
          <p className="font-mono text-3xl font-extrabold text-emerald-600">97.8%</p>
          <p className="text-xs text-muted-foreground">Prise en charge &lt; 2h</p>
        </div>
      </div>

      {/* ─── Subsidiaries List ─── */}
      <div className="space-y-4 at-in">
        <h2 className="text-lg font-bold">Détail Consolidé par Filiale</h2>
        <div className="divide-y divide-border border border-border bg-card">
          {list.map((org) => (
            <div
              key={org.id}
              className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="size-12 bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold font-mono">
                  {org.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-base">{org.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {org.sector ?? "Secteur Tertiaire"} · {org.country} ·{" "}
                    {org.registration_number ?? "RB/COT/2026"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="at-eyebrow text-[10px] text-muted-foreground block">
                    Équipements
                  </span>
                  <span className="font-mono font-bold">{org.equipment_count ?? 0} machines</span>
                </div>
                <div>
                  <span className="at-eyebrow text-[10px] text-muted-foreground block">Sites</span>
                  <span className="font-mono font-bold">{org.site_count ?? 0} implantations</span>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/app/organizations/$orgId" params={{ orgId: org.id }}>
                    Accéder à l'Espace
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
