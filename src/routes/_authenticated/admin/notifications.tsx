import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  component: Placeholder,
});

function Placeholder() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <p className="text-muted-foreground">Chargement…</p>
    </div>
  );
}
