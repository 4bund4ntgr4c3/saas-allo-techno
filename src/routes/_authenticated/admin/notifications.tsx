import { createFileRoute } from "@tanstack/react-router";
import { AdminInternalNotifs } from "@/components/admin/AdminInternalNotifs";

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  component: AdminInternalNotifs,
});
