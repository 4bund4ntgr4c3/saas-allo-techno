// ============================================================================
// Allô Techno — Télémétrie Matérielle en Direct & IA Prédictive (« Allô Pulse »)
// Surveillance de la santé des processeurs, cellules SSD et alertes pannes.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { rateLimit } from "@/lib/security";

export interface TelemetryEndpoint {
  deviceId: string;
  computerName: string;
  assignedUser: string;
  department: string;
  cpuTempCelsius: number;
  cpuLoadPercent: number;
  ramUsagePercent: number;
  ssdHealthPercent: number;
  ssdWearTbwRemaining: number;
  batteryHealthPercent: number;
  lastHeartbeat: string;
  riskStatus: "nominal" | "avertissement" | "critique";
  predictedFailure?: {
    component: string;
    estimatedDaysRemaining: number;
    recommendedAction: string;
  };
}

export const MOCK_TELEMETRY_DATA: TelemetryEndpoint[] = [
  {
    deviceId: "PULSE-01",
    computerName: "DELL-LAT-DSI-04",
    assignedUser: "Arnaud Dossou (Chef Comptable)",
    department: "Finance",
    cpuTempCelsius: 82,
    cpuLoadPercent: 44,
    ramUsagePercent: 68,
    ssdHealthPercent: 28,
    ssdWearTbwRemaining: 12,
    batteryHealthPercent: 74,
    lastHeartbeat: "Il y a 12 sec",
    riskStatus: "critique",
    predictedFailure: {
      component: "SSD NVMe Kioxia 512 Go",
      estimatedDaysRemaining: 9,
      recommendedAction:
        "Remplacement préventif par SSD Samsung 980 Pro et clonage avant corruption.",
    },
  },
  {
    deviceId: "PULSE-02",
    computerName: "MACBOOK-AIR-M2-08",
    assignedUser: "Flora Houngbo (Directrice Marketing)",
    department: "Marketing",
    cpuTempCelsius: 48,
    cpuLoadPercent: 18,
    ramUsagePercent: 52,
    ssdHealthPercent: 96,
    ssdWearTbwRemaining: 240,
    batteryHealthPercent: 91,
    lastHeartbeat: "Il y a 5 sec",
    riskStatus: "nominal",
  },
  {
    deviceId: "PULSE-03",
    computerName: "THINKPAD-T14-ENG-02",
    assignedUser: "Rodrigue Tossou (Développeur Lead)",
    department: "R&D",
    cpuTempCelsius: 89,
    cpuLoadPercent: 78,
    ramUsagePercent: 88,
    ssdHealthPercent: 82,
    ssdWearTbwRemaining: 180,
    batteryHealthPercent: 62,
    lastHeartbeat: "Il y a 28 sec",
    riskStatus: "avertissement",
    predictedFailure: {
      component: "Pâte Thermique CPU & Ventilateur Encrassé",
      estimatedDaysRemaining: 21,
      recommendedAction: "Planifier un dépoussiérage et repâtage Arctic MX-4 en visite préventive.",
    },
  },
];

export const getLiveTelemetryFleetFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<{
    endpoints: TelemetryEndpoint[];
    criticalCount: number;
    fleetHealthAverage: number;
  }> => {
    if (!(await rateLimit("get-live-telemetry-fleet", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    return {
      endpoints: MOCK_TELEMETRY_DATA,
      criticalCount: MOCK_TELEMETRY_DATA.filter((e) => e.riskStatus === "critique").length,
      fleetHealthAverage: 84,
    };
  },
);
