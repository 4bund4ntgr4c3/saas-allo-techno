import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const AdminMarketing = lazy(() =>
  import("@/components/admin/AdminMarketing").then((m) => ({ default: m.AdminMarketing })),
);

export const Route = createFileRoute("/_authenticated/admin/marketing")({
  component: () => (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AdminMarketing />
    </Suspense>
  ),
});
