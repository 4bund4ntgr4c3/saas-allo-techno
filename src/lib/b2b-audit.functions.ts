import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireStaff } from "@/lib/rbac";

export type AuditLogEntry = {
  id: string;
  timestamp: string;
  actorName: string;
  actorEmail: string;
  action: string;
  category: "equipment" | "role" | "billing" | "security" | "ticket";
  details: string;
  ipAddress: string;
};

export const getB2bAuditLogsFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orgId: z.string(),
    }),
  )
  .handler(async (): Promise<AuditLogEntry[]> => {
    await requireStaff(supabaseAdmin);
    return [
      {
        id: "audit-001",
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        actorName: "Jean Dupont",
        actorEmail: "j.dupont@oragroup.com",
        action: "Exportation Journal SYSCOHADA",
        category: "billing",
        details: "Génération du fichier CSV comptable TVA 18%",
        ipAddress: "197.234.221.14",
      },
      {
        id: "audit-002",
        timestamp: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
        actorName: "Marc Kpanou",
        actorEmail: "m.kpanou@oragroup.com",
        action: "Importation Massive de Parc",
        category: "equipment",
        details: "Ajout de 15 nouveaux équipements via fichier Excel",
        ipAddress: "41.85.162.90",
      },
      {
        id: "audit-003",
        timestamp: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
        actorName: "Pascal Dossou",
        actorEmail: "p.dossou@oragroup.com",
        action: "Changement de Rôle Collaborateur",
        category: "role",
        details: "Attribution du rôle responsable_maintenance à Amina Soglo",
        ipAddress: "197.234.221.14",
      },
    ];
  });
