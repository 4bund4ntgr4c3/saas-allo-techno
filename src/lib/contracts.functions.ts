import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rateLimit } from "@/lib/security";

export type B2BContract = {
  id: string;
  organizationId: string;
  contractNumber: string;
  formula: "essentiel" | "business" | "enterprise";
  monthlyPrice: number;
  equipmentLimit: number;
  coveredEquipmentCount: number;
  startDate: string;
  endDate: string;
  responseSlaHours: number;
  resolutionSlaHours: number;
  status: "active" | "expiring_soon" | "expired" | "suspended";
};

export const getOrgContractFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ orgId: z.string() }).parse(data))
  .handler(async ({ data }): Promise<B2BContract | null> => {
    if (!(await rateLimit("get-org-contract", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const { orgId } = data;

    // Standard B2B SLA Contract details
    return {
      id: "contract-sla-001",
      organizationId: orgId,
      contractNumber: "SLA-2026-B2B-042",
      formula: "business",
      monthlyPrice: 125000,
      equipmentLimit: 50,
      coveredEquipmentCount: 24,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      responseSlaHours: 2,
      resolutionSlaHours: 24,
      status: "active",
    };
  });
