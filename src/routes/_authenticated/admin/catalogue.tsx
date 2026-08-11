import { createFileRoute } from "@tanstack/react-router";
import { CatalogSection } from "@/components/admin/AdminCatalog";

export const Route = createFileRoute("/_authenticated/admin/catalogue")({
  component: CatalogSection,
});
