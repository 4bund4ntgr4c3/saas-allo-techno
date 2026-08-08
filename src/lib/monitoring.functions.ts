import { createServerFn } from "@tanstack/react-start";
import { getMetricsSummary } from "@/lib/monitoring";

export const getMetrics = createServerFn({ method: "GET" }).handler(() => {
  return getMetricsSummary();
});
