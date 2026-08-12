import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const RefundsSection = lazy(() =>
  import("@/components/admin/AdminRefunds").then((m) => ({ default: m.RefundsSection })),
);

export const Route = createFileRoute("/_authenticated/admin/remboursements")({
  component: () => (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <RefundsSection />
    </Suspense>
  ),
});
