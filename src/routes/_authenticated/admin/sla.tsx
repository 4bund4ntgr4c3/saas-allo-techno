import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const AdminSLA = lazy(() =>
  import("@/components/admin/AdminSLA").then((m) => ({ default: m.AdminSLA })),
);

export const Route = createFileRoute("/_authenticated/admin/sla")({
  component: () => (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AdminSLA />
    </Suspense>
  ),
});
