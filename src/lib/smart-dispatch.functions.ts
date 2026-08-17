// ============================================================================
// Allô Techno — Dispatch Intelligent & Routage Optimisé des Dossiers Atelier
// Attribution automatique selon la spécialité des techniciens et le respect SLA.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { rateLimit } from "@/lib/security";

export interface TechnicianWorkload {
  technicianId: string;
  name: string;
  specialty:
    | "Micro-Soudure & Carte Mère"
    | "Sauvetage Données Salle Blanche"
    | "Remplacement Écran & Clavier Rapide"
    | "Réseau & Onduleurs";
  currentActiveTickets: number;
  maxCapacity: number;
  slaSuccessRatePercent: number;
}

export interface DispatchedTicket {
  ticketId: string;
  deviceTitle: string;
  faultSummary: string;
  assignedTechnicianName: string;
  benchNumber: string;
  estimatedCompletionTime: string;
  slaTargetHours: number;
}

export const MOCK_TECHNICIANS: TechnicianWorkload[] = [
  {
    technicianId: "TECH-01",
    name: "Brice Hountondji",
    specialty: "Micro-Soudure & Carte Mère",
    currentActiveTickets: 2,
    maxCapacity: 4,
    slaSuccessRatePercent: 98.6,
  },
  {
    technicianId: "TECH-02",
    name: "Cédric Agbossou",
    specialty: "Sauvetage Données Salle Blanche",
    currentActiveTickets: 1,
    maxCapacity: 3,
    slaSuccessRatePercent: 99.1,
  },
  {
    technicianId: "TECH-03",
    name: "Marc Alapini",
    specialty: "Remplacement Écran & Clavier Rapide",
    currentActiveTickets: 3,
    maxCapacity: 6,
    slaSuccessRatePercent: 97.4,
  },
];

export const getSmartDispatchQueueFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<{
    technicians: TechnicianWorkload[];
    activeDispatches: DispatchedTicket[];
  }> => {
    if (!(await rateLimit("get-smart-dispatch-queue", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    return {
      technicians: MOCK_TECHNICIANS,
      activeDispatches: [
        {
          ticketId: "AT-89201",
          deviceTitle: "MacBook Air M1 (Liquide Renversé / Court-circuit PPBUS)",
          faultSummary: "Ne s'allume plus, corrosion visible autour du PMIC U7000",
          assignedTechnicianName: "Brice Hountondji",
          benchNumber: "Banc Électronique B-02",
          estimatedCompletionTime: "1h 45m",
          slaTargetHours: 4,
        },
        {
          ticketId: "AT-89202",
          deviceTitle: "Disque Dur Externe WD 2 To (Chute mécanique / Clics répétés)",
          faultSummary: "Bloc de têtes endommagé, transplantation en hotte à flux laminaire",
          assignedTechnicianName: "Cédric Agbossou",
          benchNumber: "Hotte Salle Blanche H-01",
          estimatedCompletionTime: "3h 20m",
          slaTargetHours: 8,
        },
      ],
    };
  },
);
