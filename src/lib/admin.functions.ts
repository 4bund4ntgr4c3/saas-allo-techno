import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import type { Enums } from "@/integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { rateLimit } from "@/lib/security";
import { computeSlaForecast, type SlaForecast, type TimelineEntry } from "@/lib/suivi.functions";

const setStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "en_attente",
    "confirmee",
    "pieces",
    "en_cours",
    "pret",
    "livre",
    "terminee",
    "annulee",
  ]),
  note: z.string().trim().max(500).optional(),
});

const OTP_WINDOW_MS = 24 * 3600 * 1000;

async function currentUserId(supabaseAdmin: SupabaseClient<Database>): Promise<string> {
  const authHeader = getRequestHeader("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  let userId: string | null = null;
  if (token) {
    const { data: claimsData } = await supabaseAdmin.auth.getClaims(token);
    const sub = claimsData?.claims?.sub;
    userId = typeof sub === "string" ? sub : null;
  }
  if (!userId) throw new Error("Non authentifié");
  return userId;
}

/**
 * Vérifie la double authentification serveur : si l'utilisateur a activé un
 * TOTP, il doit l'avoir confirmé il y a moins de 24 h. Empêche un JWT volé de
 * contourner la 2FA côté client.
 */
async function requireFreshOtp(supabaseAdmin: SupabaseClient<Database>, userId: string) {
  const { data: otp } = await supabaseAdmin
    .from("admin_otp")
    .select("enabled, verified_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (!otp?.enabled) return;
  const verifiedAt = otp.verified_at ? new Date(otp.verified_at).getTime() : 0;
  if (Date.now() - verifiedAt > OTP_WINDOW_MS) {
    throw new Error("Sécurité : confirmez votre code d'authentification pour continuer.");
  }
}

/**
 * Changement de statut d'un dossier par le personnel : délègue au RPC
 * PostgreSQL (historique + contrôles), puis notifie le client (e-mail +
 * WhatsApp). L'appelant doit être membre du staff — vérifié côté serveur.
 */
export const setReservationStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => setStatusSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("admin-status", 30))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const userId = await currentUserId(supabaseAdmin);
    await requireFreshOtp(supabaseAdmin, userId);

    const { data: staff, error: staffError } = await supabaseAdmin.rpc("is_staff", {
      _user_id: userId,
    });
    if (staffError || !staff) {
      const { data: isTech, error: techError } = await supabaseAdmin.rpc("has_role", {
        _user_id: userId,
        _role: "technicien",
      });
      if (techError || !isTech) throw new Error("Action non autorisée sur ce dossier");
      const { error: techRpcError } = await supabaseAdmin.rpc("technician_set_reservation_status", {
        _reservation_id: data.id,
        _status: data.status,
        ...(data.note ? { _note: data.note } : {}),
      });
      if (techRpcError) {
        console.error("[admin] technician set status failed", techRpcError);
        throw new Error(techRpcError.message);
      }
    } else {
      const { error } = await supabaseAdmin.rpc("staff_set_reservation_status", {
        _reservation_id: data.id,
        _status: data.status,
        ...(data.note ? { _note: data.note } : {}),
      });
      if (error) {
        console.error("[admin] set status failed", error);
        throw new Error(error.message);
      }
    }

    const { data: row } = await supabaseAdmin
      .from("reservations")
      .select(
        "reference, user_id, customer_name, email, phone, device, issue, mode, payment, slot_date, slot_period, slot_hour, status",
      )
      .eq("id", data.id)
      .maybeSingle();

    if (row) {
      const { notifyReservationStatusChanged } = await import("@/lib/notifications");
      void notifyReservationStatusChanged(row);
    }

    if (data.status === "terminee" && row?.user_id) {
      try {
        await supabaseAdmin.rpc("add_loyalty_points", {
          _user_id: row.user_id,
          _delta: 100,
          _reason: "repair_completed",
          _reference: row.reference,
        });
      } catch (err) {
        console.error("[loyalty] crédit réparation terminée échoué", err);
      }

      try {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("referred_by")
          .eq("id", row.user_id)
          .maybeSingle();
        if (profile?.referred_by && profile.referred_by !== row.user_id) {
          await supabaseAdmin.rpc("add_loyalty_points", {
            _user_id: profile.referred_by,
            _delta: 100,
            _reason: "referral",
            _reference: row.reference,
          });
        }
      } catch (err) {
        console.error("[loyalty] crédit parrain échoué", err);
      }
    }

    return true;
  });

