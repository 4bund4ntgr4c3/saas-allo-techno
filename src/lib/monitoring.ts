type MetricName =
  | "reservation_created"
  | "reservation_completed"
  | "payment_processed"
  | "payment_failed"
  | "review_submitted"
  | "lead_created"
  | "quote_sent"
  | "quote_approved"
  | "quote_declined";

interface MetricEntry {
  name: MetricName;
  timestamp: string;
  data?: Record<string, unknown>;
}

const metricsBuffer: MetricEntry[] = [];

export function trackMetric(name: MetricName, data?: Record<string, unknown>) {
  metricsBuffer.push({
    name,
    timestamp: new Date().toISOString(),
    ...(data !== undefined ? { data } : {}),
  });

  if (metricsBuffer.length >= 50) {
    flushMetrics();
  }
}

export function flushMetrics() {
  if (metricsBuffer.length === 0) return;

  const entries = metricsBuffer.splice(0);

  console.log(
    JSON.stringify({
      type: "metrics_batch",
      count: entries.length,
      entries,
    }),
  );
}

export function getMetricsSummary(): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const entry of metricsBuffer) {
    counts.set(entry.name, (counts.get(entry.name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
