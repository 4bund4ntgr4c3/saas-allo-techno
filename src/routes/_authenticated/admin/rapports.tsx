import { createFileRoute } from "@tanstack/react-router";
import { AdminAdvancedReports } from "@/components/admin/AdminAdvancedReports";

export const Route = createFileRoute("/_authenticated/admin/rapports")({
  component: AdminAdvancedReports,
});
