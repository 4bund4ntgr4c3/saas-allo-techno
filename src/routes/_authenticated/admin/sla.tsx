import { createFileRoute } from "@tanstack/react-router";
import { AdminSLA } from "@/components/admin/AdminSLA";

export const Route = createFileRoute("/_authenticated/admin/sla")({
  component: AdminSLA,
});
