import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const AdminInternalNotifs = lazy(() =>
  import("@/components/admin/AdminInternalNotifs").then((m) => ({ default: m.AdminInternalNotifs })),
);

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  component: () => (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>}>
      <AdminInternalNotifs />
    </Suspense>
  ),
});
