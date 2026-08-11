import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const AdminWebhooks = lazy(() =>
  import("@/components/admin/AdminWebhooks").then((m) => ({ default: m.AdminWebhooks })),
);

export const Route = createFileRoute("/_authenticated/admin/webhooks")({
  component: () => (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>}>
      <AdminWebhooks />
    </Suspense>
  ),
});
