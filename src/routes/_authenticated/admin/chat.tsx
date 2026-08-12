import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const AdminChat = lazy(() =>
  import("@/components/admin/AdminChat").then((m) => ({ default: m.AdminChat })),
);

export const Route = createFileRoute("/_authenticated/admin/chat")({
  component: () => (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AdminChat />
    </Suspense>
  ),
});
