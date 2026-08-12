import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const AdminSatisfaction = lazy(() =>
  import("@/components/admin/AdminSatisfaction").then((m) => ({ default: m.AdminSatisfaction })),
);

export const Route = createFileRoute("/_authenticated/admin/satisfaction")({
  component: () => (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AdminSatisfaction />
    </Suspense>
  ),
});
