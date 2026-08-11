import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const ClaimsSection = lazy(() =>
  import("@/components/admin/AdminLeadsClaims").then((m) => ({ default: m.ClaimsSection })),
);

export const Route = createFileRoute("/_authenticated/admin/reclamations")({
  component: () => (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>}>
      <ClaimsSection />
    </Suspense>
  ),
});
