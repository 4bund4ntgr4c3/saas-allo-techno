import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const AtelierBoard = lazy(() =>
  import("@/components/admin/AdminAtelier").then((m) => ({ default: m.AtelierBoard })),
);

export const Route = createFileRoute("/_authenticated/admin/atelier")({
  component: () => (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AtelierBoard />
    </Suspense>
  ),
});
