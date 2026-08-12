import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const AnalyticsAdvanced = lazy(() =>
  import("@/components/admin/AdminAnalyticsAdvanced").then((m) => ({
    default: m.AnalyticsAdvanced,
  })),
);

export const Route = createFileRoute("/_authenticated/admin/analytics-advanced")({
  component: () => (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AnalyticsAdvanced />
    </Suspense>
  ),
});
