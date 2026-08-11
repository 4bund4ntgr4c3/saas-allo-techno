import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const LeadsSection = lazy(() =>
  import("@/components/admin/AdminLeadsClaims").then((m) => ({ default: m.LeadsSection })),
);

export const Route = createFileRoute("/_authenticated/admin/leads")({
  component: () => (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>}>
      <LeadsSection />
    </Suspense>
  ),
});
