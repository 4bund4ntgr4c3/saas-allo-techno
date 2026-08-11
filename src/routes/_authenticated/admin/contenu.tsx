import { createFileRoute } from "@tanstack/react-router";
import { ContentSection } from "@/components/admin/AdminContent";

export const Route = createFileRoute("/_authenticated/admin/contenu")({
  component: ContentSection,
});
