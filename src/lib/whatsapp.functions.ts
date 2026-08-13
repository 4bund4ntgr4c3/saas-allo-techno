import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireStaff } from "@/lib/rbac";

export type WhatsAppAlertInput = {
  phoneNumber: string; // e.g. "+22990000000"
  recipientName: string;
  ticketNumber: string;
  equipmentName: string;
  status: "received" | "diagnostic_ready" | "repaired" | "delivered";
  customMessage?: string;
};

export const sendWhatsAppTicketNotificationFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      phoneNumber: z.string(),
      recipientName: z.string(),
      ticketNumber: z.string(),
      equipmentName: z.string(),
      status: z.enum(["received", "diagnostic_ready", "repaired", "delivered"]),
      customMessage: z.string().optional(),
    }),
  )
  .handler(
    async ({ data }): Promise<{ success: boolean; whatsappUrl: string; messageText: string }> => {
      await requireStaff(supabaseAdmin);
      let statusText = "pris en charge par notre équipe d'experts à l'atelier Allô Techno.";
      if (data.status === "diagnostic_ready") {
        statusText =
          "diagnostiqué. Le rapport technique et le devis sont disponibles sur votre espace B2B.";
      } else if (data.status === "repaired") {
        statusText =
          "entièrement réparé et testé sur notre banc d'essai. Il est prêt à être récupéré !";
      } else if (data.status === "delivered") {
        statusText = "livré avec succès sur votre site.";
      }

      const messageText =
        `👋 Bonjour ${data.recipientName},\n\n` +
        `📌 *Mise à jour Ticket Allô Techno B2B* (${data.ticketNumber})\n` +
        `💻 *Matériel* : ${data.equipmentName}\n\n` +
        `Votre équipement a été ${statusText}\n\n` +
        `🔗 Suivez votre dossier en direct sur votre portail B2B : https://allotechno.africa/app\n\n` +
        `*Allô Techno Service Client B2B* — +229 21 31 00 00`;

      const cleanPhone = data.phoneNumber.replace(/[^\d+]/g, "");
      const whatsappUrl = `https://wa.me/${cleanPhone.replace("+", "")}?text=${encodeURIComponent(messageText)}`;

      return {
        success: true,
        whatsappUrl,
        messageText,
      };
    },
  );
