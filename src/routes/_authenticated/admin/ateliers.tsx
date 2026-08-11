import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const AdminWorkshops = lazy(() =>
  import("@/components/admin/AdminWorkshops").then((m) => ({ default: m.AdminWorkshops })),
);

export const Route = createFileRoute("/_authenticated/admin/ateliers")({
  component: () => (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>}>
      <AdminWorkshops />
    </Suspense>
  ),
});
