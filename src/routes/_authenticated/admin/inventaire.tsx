import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const AdminInventory = lazy(() =>
  import("@/components/admin/AdminInventory").then((m) => ({ default: m.AdminInventory })),
);

export const Route = createFileRoute("/_authenticated/admin/inventaire")({
  component: () => (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AdminInventory />
    </Suspense>
  ),
});