export type SetStatusInput = z.infer<typeof setStatusSchema>;
export type SetStatusResult = boolean;
export type Status = Enums<"reservation_status">;

const getReservationQuoteSchema = z.object({
  reservationId: z.string().uuid(),
});

export type ReservationQuote = {
  reference: string;
  quote_amount: number | null;
  quote_status: string;
  quote_decided_at: string | null;
  quote_token: string | null;
  warranty_months: number;
};

/**
 * Lecture du devis d'un dossier par le personnel (montant, statut, garantie).
 * Permet au panneau devis de l'admin d'afficher et de rafraîchir l'état.
 */
export const getReservationQuote = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => getReservationQuoteSchema.parse(data))
  .handler(async ({ data }): Promise<ReservationQuote | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("admin-quote", 30))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const userId = await currentUserId(supabaseAdmin);
    const { data: staff, error: staffError } = await supabaseAdmin.rpc("is_staff", {
      _user_id: userId,
    });
    if (staffError || !staff) throw new Error("Action non autorisée sur ce dossier");

    const { data: row, error } = await supabaseAdmin
      .from("reservations")
      .select(
        "reference, quote_amount, quote_status, quote_decided_at, quote_token, warranty_months",
      )
      .eq("id", data.reservationId)
      .maybeSingle();

    if (error) {
      console.error("[admin] get reservation quote failed", error);
      throw new Error("Impossible de lire le devis de ce dossier.");
    }
    if (!row) return null;

    return row;
  });

// ===========================================================================
// Atelier — tableau kanban des dossiers actifs + indicateurs avancés (KPI)
// ===========================================================================

/** Statuts affichés sur le board de l'atelier (terminee/annulee exclus). */
export const ATELIER_STATUSES = [
  "en_attente",
  "confirmee",
  "pieces",
  "en_cours",
  "pret",
  "livre",
] as const;

export type AtelierStatus = (typeof ATELIER_STATUSES)[number];

/** Carte du kanban atelier : dossier + SLA calculé côté serveur. */
export type AtelierCard = {
  id: string;
  reference: string;
  customer_name: string;
  phone: string;
  device: string;
  issue: string;
  slot_date: string;
  slot_hour: string | null;
  status: Enums<"reservation_status">;
  quote_status: string;
  quote_amount: number | null;
  payment_status: string;
  estimated_delivery: string | null;
  assigned_technician_id: string | null;
  created_at: string;
  sla: SlaForecast | null;
};

export type AtelierTechnician = { id: string; full_name: string | null };

export type AtelierBoardData = {
  reservations: AtelierCard[];
  technicians: AtelierTechnician[];
};

const boardSchema = z.object({});

/**
 * Board « atelier » : dossiers actifs (6 statuts du flux), techniciens
 * disponibles pour l'assignation, et SLA prédit par dossier (historique des
 * statuts + date de restitution estimée). Réservé au staff + 2FA récente.
 */
export const getAtelierBoard = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => boardSchema.parse(data))
  .handler(async (): Promise<AtelierBoardData> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("atelier-board", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const userId = await currentUserId(supabaseAdmin);
    await requireFreshOtp(supabaseAdmin, userId);
    const { data: staff } = await supabaseAdmin.rpc("is_staff", { _user_id: userId });
    if (!staff) throw new Error("Action non autorisée sur ce dossier");

    // assigned_technician_id n'est pas encore dans les types générés : le
    // résultat est casté vers AtelierCard.
    const { data: reservations, error: rError } = await supabaseAdmin
      .from("reservations")
      .select(
        "id, reference, customer_name, phone, device, issue, slot_date, slot_hour, status, quote_status, quote_amount, payment_status, estimated_delivery, created_at, assigned_technician_id",
      )
      .in("status", [...ATELIER_STATUSES])
      .order("slot_date", { ascending: true })
      .limit(500);

    if (rError) {
      console.error("[admin] atelier board failed", rError);
      throw new Error("Impossible de charger le tableau de l'atelier.");
    }
    const rows = (reservations as unknown as AtelierCard[] | null) ?? [];

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "technicien");
    const techIds = (roles ?? []).map((r) => r.user_id);
    let technicianProfiles: { id: string; full_name: string | null }[] = [];
    if (techIds.length > 0) {
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", techIds);
      technicianProfiles = data ?? [];
    }

    // Historique des statuts des dossiers affichés : sert au calcul du SLA.
    const ids = rows.map((r) => r.id);
    let historyRows: {
      reservation_id: string;
      old_status: Enums<"reservation_status"> | null;
      new_status: Enums<"reservation_status">;
      created_at: string;
    }[] = [];
    if (ids.length > 0) {
      const { data } = await supabaseAdmin
        .from("reservation_status_history")
        .select("reservation_id, old_status, new_status, created_at")
        .in("reservation_id", ids)
        .order("created_at", { ascending: true })
        .limit(5000);
      historyRows = (data ?? []) as typeof historyRows;
    }

    const historyByReservation = new Map<string, TimelineEntry[]>();
    for (const h of historyRows) {
      const list = historyByReservation.get(h.reservation_id) ?? [];
      list.push({
        old_status: h.old_status,
        new_status: h.new_status,
        note: null,
        created_at: h.created_at,
      });
      historyByReservation.set(h.reservation_id, list);
    }

    return {
      reservations: rows.map((r) => ({
        ...r,
        sla: computeSlaForecast(
          r.status,
          historyByReservation.get(r.id) ?? [],
          r.estimated_delivery,
        ),
      })),
      technicians: technicianProfiles.map((p) => ({ id: p.id, full_name: p.full_name })),
    };
  });

