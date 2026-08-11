import { createFileRoute } from "@tanstack/react-router";
import { AtelierBoard } from "@/components/admin/AdminAtelier";

export const Route = createFileRoute("/_authenticated/admin/atelier")({
  component: AtelierBoard,
});
