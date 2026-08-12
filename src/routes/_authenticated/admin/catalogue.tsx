import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const CatalogSection = lazy(() =>
  import("@/components/admin/AdminCatalog").then((m) => ({ default: m.CatalogSection })),
);

export const Route = createFileRoute("/_authenticated/admin/catalogue")({
  component: () => (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CatalogSection />
    </Suspense>
  ),
});
