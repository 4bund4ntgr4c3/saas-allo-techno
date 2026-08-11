import { createFileRoute } from "@tanstack/react-router";
import { RefundsSection } from "@/components/admin/AdminRefunds";

export const Route = createFileRoute("/_authenticated/admin/remboursements")({
  component: RefundsSection,
});
