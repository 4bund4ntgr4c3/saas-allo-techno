import { createFileRoute } from "@tanstack/react-router";
import { AdminKnowledgeBase } from "@/components/admin/AdminKnowledgeBase";

export const Route = createFileRoute("/_authenticated/admin/kb")({
  component: AdminKnowledgeBase,
});
