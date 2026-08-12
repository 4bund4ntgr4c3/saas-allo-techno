import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const KpisSection = lazy(() =>
  import("@/components/admin/AdminKpis").then((m) => ({ default: m.KpisSection })),
);

export const Route = createFileRoute("/_authenticated/admin/kpis")({
  component: () => (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <KpisSection />
    </Suspense>
  ),
});
