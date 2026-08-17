import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rateLimit } from "@/lib/security";

export type MaintenancePlanItem = {
  id: string;
  organizationId: string;
  title: string;
  frequencyMonths: 2 | 3 | 6 | 12;
  nextDueDate: string;
  assignedTechnician?: string;
  targetSites: string[];
  equipmentCount: number;
  status: "scheduled" | "in_progress" | "completed";
};

export const getMaintenancePlansFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ orgId: z.string() }).parse(data))
  .handler(async ({ data }): Promise<MaintenancePlanItem[]> => {
    if (!(await rateLimit("get-maintenance-plans", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const { orgId } = data;
    const today = new Date();
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    return [
      {
        id: "mplan-1",
        organizationId: orgId,
        title: "Maintenance Préventive Trimestrielle — Parc Informatique & Serveurs",
        frequencyMonths: 3,
        nextDueDate: nextMonth,
        assignedTechnician: "Équipe Atelier Calavi",
        targetSites: ["Siège Abomey-Calavi", "Agence Cotonou"],
        equipmentCount: 24,
        status: "scheduled",
      },
      {
        id: "mplan-2",
        organizationId: orgId,
        title: "Nettoyage & Dépoussiérage Semestriel des Imprimantes & Scanners",
        frequencyMonths: 6,
        nextDueDate: "2026-10-15",
        assignedTechnician: "Jean-Baptiste K.",
        targetSites: ["Siège Abomey-Calavi"],
        equipmentCount: 8,
        status: "scheduled",
      },
    ];
  });
