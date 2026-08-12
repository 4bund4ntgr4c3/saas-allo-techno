import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const OrdersSection = lazy(() =>
  import("@/components/admin/AdminOrders").then((m) => ({ default: m.OrdersSection })),
);

export const Route = createFileRoute("/_authenticated/admin/commandes")({
  component: () => (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <OrdersSection />
    </Suspense>
  ),
});
