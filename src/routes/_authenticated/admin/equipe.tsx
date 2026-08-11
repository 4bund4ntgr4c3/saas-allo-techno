import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const TeamSection = lazy(() =>
  import("@/components/admin/AdminTeam").then((m) => ({ default: m.TeamSection })),
);

export const Route = createFileRoute("/_authenticated/admin/equipe")({
  component: () => (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>}>
      <TeamSection />
    </Suspense>
  ),
});
