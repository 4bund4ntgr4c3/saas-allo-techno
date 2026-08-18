// Comptes et données de démonstration — visit tour commercial.
//
// `ensureDemoEnvironment()` est une fonction serveur idempotente : elle crée
// les 5 comptes démo (admin, staff, technicien, client, entreprise B2B) et
// les données d'exemple associées si elles n'existent pas encore. La page
// publique /demo l'appelle au chargement afin que les prospects puissent
// essayer chaque espace en un clic.
//
// Les comptes sont clairement identifiables (email demo.*@allotechno.africa)
// et peuvent être supprimés en base sans impact sur les données réelles.

import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateTrackingCode, hashTrackingCode, rateLimit } from "@/lib/security";
import type { Database, Enums, TablesInsert } from "@/integrations/supabase/types";

export const DEMO_PASSWORD = process.env["DEMO_PASSWORD"] ?? "Demo@2026";

// Lever la démo (reset horaire) sur une instance où elle est désactivée n'est
// pas une erreur d'exécution : le job doit se terminer en no-op proprement.
export class DemoDisabledError extends Error {
  constructor() {
    super("L'environnement démo est désactivé sur cette instance.");
    this.name = "DemoDisabledError";
  }
}

// L'environnement de démonstration (comptes admin/staff à mot de passe connu)
// est réservé au développement local et aux déploiements qui l'activent
// explicitement (ENABLE_DEMO=true) HORS production. En production, le seed est
// désactivé quoi qu'il arrive : il créerait des comptes admin à mot de passe
// public sur la base réelle.
const DEMO_ENABLED =
  import.meta.env.DEV ||
  (process.env["ENV"] !== "production" && process.env["ENABLE_DEMO"] === "true");

export type DemoRole = "admin" | "staff" | "technicien" | "client" | "b2b";

export interface DemoAccountInfo {
  id: DemoRole;
  email: string;
  fullName: string;
  phone: string;
  role: "admin" | "staff" | "technicien" | "user" | "org_admin";
  landing: string;
}

export const DEMO_ACCOUNTS: DemoAccountInfo[] = [
  {
    id: "admin",
    email: "demo.admin@allotechno.africa",
    fullName: "Aïcha Diallo (Admin démo)",
    phone: "+229 01 23 45 67",
    role: "admin",
    landing: "/admin",
  },
  {
    id: "staff",
    email: "demo.staff@allotechno.africa",
    fullName: "Kévin Agbodjan (Staff démo)",
    phone: "+229 01 23 45 68",
    role: "staff",
    landing: "/admin/dossiers",
  },
  {
    id: "technicien",
    email: "demo.tech@allotechno.africa",
    fullName: "Jean-Marc Hounsou (Technicien démo)",
    phone: "+229 01 23 45 69",
    role: "technicien",
    landing: "/admin/dossiers",
  },
  {
    id: "client",
    email: "demo.client@allotechno.africa",
    fullName: "Mariam Kossi (Client démo)",
    phone: "+229 01 23 45 70",
    role: "user",
    landing: "/mon-compte",
  },
  {
    id: "b2b",
    email: "demo.b2b@allotechno.africa",
    fullName: "Serge Akpakpa (Entreprise démo)",
    phone: "+229 01 23 45 71",
    role: "org_admin",
    landing: "/app",
  },
];

const DEMO_ORG_NAME = "Allo Techno Démo";
const DEMO_ORG_SUFFIX = "-demo";

/** Premier créneau (date, période) libre pour un mode, dans les 90 prochains jours. */
async function findFreeSlot(
  supabaseAdmin: SupabaseClient<Database>,
  mode: string,
): Promise<{ slot_date: string; slot_period: Enums<"slot_period"> }> {
  const today = new Date();
  for (let day = 1; day <= 90; day++) {
    const from = new Date(today);
    from.setDate(from.getDate() + day);
    const to = new Date(from);
    const { data, error } = await supabaseAdmin.rpc("slot_availability", {
      _from: from.toISOString().slice(0, 10),
      _to: to.toISOString().slice(0, 10),
      _mode: mode,
    });
    if (error) throw error;
    const slots = (data ?? []) as {
      slot_date: string;
      period: Enums<"slot_period">;
      remaining: number;
    }[];
    for (const slot of slots) {
      if (slot.remaining > 0) {
        return { slot_date: slot.slot_date, slot_period: slot.period };
      }
    }
  }
  throw new Error("Aucun créneau libre sur les 90 prochains jours");
}

