import { createFileRoute } from "@tanstack/react-router";
import { AdminReferrals } from "@/components/admin/AdminReferrals";

export const Route = createFileRoute("/_authenticated/admin/parrainage")({
  component: AdminReferrals,
});
