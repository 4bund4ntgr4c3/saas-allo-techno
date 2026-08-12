import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const AdminPOS = lazy(() =>
  import("@/components/admin/AdminPOS").then((m) => ({
    default: m.AdminPOS,
  })),
);

export const Route = createFileRoute("/_authenticated/admin/caisse")({
  component: () => (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AdminPOS />
    </Suspense>
  ),
});
