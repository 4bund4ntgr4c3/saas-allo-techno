import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const AdminDeliveries = lazy(() =>
  import("@/components/admin/AdminDeliveries").then((m) => ({
    default: m.AdminDeliveries,
  })),
);

export const Route = createFileRoute("/_authenticated/admin/livraisons")({
  component: () => (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AdminDeliveries />
    </Suspense>
  ),
});
