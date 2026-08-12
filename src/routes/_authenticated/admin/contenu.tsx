import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const ContentSection = lazy(() =>
  import("@/components/admin/AdminContent").then((m) => ({ default: m.ContentSection })),
);

export const Route = createFileRoute("/_authenticated/admin/contenu")({
  component: () => (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ContentSection />
    </Suspense>
  ),
});
