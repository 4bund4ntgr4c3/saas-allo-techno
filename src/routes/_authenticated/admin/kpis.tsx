import { createFileRoute } from "@tanstack/react-router";
import { KpisSection } from "@/components/admin/AdminKpis";

export const Route = createFileRoute("/_authenticated/admin/kpis")({
  component: KpisSection,
});
