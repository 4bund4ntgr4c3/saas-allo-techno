// ============================================================================
// Allô Techno — Service de Prêt d'Ordinateurs de Courtoisie & Secours
// Flotte de PC/Mac portables de remplacement pour continuité d'activité.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rateLimit } from "@/lib/security";

export interface CourtesyDevice {
  id: string;
  brand: "Apple" | "Dell" | "Lenovo" | "HP";
  model: string;
  specs: string;
  os: "macOS Sonoma" | "Windows 11 Pro" | "Ubuntu Linux";
  dailyRateFcfa: number;
  depositFcfa: number;
  isAvailable: boolean;
}

export const COURTESY_FLEET: CourtesyDevice[] = [
  {
    id: "cd-01",
    brand: "Apple",
    model: "MacBook Air 13 (Apple Silicon M1)",
    specs: "8-Core CPU / 16 Go RAM / 512 Go SSD",
    os: "macOS Sonoma",
    dailyRateFcfa: 3500,
    depositFcfa: 50000,
    isAvailable: true,
  },
  {
    id: "cd-02",
    brand: "Dell",
    model: "Dell Latitude 5420 Pro",
    specs: "Intel Core i7 11th Gen / 16 Go RAM / 512 Go SSD",
    os: "Windows 11 Pro",
    dailyRateFcfa: 2500,
    depositFcfa: 35000,
    isAvailable: true,
  },
  {
    id: "cd-03",
    brand: "Lenovo",
    model: "ThinkPad T14s Gen 2",
    specs: "AMD Ryzen 7 PRO / 16 Go RAM / 512 Go SSD",
    os: "Windows 11 Pro",
    dailyRateFcfa: 2500,
    depositFcfa: 35000,
    isAvailable: false,
  },
  {
    id: "cd-04",
    brand: "HP",
    model: "HP EliteBook 840 G8",
    specs: "Intel Core i5 / 8 Go RAM / 256 Go SSD",
    os: "Windows 11 Pro",
    dailyRateFcfa: 2000,
    depositFcfa: 25000,
    isAvailable: true,
  },
];

export const getAvailableCourtesyDevicesFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<{
    devices: CourtesyDevice[];
  }> => {
    if (!(await rateLimit("get-available-courtesy-devices", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    return {
      devices: COURTESY_FLEET,
    };
  },
);

export const bookCourtesyDeviceFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      deviceId: z.string().min(1),
      repairTicketRef: z.string().min(3),
      customerPhone: z.string().min(8),
      estimatedDays: z.number().min(1).max(30),
    }),
  )
  .handler(
    async ({
      data: input,
    }): Promise<{ success: boolean; loanContractRef: string; message: string }> => {
      if (!(await rateLimit("book-courtesy-device", 20))) {
        throw new Error("Trop de demandes. Réessayez dans une minute.");
      }
      const loanRef = `LOAN-${Date.now().toString().slice(-6)}`;
      return {
        success: true,
        loanContractRef: loanRef,
        message: `Votre ordinateur de secours a été réservé pour le dossier ${input.repairTicketRef} (Contrat N° ${loanRef}). Vous pouvez le retirer immédiatement à l'atelier lors du dépôt de votre appareil en panne.`,
      };
    },
  );
