import { createFileRoute } from "@tanstack/react-router";
import { KanbanBoard } from "@/components/admin/AdminKanban";

export const Route = createFileRoute("/_authenticated/admin/dossiers")({
  component: DossiersPage,
});

function DossiersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dossiers</h1>
        <p className="text-sm text-muted-foreground">Gestion des réservations et réparations.</p>
      </div>
      <p className="text-muted-foreground">Section en cours de migration depuis l'ancien layout.</p>
    </div>
  );
}
