import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type WhatsAppMessagePayload = {
  phone: string;
  templateName: "repair_status_update" | "quote_ready" | "repair_ready" | "guarantee_issued";
  parameters: Record<string, string>;
};

const notificationSchema = z.object({
  phone: z.string().min(8),
  templateName: z.enum(["repair_status_update", "quote_ready", "repair_ready", "guarantee_issued"]),
  clientName: z.string(),
  dossierRef: z.string(),
  extraMessage: z.string().optional(),
});

export const sendWhatsAppNotificationFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => notificationSchema.parse(data))
  .handler(async ({ data }) => {
    const { phone, templateName, clientName, dossierRef, extraMessage } = data;

    // Clean phone number format for Benin/international (+229)
    let cleanPhone = phone.replace(/\s+/g, "").replace(/-/g, "");
    if (!cleanPhone.startsWith("+") && !cleanPhone.startsWith("229")) {
      cleanPhone = `+229${cleanPhone}`;
    }

    // Format WhatsApp direct click URL for web fallback & admin trigger
    let messageText = "";
    if (templateName === "repair_status_update") {
      messageText = `Bonjour ${clientName}, votre dossier Allô Techno ${dossierRef} a évolué. ${extraMessage || "Consultez l'avancement sur notre site."}`;
    } else if (templateName === "quote_ready") {
      messageText = `Bonjour ${clientName}, le devis pour votre dossier ${dossierRef} est disponible. Répondez pour valider l'intervention.`;
    } else if (templateName === "repair_ready") {
      messageText = `Bonjour ${clientName}, votre appareil (Dossier ${dossierRef}) est réparé et prêt à être retiré en boutique Allô Techno !`;
    } else if (templateName === "guarantee_issued") {
      messageText = `Bonjour ${clientName}, votre certificat de garantie pour le dossier ${dossierRef} a été émis avec succès.`;
    }

    const encodedText = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/${cleanPhone.replace("+", "")}?text=${encodedText}`;

    return {
      success: true,
      phone: cleanPhone,
      whatsappUrl,
      messageText,
    };
  });
