import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsAdvanced } from "@/components/admin/AdminAnalyticsAdvanced";

export const Route = createFileRoute("/_authenticated/admin/analytics-advanced")({
  component: AnalyticsAdvanced,
});
