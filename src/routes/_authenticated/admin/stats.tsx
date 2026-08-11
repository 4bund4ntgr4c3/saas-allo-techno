import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const StatsDashboard = lazy(() =>
  import("@/components/admin/StatsDashboard").then((m) => ({ default: m.StatsDashboard })),
);

export const Route = createFileRoute("/_authenticated/admin/stats")({
  component: () => (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>}>
      <StatsDashboard />
    </Suspense>
  ),
});
