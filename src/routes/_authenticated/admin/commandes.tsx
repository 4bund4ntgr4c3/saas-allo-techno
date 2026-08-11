import { createFileRoute } from "@tanstack/react-router";
import { OrdersSection } from "@/components/admin/AdminOrders";

export const Route = createFileRoute("/_authenticated/admin/commandes")({
  component: OrdersSection,
});
