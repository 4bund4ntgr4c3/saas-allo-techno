import { createFileRoute } from "@tanstack/react-router";
import { DossiersSection } from "@/components/admin/AdminDossiers";

export const Route = createFileRoute("/_authenticated/admin/dossiers")({
  component: DossiersSection,
});
