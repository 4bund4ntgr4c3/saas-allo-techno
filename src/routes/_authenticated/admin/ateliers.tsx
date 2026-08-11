import { createFileRoute } from "@tanstack/react-router";
import { AdminWorkshops } from "@/components/admin/AdminWorkshops";

export const Route = createFileRoute("/_authenticated/admin/ateliers")({
  component: AdminWorkshops,
});
