import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const AdminKnowledgeBase = lazy(() =>
  import("@/components/admin/AdminKnowledgeBase").then((m) => ({ default: m.AdminKnowledgeBase })),
);

export const Route = createFileRoute("/_authenticated/admin/kb")({
  component: () => (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>}>
      <AdminKnowledgeBase />
    </Suspense>
  ),
});
