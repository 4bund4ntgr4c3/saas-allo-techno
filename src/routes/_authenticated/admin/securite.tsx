import { createFileRoute } from "@tanstack/react-router";
import { SecuritySection } from "@/components/admin/AdminSecurity";

export const Route = createFileRoute("/_authenticated/admin/securite")({
  component: SecuritySection,
});
