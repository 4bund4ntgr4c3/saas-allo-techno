import { createFileRoute } from "@tanstack/react-router";
import { LeadsSection } from "@/components/admin/AdminLeadsClaims";

export const Route = createFileRoute("/_authenticated/admin/leads")({
  component: LeadsSection,
});
