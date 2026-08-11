import { createFileRoute } from "@tanstack/react-router";
import { AuditSection } from "@/components/admin/AdminAudit";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  component: AuditSection,
});
