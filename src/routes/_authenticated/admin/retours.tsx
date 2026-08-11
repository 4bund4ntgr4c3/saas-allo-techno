import { createFileRoute } from "@tanstack/react-router";
import { ReturnsSection } from "@/components/admin/AdminReturns";

export const Route = createFileRoute("/_authenticated/admin/retours")({
  component: ReturnsSection,
});
