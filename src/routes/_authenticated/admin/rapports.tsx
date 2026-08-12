import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const AdminAdvancedReports = lazy(() =>
  import("@/components/admin/AdminAdvancedReports").then((m) => ({
    default: m.AdminAdvancedReports,
  })),
);

export const Route = createFileRoute("/_authenticated/admin/rapports")({
  component: () => (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AdminAdvancedReports />
    </Suspense>
  ),
});
