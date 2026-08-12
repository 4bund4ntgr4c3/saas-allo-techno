import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rateLimit } from "@/lib/security";

const leadSchema = z.object({
  source: z.enum(["devis", "contact", "suivi"]),
  sourceDetail: z.string().trim().max(80).optional().or(z.literal("")),
  name: z.string().trim().min(1, "Votre nom est requis").max(120),
  phone: z
    .string()
    .trim()
    .min(8, "Numéro de téléphone invalide")
    .max(25)
    .optional()
    .or(z.literal("")),
  email: z.string().trim().email("E-mail invalide").max(180).optional().or(z.literal("")),
  reference: z.string().trim().max(30).optional().or(z.literal("")),
  message: z.string().trim().min(3, "Décrivez votre demande").max(2000),
  // Honeypot anti-spam : invisible pour les humains, rempli par les bots.
  website: z.string().trim().max(120).optional().or(z.literal("")),
});

/** Enregistre un lead (devis / contact / assistance suivi) et alerte l'équipe. */
export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => leadSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Honeypot rempli : bot détecté, on répond « succès » sans rien enregistrer.
    if (data.website) {
      return true;
    }

    if (!(await rateLimit("lead-submit", 3))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const reference = data.reference || null;
    const { error } = await supabaseAdmin.from("leads").insert({
      source: data.source,
      source_detail: data.sourceDetail || null,
      reference,
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      message: data.message,
      status: "nouveau",
    });

    if (error) {
      console.error("[leads] insert failed", error);
      throw new Error("Le message n'a pas pu être enregistré. Réessayez.");
    }

    const { notifyStaffNewLead } = await import("@/lib/notifications");
    void notifyStaffNewLead({
      source: data.source,
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      message: data.message,
    });

    return true;
  });

const b2bLeadSchema = z.object({
  companyName: z.string().trim().min(1, "Le nom de l'entreprise est requis").max(120),
  contactName: z.string().trim().min(1, "Le nom du contact est requis").max(120),
  phone: z.string().trim().min(8, "Numéro de téléphone invalide").max(25),
  email: z.string().trim().email("E-mail invalide").max(180).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  needType: z.string().trim().max(50),
  slaFormula: z.string().trim().max(50),
  fleetSize: z.string().trim().max(50),
  equipmentTypes: z.array(z.string()).optional(),
  urgency: z.string().trim().max(50),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  reference: z.string().trim().max(30),
});

export interface SubmitB2BLeadResult {
  success: boolean;
  leadRef: string;
  accountCreated: boolean;
  email: string;
  tempPassword: string | null;
  existingAccount: boolean;
}

/** Enregistre une demande B2B et crée automatiquement un compte client s'il n'existe pas. */
export const submitB2BLead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => b2bLeadSchema.parse(data))
  .handler(async ({ data }): Promise<SubmitB2BLeadResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("b2b-lead-submit", 5))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const reference = data.reference;
    const clientEmail =
      data.email && data.email.trim()
        ? data.email.trim()
        : `b2b.${data.phone.replace(/\D/g, "")}@allotechno.africa`;

    const fullName = `${data.companyName} (${data.contactName})`;
    const message = `Demande B2B: ${data.needType} | Formule: ${data.slaFormula} | Parc: ${data.fleetSize} | Urgence: ${data.urgency} | Équipements: ${data.equipmentTypes?.join(", ") || "Non spécifié"} | Ville: ${data.city || "Non spécifiée"} | Notes: ${data.notes || "Aucune"}`;

    // 1. Enregistrement du lead
    const { error: leadErr } = await supabaseAdmin.from("leads").insert({
      source: "devis",
      source_detail: `b2b_${data.needType}_${data.slaFormula}`,
      reference,
      name: fullName,
      phone: data.phone,
      email: clientEmail,
      message,
      status: "nouveau",
    });

    if (leadErr) {
      console.error("[leads] b2b insert failed", leadErr);
    }

    // 2. Notification de l'équipe
    const { notifyStaffNewLead } = await import("@/lib/notifications");
    void notifyStaffNewLead({
      source: "devis",
      name: fullName,
      phone: data.phone,
      email: clientEmail,
      message,
    });

    // 3. Création automatique du compte client B2B dans Supabase Auth
    let accountCreated = false;
    let existingAccount = false;
    const tempPassword = `B2B-${reference}-Pass!`;

    try {
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: clientEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          company_name: data.companyName,
          contact_name: data.contactName,
          phone: data.phone,
          account_type: "b2b",
        },
      });

      if (createErr) {
        if (createErr.message?.toLowerCase().includes("already") || createErr.status === 422) {
          existingAccount = true;
        } else {
          console.warn("[b2b auth] automatic account creation warning:", createErr.message);
        }
      } else if (newUser?.user) {
        accountCreated = true;
      }
    } catch (authErr) {
      console.warn("[b2b auth] account creation catch:", authErr);
    }

    return {
      success: true,
      leadRef: reference,
      accountCreated,
      email: clientEmail,
      tempPassword: accountCreated ? tempPassword : null,
      existingAccount,
    };
  });
