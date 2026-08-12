import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const AuditSection = lazy(() =>
  import("@/components/admin/AdminAudit").then((m) => ({ default: m.AuditSection })),
);

export const Route = createFileRoute("/_authenticated/admin/audit")({
  component: () => (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AuditSection />
    </Suspense>
  ),
});
