import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const AdminReferrals = lazy(() =>
  import("@/components/admin/AdminReferrals").then((m) => ({ default: m.AdminReferrals })),
);

export const Route = createFileRoute("/_authenticated/admin/parrainage")({
  component: () => (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AdminReferrals />
    </Suspense>
  ),
});
