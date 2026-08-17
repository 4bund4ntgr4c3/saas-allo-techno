// ============================================================================
// Allô Techno — Réservation d'Intervention VIP sur Site & à Domicile
// Dépannage informatique mobile avec mallette d'intervention à Cotonou/Calavi.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface HomeRepairBooking {
  bookingId: string;
  customerName: string;
  phone: string;
  zone: "Cotonou Centre" | "Akpakpa / PK10" | "Haie Vive / Les Cocotiers" | "Abomey-Calavi" | "Porto-Novo";
  addressDetails: string;
  issueType: "ecran_ssd" | "panne_logicielle" | "reseau_wifi" | "maintenance_complete";
  preferredDate: string;
  preferredTimeSlot: "Matin (08h - 12h)" | "Après-midi (14h - 18h)" | "Urgence Express (1h)";
  servicePriceFcfa: number;
}

export const bookHomeRepairFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      customerName: z.string().min(2),
      phone: z.string().min(8),
      zone: z.string(),
      addressDetails: z.string().min(5),
      issueType: z.string(),
      preferredDate: z.string(),
      preferredTimeSlot: z.string(),
    }),
  )
  .handler(async ({ data: input }): Promise<{ success: boolean; bookingId: string; message: string }> => {
    const bookingId = `VIP-HOME-${Date.now().toString().slice(-6)}`;
    return {
      success: true,
      bookingId,
      message: `Votre demande d'intervention sur site N° ${bookingId} pour ${input.customerName} (${input.zone}) a été confirmée. Un technicien d'astreinte vous contactera sous 15 minutes.`,
    };
  });
