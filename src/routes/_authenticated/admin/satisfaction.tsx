import { createFileRoute } from "@tanstack/react-router";
import { AdminSatisfaction } from "@/components/admin/AdminSatisfaction";

export const Route = createFileRoute("/_authenticated/admin/satisfaction")({
  component: AdminSatisfaction,
});