export interface DemoSeedResult {
  users: number;
  roles: number;
  org: boolean;
  equipment: number;
  tickets: number;
  dossiers: number;
  trackingReference?: string;
  trackingCode?: string;
}

export const ensureDemoEnvironment = createServerFn({ method: "GET" }).handler(
  async (): Promise<DemoSeedResult> => {
    if (!DEMO_ENABLED) {
      throw new Error("L'environnement de démonstration est désactivé sur ce déploiement.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("demo-seed", 5))) {
      throw new Error("Trop de requêtes. Réessayez dans une minute.");
    }

    const result: DemoSeedResult = {
      users: 0,
      roles: 0,
      org: false,
      equipment: 0,
      tickets: 0,
      dossiers: 0,
    };

    const userIds: Partial<Record<DemoRole, string>> = {};

    // 1. Comptes utilisateurs + rôles back-office.
    // NB: le endpoint GoTrue de ce projet renvoie 500 dès per_page > 5 — boucle page par page.
    const existingByEmail = new Map<string, string>();
    let page = 1;
    for (;;) {
      const { data } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 5 });
      for (const u of data?.users ?? []) {
        if (u.email) existingByEmail.set(u.email.toLowerCase(), u.id);
      }
      const pagination = data as { nextPage?: number | null } | null;
      const next = pagination?.nextPage ?? null;
      if (next === null) break;
      page = next;
    }
    for (const account of DEMO_ACCOUNTS) {
      let userId = existingByEmail.get(account.email.toLowerCase());
      if (!userId) {
        const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
          email: account.email,
          password: DEMO_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: account.fullName, phone: account.phone },
        });
        if (error) throw error;
        userId = created.user.id;
        result.users += 1;
      }
      userIds[account.id] = userId;

      if (account.role === "admin" || account.role === "staff" || account.role === "technicien") {
        const { data: has } = await supabaseAdmin
          .from("user_roles")
          .select("user_id")
          .eq("user_id", userId)
          .eq("role", account.role as Enums<"app_role">)
          .maybeSingle();
        if (!has) {
          const { error } = await supabaseAdmin.from("user_roles").insert({
            user_id: userId,
            role: account.role as Enums<"app_role">,
          });
          if (error) throw error;
          result.roles += 1;
        }
      }
    }

    // 2. Organisation B2B + membre admin + parc + tickets.
    const b2bUserId = userIds["b2b"]!;
    const { data: existingOrg } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .eq("name", DEMO_ORG_NAME)
      .maybeSingle();
    let orgId = existingOrg?.id ?? null;
    if (!orgId) {
      const { data: org, error } = await supabaseAdmin
        .from("organizations")
        .insert({
          name: DEMO_ORG_NAME,
          trade_name: "Allo Techno Démo",
          registration_number: `DEMO-${DEMO_ORG_SUFFIX}`,
          address: "Rue des Entreprises, Cotonou",
          country: "Bénin",
          phone: "+229 01 23 45 71",
          email: "demo.b2b@allotechno.africa",
          sector: "Services",
          status: "active",
        })
        .select("id")
        .single();
      if (error) throw error;
      orgId = org.id;
      result.org = true;
    }

    const { data: member } = await supabaseAdmin
      .from("organization_members")
      .select("id")
      .eq("organization_id", orgId)
      .eq("user_id", b2bUserId)
      .maybeSingle();
    if (!member) {
      const { error } = await supabaseAdmin.from("organization_members").insert({
        organization_id: orgId,
        user_id: b2bUserId,
        role: "admin_org",
      });
      if (error) throw error;
    }

    const { count: equipmentCount } = await supabaseAdmin
      .from("equipment")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId);
    if ((equipmentCount ?? 0) === 0) {
      const demoEquipment: TablesInsert<"equipment">[] = [
        {
          org_id: orgId,
          asset_tag: "DEMO-IMP-001",
          name: "Imprimante laser HP",
          type: "impression",
          brand: "HP",
          model: "LaserJet Pro M404",
          serial_number: "SN-DEMO-001",
          status: "actif",
          purchase_date: "2025-01-15",
          assigned_to: "Comptabilité",
          location: "Bureau 12",
          notes: "Équipement de démonstration",
        },
        {
          org_id: orgId,
          asset_tag: "DEMO-PC-001",
          name: "Poste informatique Dell",
          type: "informatique",
          brand: "Dell",
          model: "OptiPlex 7090",
          serial_number: "SN-DEMO-002",
          status: "en_panne",
          purchase_date: "2024-06-01",
          assigned_to: "Accueil",
          location: "Hall d'entrée",
          notes: "Écran noir signalé — en attente de diagnostic",
        },
        {
          org_id: orgId,
          asset_tag: "DEMO-CLIM-001",
          name: "Climatiseur Samsung",
          type: "climatisation",
          brand: "Samsung",
          model: "WindFree 12000 BTU",
          serial_number: "SN-DEMO-003",
          status: "maintenance",
          purchase_date: "2023-11-20",
          assigned_to: "Salle de réunion",
          location: "Étage 2",
          notes: "Entretien semestriel prévu",
        },
      ];
      const { error } = await supabaseAdmin.from("equipment").insert(demoEquipment);
      if (error) throw error;
      result.equipment = demoEquipment.length;
    }

    const { count: ticketsCount } = await supabaseAdmin
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId);
    if ((ticketsCount ?? 0) === 0) {
      const { data: equipments } = await supabaseAdmin
        .from("equipment")
        .select("id, name")
        .eq("org_id", orgId)
        .limit(3);
      const slot = await findFreeSlot(supabaseAdmin, "boutique");
      const tickets: TablesInsert<"reservations">[] = [
        {
          org_id: orgId,
          user_id: b2bUserId,
          equipment_id: equipments?.[0]?.id ?? null,
          customer_name: "Allo Techno Démo — Comptabilité",
          phone: "+229 01 23 45 71",
          email: "demo.b2b@allotechno.africa",
          device: equipments?.[0]?.name ?? "Imprimante laser HP",
          issue: "Bourrage papier répété et bruit anormal à l'impression",
          ticket_type: "panne",
          priority: "haute",
          location: "Bureau 12",
          mode: "boutique",
          payment: "mtn",
          slot_date: slot.slot_date,
          slot_period: slot.slot_period,
          status: "en_attente",
          source: "demo",
        },
        {
          org_id: orgId,
          user_id: b2bUserId,
          equipment_id: equipments?.[2]?.id ?? null,
          customer_name: "Allo Techno Démo — Direction",
          phone: "+229 01 23 45 71",
          email: "demo.b2b@allotechno.africa",
          device: equipments?.[2]?.name ?? "Climatiseur Samsung",
          issue: "Maintenance préventive : nettoyage des filtres et recharge de gaz",
          ticket_type: "maintenance",
          priority: "normale",
          location: "Étage 2",
          mode: "boutique",
          payment: "mtn",
          slot_date: slot.slot_date,
          slot_period: slot.slot_period,
          status: "en_attente",
          source: "demo",
        },
      ];
      const { error } = await supabaseAdmin.from("reservations").insert(tickets);
      if (error) throw error;
      result.tickets = tickets.length;
    }

    // 3. Réservation client avec code de suivi (affiche sur la page /demo).
    const clientUserId = userIds["client"]!;
    const { data: clientReservation } = await supabaseAdmin
      .from("reservations")
      .select("id, reference, tracking_code_hash")
      .eq("user_id", clientUserId)
      .eq("source", "demo")
      .maybeSingle();
    if (clientReservation) {
      const trackingCode = generateTrackingCode();
      const trackingCodeHash = await hashTrackingCode(trackingCode);
      const { error } = await supabaseAdmin
        .from("reservations")
        .update({ tracking_code_hash: trackingCodeHash })
        .eq("id", clientReservation.id);
      if (error) throw error;
      result.trackingReference = clientReservation.reference;
      result.trackingCode = trackingCode;
    } else {
      const trackingCode = generateTrackingCode();
      const trackingCodeHash = await hashTrackingCode(trackingCode);
      const slot = await findFreeSlot(supabaseAdmin, "boutique");
      const { data: row, error } = await supabaseAdmin
        .from("reservations")
        .insert({
          user_id: clientUserId,
          customer_name: "Mariam Kossi (Client démo)",
          phone: "+229 01 23 45 70",
          email: "demo.client@allotechno.africa",
          device: "iPhone 13",
          issue: "Écran fissuré, tactile partiellement inopérant",
          mode: "boutique",
          payment: "especes",
          slot_date: slot.slot_date,
          slot_period: slot.slot_period,
          status: "en_attente",
          tracking_code_hash: trackingCodeHash,
          source: "demo",
        } as TablesInsert<"reservations">)
        .select("reference")
        .single();
      if (error) throw error;
      result.trackingReference = row.reference;
      result.trackingCode = trackingCode;
    }

    // 4. Dossiers de démonstration pour staff / technicien (vue liste + kanban).
    const techUserId = userIds["technicien"]!;
    const { count: demoDossiers } = await supabaseAdmin
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", techUserId)
      .eq("source", "demo");
    if ((demoDossiers ?? 0) === 0) {
      const slotA = await findFreeSlot(supabaseAdmin, "boutique");
      const slotB = await findFreeSlot(supabaseAdmin, "domicile");
      const slotC = await findFreeSlot(supabaseAdmin, "boutique");
      const dossiers: TablesInsert<"reservations">[] = [
        {
          user_id: techUserId,
          customer_name: "Dossier démo — M. Agbodjan",
          phone: "+229 01 23 45 68",
          email: "demo.staff@allotechno.africa",
          device: "Xiaomi Redmi Note 12",
          issue: "Batterie qui gonfle, chauffe anormale",
          mode: "boutique",
          payment: "mtn",
          slot_date: slotA.slot_date,
          slot_period: slotA.slot_period,
          status: "en_cours",
          assigned_technician_id: techUserId,
          source: "demo",
        },
        {
          user_id: techUserId,
          customer_name: "Dossier démo — Mme Dossou",
          phone: "+229 01 23 45 67",
          device: "HP Pavilion 15",
          issue: "Ventilateur bruyant, écran qui scintille",
          mode: "domicile",
          payment: "especes",
          slot_date: slotB.slot_date,
          slot_period: slotB.slot_period,
          status: "pieces",
          assigned_technician_id: techUserId,
          source: "demo",
        },
        {
          user_id: techUserId,
          customer_name: "Dossier démo — Soc. Imane",
          phone: "+229 01 23 45 71",
          device: 'Écran PC Samsung 24"',
          issue: "Sous garantie — mise à jour du firmware",
          mode: "boutique",
          payment: "celtiis",
          slot_date: slotC.slot_date,
          slot_period: slotC.slot_period,
          status: "pret",
          assigned_technician_id: techUserId,
          source: "demo",
        },
      ];
      const { error } = await supabaseAdmin.from("reservations").insert(dossiers);
      if (error) throw error;
      result.dossiers = dossiers.length;
    }

    return result;
  },
);

