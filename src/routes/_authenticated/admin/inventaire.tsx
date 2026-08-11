import { createFileRoute } from "@tanstack/react-router";
import { AdminInventory } from "@/components/admin/AdminInventory";

export const Route = createFileRoute("/_authenticated/admin/inventaire")({
  component: AdminInventory,
});
