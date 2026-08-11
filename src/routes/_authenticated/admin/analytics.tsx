import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsSection } from "@/components/admin/AdminAnalytics";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AnalyticsSection,
});