const assignTechnicianSchema = z.object({
  reservationId: z.string().uuid(),
  technicianId: z.string().uuid().or(z.literal("")).optional(),
});

/**
 * Assigne (ou retire) le technicien d'un dossier : écrit la colonne
 * assigned_technician_id de reservations. Staff ou technicien, 2FA vérifiée.
 */
export const assignTechnician = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assignTechnicianSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("atelier-assign", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const userId = await currentUserId(supabaseAdmin);
    await requireFreshOtp(supabaseAdmin, userId);
    const { data: staff } = await supabaseAdmin.rpc("is_staff", { _user_id: userId });
    if (!staff) {
      const { data: isTech } = await supabaseAdmin.rpc("has_role", {
        _user_id: userId,
        _role: "technicien",
      });
      if (!isTech) throw new Error("Action non autorisée sur ce dossier");
    }

    const { error } = await supabaseAdmin
      .from("reservations")
      .update({
        assigned_technician_id: data.technicianId || null,
      } as unknown as Database["public"]["Tables"]["reservations"]["Update"])
      .eq("id", data.reservationId);

    if (error) {
      console.error("[admin] assign technician failed", error);
      throw new Error("Assignation impossible.");
    }

    return { ok: true };
  });

export type AdminKpis = {
  dailyRevenue: { date: string; amount: number }[];
  quoteConversion: { quotesSent: number; quotesApproved: number; paid: number; rate: number };
  avgStageDuration: { stage: string; avgHours: number }[];
  topFaults: { fault: string; count: number }[];
};

/**
 * Indicateurs avancés de l'atelier : revenus quotidiens encaissés (30 jours),
 * conversion devis → paiement, durée moyenne par étape (historique des
 * statuts) et pannes les plus estimées (événements analytics).
 */
