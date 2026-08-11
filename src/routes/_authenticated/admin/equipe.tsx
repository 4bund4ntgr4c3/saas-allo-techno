import { createFileRoute } from "@tanstack/react-router";
import { TeamSection } from "@/components/admin/AdminTeam";

export const Route = createFileRoute("/_authenticated/admin/equipe")({
  component: TeamSection,
});
