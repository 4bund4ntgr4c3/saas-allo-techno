import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const DossiersSection = lazy(() =>
  import("@/components/admin/AdminDossiers").then((m) => ({ default: m.DossiersSection })),
);

export const Route = createFileRoute("/_authenticated/admin/dossiers")({
  component: () => (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>}>
      <DossiersSection />
    </Suspense>
  ),
});
