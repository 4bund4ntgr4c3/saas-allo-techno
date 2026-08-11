import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const SecuritySection = lazy(() =>
  import("@/components/admin/AdminSecurity").then((m) => ({ default: m.SecuritySection })),
);

export const Route = createFileRoute("/_authenticated/admin/securite")({
  component: () => (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>}>
      <SecuritySection />
    </Suspense>
  ),
});