/**
 * Réinitialisation complète et forcée de l'environnement de démonstration.
 * 1. Purge toutes les réservations, tickets, pièces jointes démo existants.
 * 2. Purge et recrée le parc matériel et l'organisation B2B démo.
 * 3. Ré-injecte un jeu de données de test complet et à jour.
 *
 * Cette fonction est appelée automatiquement par le Cron horaire (/api/cron-demo-reset)
 * et peut être invoquée manuellement depuis la page /demo.
 */
export async function resetAndSeedDemoEnvironment(): Promise<{
  purgedReservations: number;
  purgedEquipment: number;
  seededResult: DemoSeedResult;
  timestamp: string;
}> {
  if (!DEMO_ENABLED) {
    throw new DemoDisabledError();
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // 1. Purge des réservations et tickets marqués 'demo'
  const { data: purgedRes, error: errRes } = await supabaseAdmin
    .from("reservations")
    .delete()
    .eq("source", "demo")
    .select("id");
  if (errRes) console.warn("[demo-reset] warning purging reservations:", errRes);

  // 2. Trouver l'organisation démo
  const { data: demoOrg } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("name", DEMO_ORG_NAME)
    .maybeSingle();

  let purgedEqCount = 0;
  if (demoOrg) {
    // Purge de l'historique et des équipements démo
    const { data: purgedEq } = await supabaseAdmin
      .from("equipment")
      .delete()
      .eq("org_id", demoOrg.id)
      .select("id");
    purgedEqCount = purgedEq?.length ?? 0;
  }

  // 3. Ré-exécuter le seed pour reconstruire un environnement frais
  const seedResult = await ensureDemoEnvironment();

  return {
    purgedReservations: purgedRes?.length ?? 0,
    purgedEquipment: purgedEqCount,
    seededResult: seedResult,
    timestamp: new Date().toISOString(),
  };
}

export const resetDemoEnvironmentFn = createServerFn({ method: "POST" }).handler(async () => {
  if (!(await rateLimit("reset-demo-environment", 20))) {
    throw new Error("Trop de demandes. Réessayez dans une minute.");
  }
  return await resetAndSeedDemoEnvironment();
});
