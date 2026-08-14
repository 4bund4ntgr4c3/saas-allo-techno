import { z } from "zod";

/**
 * Schémas de validation Zod stricts pour les opérations B2B Multi-Tenant.
 * Garantit la sécurité et la conformité des données transmises aux fonctions serveur et RPC.
 */

// ─── Organisations ───
export const organizationInputSchema = z.object({
  name: z.string().trim().min(2, "Le nom de l'organisation est requis").max(120),
  trade_name: z.string().trim().max(120).nullable().optional(),
  registration_number: z.string().trim().max(60).nullable().optional(),
  address: z.string().trim().max(255).nullable().optional(),
  country: z.string().trim().max(60).default("Bénin"),
  phone: z.string().trim().max(30).nullable().optional(),
  email: z.string().trim().email("Email invalide").max(120).nullable().optional().or(z.literal("")),
  sector: z.string().trim().max(80).nullable().optional(),
  size: z.string().trim().max(50).nullable().optional(),
  site_count: z.number().int().min(1).nullable().optional(),
  equipment_count: z.number().int().min(1).nullable().optional(),
});

export type ValidatedOrganizationInput = z.infer<typeof organizationInputSchema>;

// ─── Membres & Rôles ───
export const orgRoleEnum = z.enum([
  "admin_org",
  "responsable_maintenance",
  "responsable_site",
  "comptabilite",
  "lecture_seule",
  "membre",
]);

export const inviteMemberSchema = z.object({
  org_id: z.string().uuid("ID organisation invalide"),
  email: z.string().trim().email("Adresse email invalide"),
  role: orgRoleEnum.default("membre"),
});

export type ValidatedInviteMemberInput = z.infer<typeof inviteMemberSchema>;

// ─── Équipements ───
export const equipmentTypeEnum = z.enum([
  "ordinateur",
  "ecran",
  "imprimante",
  "serveur",
  "smartphone",
  "tablette",
  "reseau",
  "autre",
]);

export const equipmentStatusEnum = z.enum([
  "actif",
  "en_panne",
  "en_maintenance",
  "sous_garantie",
  "retire",
]);

export const equipmentInputSchema = z.object({
  org_id: z.string().uuid("ID organisation invalide"),
  name: z.string().trim().min(2, "Nom de l'équipement requis").max(100),
  type: equipmentTypeEnum.default("ordinateur"),
  brand: z.string().trim().max(60).nullable().optional(),
  model: z.string().trim().max(80).nullable().optional(),
  serial_number: z.string().trim().max(100).nullable().optional(),
  asset_tag: z.string().trim().max(60).nullable().optional(),
  site_id: z.string().uuid().nullable().optional(),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date d'achat invalide").nullable().optional().or(z.literal("")),
  assigned_to: z.string().trim().max(100).nullable().optional(),
  location: z.string().trim().max(120).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export type ValidatedEquipmentInput = z.infer<typeof equipmentInputSchema>;

// ─── Sites & Implantations ───
export const siteInputSchema = z.object({
  org_id: z.string().uuid("ID organisation invalide"),
  name: z.string().trim().min(2, "Nom du site requis").max(100),
  address: z.string().trim().max(255).nullable().optional(),
  city: z.string().trim().min(2).max(80).default("Cotonou"),
  phone: z.string().trim().max(30).nullable().optional().or(z.literal("")),
  manager: z.string().trim().max(100).nullable().optional(),
  departments: z.array(z.string().trim().min(1).max(50)).default([]),
});

export type ValidatedSiteInput = z.infer<typeof siteInputSchema>;

// ─── Maintenance ───
export const maintenanceScheduleInputSchema = z.object({
  org_id: z.string().uuid("ID organisation invalide"),
  equipment_id: z.string().uuid("ID équipement invalide"),
  task_title: z.string().trim().min(3, "Titre de tâche requis").max(200),
  interval_months: z.number().int().min(1).max(60).default(3),
  next_due_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date d'échéance invalide"),
});

export type ValidatedMaintenanceScheduleInput = z.infer<typeof maintenanceScheduleInputSchema>;
