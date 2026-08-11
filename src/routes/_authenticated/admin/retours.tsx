import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const ReturnsSection = lazy(() =>
  import("@/components/admin/AdminReturns").then((m) => ({ default: m.ReturnsSection })),
);

export const Route = createFileRoute("/_authenticated/admin/retours")({
  component: () => (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>}>
      <ReturnsSection />
    </Suspense>
  ),
});
