import { describe, it, expect } from "vitest";
import { computeEquipmentHealthScore } from "@/lib/health-score";

describe("Health Score & Predictive Maintenance Engine", () => {
  it("computes high health score for new active equipment under warranty", () => {
    const health = computeEquipmentHealthScore({
      status: "garantie",
      created_at: new Date().toISOString(),
      warranty_expires_at: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
    });

    expect(health.score).toBeGreaterThanOrEqual(95);
    expect(health.label).toBe("Excellent");
  });

  it("penalizes score appropriately for equipment in breakdown or maintenance", () => {
    const healthBreakdown = computeEquipmentHealthScore({
      status: "en_panne",
      interventions_count: 3,
    });

    expect(healthBreakdown.score).toBeLessThanOrEqual(50);
    expect(["Critique", "À Surveiller"]).toContain(healthBreakdown.label);

    const healthRetired = computeEquipmentHealthScore({
      status: "retire",
    });

    expect(healthRetired.score).toBeLessThanOrEqual(25);
    expect(healthRetired.label).toBe("Fin de vie");
  });

  it("factors in machine age and degradation over time", () => {
    const fourYearsAgo = new Date(Date.now() - 4 * 365 * 24 * 3600 * 1000).toISOString();
    const healthOld = computeEquipmentHealthScore({
      status: "actif",
      purchase_date: fourYearsAgo,
    });

    const healthNew = computeEquipmentHealthScore({
      status: "actif",
      purchase_date: new Date().toISOString(),
    });

    expect(healthOld.score).toBeLessThan(healthNew.score);
  });
});
