import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const AdminFeatureFlags = lazy(() =>
  import("@/components/admin/AdminFeatureFlags").then((m) => ({
    default: m.AdminFeatureFlags,
  })),
);

export const Route = createFileRoute("/_authenticated/admin/feature-flags")({
  component: () => (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AdminFeatureFlags />
    </Suspense>
  ),
});
