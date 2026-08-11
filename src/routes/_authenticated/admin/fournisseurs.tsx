import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const AdminSuppliers = lazy(() =>
  import("@/components/admin/AdminSuppliers").then((m) => ({ default: m.AdminSuppliers })),
);

export const Route = createFileRoute("/_authenticated/admin/fournisseurs")({
  component: () => (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>}>
      <AdminSuppliers />
    </Suspense>
  ),
});
