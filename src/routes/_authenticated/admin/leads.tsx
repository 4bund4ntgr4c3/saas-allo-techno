import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/leads")({
  component: LeadsPlaceholder,
});

function LeadsPlaceholder() {
  return <div className="space-y-6"><h1 className="text-2xl font-semibold">Leads</h1><p className="text-muted-foreground">Chargement…</p></div>;
}