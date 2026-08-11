import { createFileRoute } from "@tanstack/react-router";
import { AdminChat } from "@/components/admin/AdminChat";

export const Route = createFileRoute("/_authenticated/admin/chat")({
  component: AdminChat,
});
