import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/stats")({
  component: StatsPlaceholder,
});

function StatsPlaceholder() {
  return <div className="space-y-6"><h1 className="text-2xl font-semibold">Statistiques</h1><p className="text-muted-foreground">Chargement…</p></div>;
}