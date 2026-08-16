import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Activity, Clock, ShieldCheck, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface SlaAnalyticsData {
  uptimePercent: number;
  mttrHours: number;
  slaCompliancePercent: number;
  totalTicketsResolved: number;
  monthlyTrend: {
    month: string;
    interventions: number;
    preventiveCount: number;
    avgResolutionHours: number;
  }[];
  breakdownByType: {
    type: string;
    count: number;
  }[];
}

const DEFAULT_ANALYTICS_DATA: SlaAnalyticsData = {
  uptimePercent: 99.8,
  mttrHours: 2.8,
  slaCompliancePercent: 100,
  totalTicketsResolved: 24,
  monthlyTrend: [
    { month: "Mars", interventions: 4, preventiveCount: 8, avgResolutionHours: 3.2 },
    { month: "Avr", interventions: 6, preventiveCount: 10, avgResolutionHours: 2.9 },
    { month: "Mai", interventions: 3, preventiveCount: 8, avgResolutionHours: 2.5 },
    { month: "Juin", interventions: 5, preventiveCount: 12, avgResolutionHours: 2.7 },
    { month: "Juil", interventions: 4, preventiveCount: 14, avgResolutionHours: 2.4 },
    { month: "Août", interventions: 2, preventiveCount: 15, avgResolutionHours: 2.1 },
  ],
  breakdownByType: [
    { type: "Laptops / PC", count: 14 },
    { type: "Serveurs & Réseau", count: 6 },
    { type: "Imprimantes", count: 4 },
  ],
};

export function SlaAnalyticsDashboard({ data = DEFAULT_ANALYTICS_DATA }: { data?: SlaAnalyticsData }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─── Top SLA KPI Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-border bg-card p-4 rounded-lg shadow-xs">
          <div className="flex items-center justify-between pb-2">
            <span className="at-eyebrow text-muted-foreground text-[10px]">Disponibilité Parc</span>
            <ShieldCheck className="size-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-extrabold text-foreground">
              {data.uptimePercent}%
            </span>
            <Badge variant="outline" className="border-emerald-600/40 text-emerald-600 bg-emerald-500/10 text-[10px]">
              SLA 99.5% Garanti
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Taux de fonctionnement continu</p>
        </div>

        <div className="border border-border bg-card p-4 rounded-lg shadow-xs">
          <div className="flex items-center justify-between pb-2">
            <span className="at-eyebrow text-muted-foreground text-[10px]">MTTR (Temps de Résolution)</span>
            <Clock className="size-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-extrabold text-foreground">
              {data.mttrHours} h
            </span>
            <span className="text-[10px] text-success font-semibold">Objectif &lt; 4h</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Délai moyen de remise en service</p>
        </div>

        <div className="border border-border bg-card p-4 rounded-lg shadow-xs">
          <div className="flex items-center justify-between pb-2">
            <span className="at-eyebrow text-muted-foreground text-[10px]">Respect des Engagements</span>
            <Activity className="size-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-extrabold text-blue-600">
              {data.slaCompliancePercent}%
            </span>
            <span className="text-[10px] text-muted-foreground">0 pénalité</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Interventions traitées dans les délais</p>
        </div>

        <div className="border border-border bg-card p-4 rounded-lg shadow-xs">
          <div className="flex items-center justify-between pb-2">
            <span className="at-eyebrow text-muted-foreground text-[10px]">Tickets Traités (2026)</span>
            <TrendingUp className="size-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-extrabold text-foreground">
              {data.totalTicketsResolved}
            </span>
            <span className="text-[10px] text-muted-foreground">100% clôturés</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Historique certifié Allô Techno</p>
        </div>
      </div>

      {/* ─── Interactive Charts Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-border bg-card p-5 rounded-lg space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-foreground">
                Évolution des Interventions &amp; Maintenances
              </h4>
              <p className="text-xs text-muted-foreground">Historique mensuel sur les 6 derniers mois</p>
            </div>
            <Badge variant="outline" className="font-mono text-[10px]">
              Données Live
            </Badge>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPreventive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCurative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d83100" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#d83100" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.5} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "6px",
                    color: "#ffffff",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="preventiveCount"
                  name="Maintenances Préventives"
                  stroke="#16a34a"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPreventive)"
                />
                <Area
                  type="monotone"
                  dataKey="interventions"
                  name="Dépannages Curatifs"
                  stroke="#d83100"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCurative)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-border bg-card p-5 rounded-lg space-y-4">
          <div className="border-b border-border pb-3">
            <h4 className="font-bold text-sm uppercase tracking-wider text-foreground">
              Répartition par Matériel
            </h4>
            <p className="text-xs text-muted-foreground">Volume de prises en charge</p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.breakdownByType} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="type" stroke="#94a3b8" fontSize={10} tickLine={false} width={85} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "6px",
                    color: "#ffffff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" name="Appareils" fill="#0f172a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
