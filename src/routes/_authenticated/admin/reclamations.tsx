import { createFileRoute } from "@tanstack/react-router";
import { ClaimsSection } from "@/components/admin/AdminLeadsClaims";

export const Route = createFileRoute("/_authenticated/admin/reclamations")({
  component: ClaimsSection,
});