export const getAdminKpis = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => boardSchema.parse(data))
  .handler(async (): Promise<AdminKpis> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("admin-kpis", 10))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const userId = await currentUserId(supabaseAdmin);
    await requireFreshOtp(supabaseAdmin, userId);
    const { data: staff } = await supabaseAdmin.rpc("is_staff", { _user_id: userId });
    if (!staff) throw new Error("Action non autorisée sur ce dossier");

    const DAY_MS = 24 * 3600 * 1000;
    const since = new Date(Date.now() - 29 * DAY_MS).toISOString();

    const [paymentsResult, reservationsResult, historyResult, faultsResult] = await Promise.all([
      supabaseAdmin
        .from("payments")
        .select("amount, status, source, reference, created_at")
        .eq("status", "paid")
        .gte("created_at", since),
      supabaseAdmin.from("reservations").select("quote_status"),
      supabaseAdmin
        .from("reservation_status_history")
        .select("reservation_id, old_status, new_status, created_at")
        .order("created_at", { ascending: true })
        .limit(5000),
      supabaseAdmin
        .from("analytics_events")
        .select("category")
        .eq("event", "estimation_shown")
        .limit(3000),
    ]);

    // Revenus journaliers : sommes des paiements confirmés, par jour (UTC).
    const byDay = new Map<string, number>();
    for (const p of paymentsResult.data ?? []) {
      const day = p.created_at.slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + p.amount);
    }
    const dailyRevenue: { date: string; amount: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10);
      dailyRevenue.push({ date: day, amount: byDay.get(day) ?? 0 });
    }

    // Conversion devis → paiement (uniquement les dossiers réparation).
    let quotesSent = 0;
    let quotesApproved = 0;
    for (const r of reservationsResult.data ?? []) {
      if (r.quote_status === "sent" || r.quote_status === "approved") quotesSent += 1;
      if (r.quote_status === "approved") quotesApproved += 1;
    }
    const paidReferences = new Set<string>();
    for (const p of paymentsResult.data ?? []) {
      if (p.source === "reservation" && p.reference) paidReferences.add(p.reference);
    }
    const paid = paidReferences.size;
    const rate = quotesSent > 0 ? Math.round((paid / quotesSent) * 1000) / 10 : 0;

    // Durée moyenne passée dans chaque étape : l'écart entre deux entrées
    // consécutives de l'historique d'un même dossier = temps dans l'ancien
    // statut. Les valeurs aberrantes (> 60 jours) sont ignorées.
    const history = historyResult.data ?? [];
    const durations = new Map<string, { totalHours: number; count: number }>();
    for (let i = 0; i < history.length; i++) {
      const current = history[i];
      if (!current || !current.old_status) continue;
      const previous = history[i - 1];
      if (!previous || previous.reservation_id !== current.reservation_id) continue;
      const hours =
        (new Date(current.created_at).getTime() - new Date(previous.created_at).getTime()) /
        3600000;
      if (!Number.isFinite(hours) || hours < 0 || hours > 60 * 24) continue;
      const acc = durations.get(current.old_status) ?? { totalHours: 0, count: 0 };
      acc.totalHours += hours;
      acc.count += 1;
      durations.set(current.old_status, acc);
    }
    const avgStageDuration = [...durations.entries()]
      .map(([stage, { totalHours, count }]) => ({
        stage,
        avgHours: count > 0 ? Math.round((totalHours / count) * 10) / 10 : 0,
      }))
      .sort((a, b) => b.avgHours - a.avgHours);

    // Pannes les plus estimées : catégories vues à l'étape estimation.
    const faultCounts = new Map<string, number>();
    for (const row of faultsResult.data ?? []) {
      if (!row.category) continue;
      faultCounts.set(row.category, (faultCounts.get(row.category) ?? 0) + 1);
    }
    const topFaults = [...faultCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([fault, count]) => ({ fault, count }));

    return {
      dailyRevenue,
      quoteConversion: { quotesSent, quotesApproved, paid, rate },
      avgStageDuration,
      topFaults,
    };
  });

// ---------------------------------------------------------------------------
// Transfert d'atelier
// ---------------------------------------------------------------------------

export type TransferResult = {
  ok: boolean;
  error?: string;
  old_workshop?: string;
  new_workshop?: string;
  target_name?: string;
};

const transferSchema = z.object({
  reservationId: z.string().uuid(),
  targetWorkshopId: z.string().uuid(),
});

/** Transfère un dossier vers un autre atelier (staff uniquement). */
export const transferReservation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => transferSchema.parse(data))
  .handler(async ({ data }): Promise<TransferResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("transfer-reservation", 10))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const userId = await currentUserId(supabaseAdmin);
    await requireFreshOtp(supabaseAdmin, userId);
    const { data: staff } = await supabaseAdmin.rpc("is_staff", { _user_id: userId });
    if (!staff) throw new Error("Action non autorisée");

    const { data: result, error } = await supabaseAdmin.rpc(
      "transfer_reservation" as never,
      {
        _reservation_id: data.reservationId,
        _target_workshop_id: data.targetWorkshopId,
      } as never,
    );

    if (error) {
      console.error("[admin] transfer failed", error);
      throw new Error("Transfert impossible.");
    }

    return (result as TransferResult) ?? { ok: false, error: "Erreur inconnue." };
  });

// ---------------------------------------------------------------------------
// Charge de travail par atelier
// ---------------------------------------------------------------------------

export type WorkshopLoad = {
  id: string;
  name: string;
  city: string;
  active: boolean;
  active_count: number;
  in_progress_count: number;
  pending_count: number;
};

/** Charge de travail de chaque atelier (dossiers actifs). */
export const getWorkshopLoad = createServerFn({ method: "GET" }).handler(
  async (): Promise<WorkshopLoad[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("workshop-load", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const { data, error } = await supabaseAdmin.rpc("get_workshop_load" as never);
    if (error) throw new Error(error.message);
    return (data as WorkshopLoad[]) ?? [];
  },
);
