import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import type { Enums } from "@/integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { rateLimit } from "@/lib/security";
import { createLogger } from "@/lib/logger";
import { computeSlaForecast, type SlaForecast, type TimelineEntry } from "@/lib/suivi.functions";

const logger = createLogger("admin");

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
  .validator((data: unknown) => setStatusSchema.parse(data))
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
        logger.error("Technician set status failed", techRpcError);
        throw new Error(techRpcError.message);
      }
    } else {
      const { error } = await supabaseAdmin.rpc("staff_set_reservation_status", {
        _reservation_id: data.id,
        _status: data.status,
        ...(data.note ? { _note: data.note } : {}),
      });
      if (error) {
        logger.error("Set status failed", error);
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
      const { triggerWebhooks } = await import("@/lib/webhooks.functions");
      void triggerWebhooks(
        data.status === "terminee" ? "reservation.completed" : "reservation.status_changed",
        {
          reference: row.reference,
          status: data.status,
          device: row.device,
        },
      );
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
        logger.error("Loyalty credit for completed repair failed", err as Error);
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
        logger.error("Loyalty referral credit failed", err as Error);
      }
    }

    return true;
  });

export type SetStatusInput = z.infer<typeof setStatusSchema>;
export type SetStatusResult = boolean;
export type Status = Enums<"reservation_status">;

export type ReservationQuote = {
  reference: string;
  quote_amount: number | null;
  quote_status: string;
  quote_decided_at: string | null;
  quote_token: string | null;
  warranty_months: number;
};

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
export type AtelierChecklistItem = { status: "ok" | "ko" | "na"; notes?: string };

export type AtelierChecklist = {
  checked_at: string;
  items: Record<string, AtelierChecklistItem>;
};

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
  workshop_id?: string | null;
  intake_checklist?: AtelierChecklist | null;
  qa_checklist?: AtelierChecklist | null;
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
  .validator((data: unknown) => boardSchema.parse(data))
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
      logger.error("Atelier board failed", rError);
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
  .validator((data: unknown) => assignTechnicianSchema.parse(data))
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
      logger.error("Assign technician failed", error);
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
  .validator((data: unknown) => boardSchema.parse(data))
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
  .validator((data: unknown) => transferSchema.parse(data))
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
      logger.error("Transfer failed", error);
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

    const userId = await currentUserId(supabaseAdmin);
    if (!userId) throw new Error("Non authentifié");
    const { data: staff } = await supabaseAdmin.rpc("is_staff", { _user_id: userId });
    if (!staff) throw new Error("Action non autorisée");

    const { data, error } = await supabaseAdmin.rpc("get_workshop_load" as never);
    if (error) throw new Error(error.message);
    return (data as WorkshopLoad[]) ?? [];
  },
);

// ---------------------------------------------------------------------------
// Requêtes admin déplacées côté serveur (audit b43)
// ---------------------------------------------------------------------------

async function requireStaffGuard(supabaseAdmin: SupabaseClient<Database>) {
  const userId = await currentUserId(supabaseAdmin);
  await requireFreshOtp(supabaseAdmin, userId);
  const { data: staff, error } = await supabaseAdmin.rpc("is_staff", { _user_id: userId });
  if (error || !staff) throw new Error("Action non autorisée");
  return userId;
}

export type DashboardActivity = {
  id: string;
  reservation_id: string | null;
  new_status: string | null;
  note: string | null;
  created_at: string;
  reservations: { reference: string; customer_name: string } | null;
};

export type DashboardStats = {
  activeRepairs: number;
  todayReservations: number;
  monthRevenue: number;
  pendingQuotes: number;
  realtimeActive: number;
  recentActivity: DashboardActivity[];
};

/** Statistiques du tableau de bord admin (6 compteurs en un seul appel serveur). */
export const getAdminDashboardStats = createServerFn({ method: "POST" }).handler(
  async (): Promise<DashboardStats> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("admin-dash", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    await requireStaffGuard(supabaseAdmin);

    const today = new Date().toISOString().split("T")[0]!;
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const [active, todays, pending, realtime, recent, paymentsRes] = await Promise.all([
      supabaseAdmin
        .from("reservations")
        .select("*", { count: "exact", head: true })
        .in("status", ["en_attente", "en_cours"]),
      supabaseAdmin
        .from("reservations")
        .select("*", { count: "exact", head: true })
        .eq("slot_date", today),
      supabaseAdmin
        .from("reservations")
        .select("*", { count: "exact", head: true })
        .eq("status", "en_attente" as never),
      supabaseAdmin
        .from("reservations")
        .select("*", { count: "exact", head: true })
        .in("status", ["en_attente", "en_cours", "pieces", "pret"] as never[]),
      supabaseAdmin
        .from("reservation_status_history")
        .select(
          "id, reservation_id, new_status, note, created_at, reservations(reference, customer_name)",
        )
        .order("created_at", { ascending: false })
        .limit(8),
      supabaseAdmin
        .from("payments")
        .select("amount")
        .gte("created_at", startOfMonth)
        .eq("status", "paid"),
    ]);

    let monthRevenue = 0;
    if ((paymentsRes.data ?? []).length > 0) {
      monthRevenue = (paymentsRes.data ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0);
    } else {
      const { data: resData } = await supabaseAdmin
        .from("reservations")
        .select("quote_amount")
        .gte("created_at", startOfMonth)
        .eq("payment_status", "paid");
      monthRevenue = (resData ?? []).reduce((sum, r) => sum + (r.quote_amount ?? 0), 0);
    }

    return {
      activeRepairs: active.count ?? 0,
      todayReservations: todays.count ?? 0,
      monthRevenue,
      pendingQuotes: pending.count ?? 0,
      realtimeActive: realtime.count ?? 0,
      recentActivity: (recent.data ?? []) as DashboardActivity[],
    };
  },
);

export type AnalyticsCounts = { event: string; count: number }[];

/** Événements récents + comptage des événements (agrégé côté serveur, plus de 20 000 lignes vers le client). */
export const getAdminAnalyticsData = createServerFn({ method: "POST" }).handler(
  async (): Promise<{
    events: { event: string; created_at: string }[];
    counts: AnalyticsCounts;
  }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("admin-analytics", 15))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    await requireStaffGuard(supabaseAdmin);

    const [eventsResult, rowsResult] = await Promise.all([
      supabaseAdmin
        .from("analytics_events")
        .select("event, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("analytics_events")
        .select("event")
        .order("created_at", { ascending: false })
        .limit(20000),
    ]);

    const map = new Map<string, number>();
    for (const row of rowsResult.data ?? []) {
      map.set(row.event, (map.get(row.event) ?? 0) + 1);
    }
    const counts = [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([event, count]) => ({ event, count }));

    return { events: eventsResult.data ?? [], counts };
  },
);

export type TeamMember = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
};

/** Équipe admin : profils + rôles + statut admin de l'appelant (PII lue côté serveur uniquement). */
export const getAdminTeamData = createServerFn({ method: "POST" }).handler(
  async (): Promise<{
    isAdmin: boolean;
    members: { profiles: TeamMember[]; roles: { user_id: string; role: string }[] };
  }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("admin-team", 15))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const userId = await requireStaffGuard(supabaseAdmin);

    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    const [profilesResult, rolesResult] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, email, phone, created_at")
        .order("created_at", { ascending: true })
        .limit(200),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);

    return {
      isAdmin: Boolean(isAdmin),
      members: {
        profiles: (profilesResult.data ?? []) as TeamMember[],
        roles: (rolesResult.data ?? []) as { user_id: string; role: string }[],
      },
    };
  },
);

export type AdminStatsData = {
  reservations: {
    id: string;
    reference: string;
    customer_name: string;
    device: string;
    issue: string;
    status: string;
    slot_date: string | null;
    slot_period: string | null;
    mode: string;
    payment: string;
    created_at: string;
  }[];
  leads: { source: string | null; status: string; message: string | null; created_at: string }[];
  payments: { amount: number; status: string; created_at: string }[];
};

/** Jeux de données bruts du tableau de bord statistiques (12 mois, bornés). */
export const getAdminStatsData = createServerFn({ method: "POST" }).handler(
  async (): Promise<AdminStatsData> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("admin-stats", 15))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    await requireStaffGuard(supabaseAdmin);

    const since = new Date(Date.now() - 12 * 30 * 24 * 3600 * 1000).toISOString();

    const [reservationsResult, leadsResult, paymentsResult] = await Promise.all([
      supabaseAdmin
        .from("reservations")
        .select(
          "id, reference, customer_name, device, issue, status, slot_date, slot_period, mode, payment, created_at",
        )
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin
        .from("leads")
        .select("source, status, message, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin
        .from("payments")
        .select("amount, status, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    return {
      reservations: (reservationsResult.data ?? []) as AdminStatsData["reservations"],
      leads: (leadsResult.data ?? []) as AdminStatsData["leads"],
      payments: (paymentsResult.data ?? []) as AdminStatsData["payments"],
    };
  },
);

const checklistSchema = z.object({
  reservationId: z.string().uuid(),
  type: z.enum(["intake", "qa"]),
  items: z.array(z.any()).optional(),
});

/** Enregistrement d'une checklist d'admission (intake) ou de contrôle qualité (qa). */
export const saveChecklist = createServerFn({ method: "POST" })
  .validator((data: unknown) => checklistSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("admin-checklist", 30))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    await requireStaffGuard(supabaseAdmin);

    const column = data.type === "intake" ? "intake_checklist" : "qa_checklist";
    const payload = {
      checked_at: new Date().toISOString(),
      items: data.items ?? [],
    };
    const { error } = await supabaseAdmin
      .from("reservations")
      .update({ [column]: payload } as never)
      .eq("id", data.reservationId);
    if (error) {
      logger.error("Save checklist failed", error);
      throw new Error("Impossible d'enregistrer la checklist.");
    }
    return { saved: true };
  });

const leadStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.string().trim().max(30),
});

/** Commandes boutique : leads + paiements (PII lue côté serveur uniquement). */
export const getAdminOrdersData = createServerFn({ method: "POST" }).handler(
  async (): Promise<{
    orders: {
      id: string;
      reference: string | null;
      name: string | null;
      phone: string | null;
      message: string | null;
      status: string;
      created_at: string;
    }[];
    payments: {
      reference: string | null;
      status: string;
      amount: number | null;
      created_at: string;
    }[];
  }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("admin-orders", 15))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    await requireStaffGuard(supabaseAdmin);

    const [leadsResult, paymentsResult] = await Promise.all([
      supabaseAdmin
        .from("leads")
        .select("id, reference, name, phone, message, status, created_at")
        .eq("source", "boutique")
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("payments")
        .select("reference, status, amount, created_at")
        .eq("source", "boutique")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    return {
      orders: leadsResult.data ?? [],
      payments: paymentsResult.data ?? [],
    };
  },
);

/** Demandes de devis / leads (PII lue côté serveur uniquement). */
export const getAdminLeadsData = createServerFn({ method: "POST" }).handler(
  async (): Promise<
    {
      id: string;
      source: string | null;
      reference: string | null;
      name: string | null;
      phone: string | null;
      email: string | null;
      message: string | null;
      status: string;
      created_at: string;
    }[]
  > => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("admin-leads", 15))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    await requireStaffGuard(supabaseAdmin);

    const { data, error } = await supabaseAdmin
      .from("leads")
      .select("id, source, reference, name, phone, email, message, status, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  },
);

/** Changement de statut d'un lead (commandes boutique). */
export const setLeadStatus = createServerFn({ method: "POST" })
  .validator((data: unknown) => leadStatusSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("admin-lead-status", 30))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    await requireStaffGuard(supabaseAdmin);

    const { error } = await supabaseAdmin
      .from("leads")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) {
      logger.error("Set lead status failed", error);
      throw new Error("Impossible de mettre à jour ce lead.");
    }
    return { updated: true };
  });

const teamRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "staff", "technicien", "user"]),
});

/** Attribution d'un rôle à un membre de l'équipe (admin requis côté serveur). */
export const setTeamRole = createServerFn({ method: "POST" })
  .validator((data: unknown) => teamRoleSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("admin-set-role", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const userId = await requireStaffGuard(supabaseAdmin);

    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Réservé à l'administrateur.");

    const { error } = await supabaseAdmin.rpc("set_user_role", {
      _user_id: data.userId,
      _role: data.role,
    });
    if (error) {
      logger.error("Set team role failed", error);
      throw new Error("Impossible de changer ce rôle.");
    }
    return { updated: true };
  });

// ---------------------------------------------------------------------------
// Requêtes admin restantes (deliveries, satisfaction, POS, kanban, chat)
// ---------------------------------------------------------------------------

export type AdminDeliveryRow = {
  id: string;
  reference: string;
  customer_name: string;
  phone: string | null;
  device: string;
  issue: string | null;
  delivery_status: string | null;
  delivery_address: string | null;
  slot_date: string | null;
  slot_period: string | null;
  status: string;
};

/** Livraisons à domicile pour l'admin — PII (téléphone/adresse) lue côté serveur. */
export const getAdminDeliveries = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (!(await rateLimit("admin-deliveries", 20)))
    throw new Error("Trop de demandes. Réessayez dans une minute.");
  await requireStaffGuard(supabaseAdmin);

  const { data, error } = await supabaseAdmin
    .from("reservations")
    .select(
      "id, reference, customer_name, phone, device, issue, delivery_status, delivery_address, slot_date, slot_period, status",
    )
    .eq("mode", "domicile")
    .order("slot_date", { ascending: false })
    .limit(200);
  if (error) throw new Error("Impossible de charger les livraisons.");
  return (data ?? []) as AdminDeliveryRow[];
});

export type CompletedDossierRow = {
  id: string;
  reference: string;
  customer_name: string;
  phone: string | null;
  device: string;
  updated_at: string;
};

/** Dossiers terminés récents (satisfaction client) — PII lue côté serveur. */
export const getAdminCompletedDossiers = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (!(await rateLimit("admin-completed", 20)))
    throw new Error("Trop de demandes. Réessayez dans une minute.");
  await requireStaffGuard(supabaseAdmin);

  const { data, error } = await supabaseAdmin
    .from("reservations")
    .select("id, reference, customer_name, phone, device, updated_at")
    .in("status", ["terminee", "livre"])
    .order("updated_at", { ascending: false })
    .limit(10);
  if (error) throw new Error("Impossible de charger les dossiers.");
  return (data ?? []) as CompletedDossierRow[];
});

export type ReservationSearchRow = {
  id: string;
  reference: string;
  customer_name: string;
  phone: string | null;
  device: string;
  issue: string | null;
  quote_amount: number | null;
  payment_status: string | null;
  status: string;
};

/** Recherche de réservations (POS) — PII lue côté serveur uniquement. */
export const searchAdminReservations = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ q: z.string().trim().min(2).max(60) }).parse(data))
  .handler(async ({ data }): Promise<ReservationSearchRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await rateLimit("admin-search", 30)))
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    await requireStaffGuard(supabaseAdmin);

    const q = data.q.replace(/[%_]/g, "");
    const { data: rows, error } = await supabaseAdmin
      .from("reservations")
      .select(
        "id, reference, customer_name, phone, device, issue, quote_amount, payment_status, status",
      )
      .or(`reference.ilike.%${q}%,customer_name.ilike.%${q}%,phone.ilike.%${q}%`)
      .order("created_at", { ascending: false })
      .limit(6);
    if (error) throw new Error("Recherche impossible.");
    return (rows ?? []) as ReservationSearchRow[];
  });

export type StatusHistoryRow = {
  id: string;
  old_status: string | null;
  new_status: string | null;
  note: string | null;
  created_at: string;
};

/** Historique des changements de statut d'une réservation (kanban). */
export const getReservationStatusHistory = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ reservationId: z.string().trim().min(1) }).parse(data))
  .handler(async ({ data }): Promise<StatusHistoryRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await rateLimit("admin-history", 30)))
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    await requireStaffGuard(supabaseAdmin);

    const { data: rows, error } = await supabaseAdmin
      .from("reservation_status_history")
      .select("id, old_status, new_status, note, created_at")
      .eq("reservation_id", data.reservationId)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Impossible de charger l'historique.");
    return (rows ?? []) as StatusHistoryRow[];
  });

export type ConversationReservationRow = {
  id: string;
  reference: string;
  customer_name: string;
  device: string;
  phone: string | null;
  status: string;
  created_at: string;
};

/** Réservations récentes pour la liste de conversations du chat admin. */
export const getAdminConversationReservations = createServerFn({ method: "POST" }).handler(
  async (): Promise<ConversationReservationRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await rateLimit("admin-chat", 20)))
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    await requireStaffGuard(supabaseAdmin);

    const { data, error } = await supabaseAdmin
      .from("reservations")
      .select("id, reference, customer_name, device, phone, status, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error("Impossible de charger les conversations.");
    return (data ?? []) as ConversationReservationRow[];
  },
);

// ---------------------------------------------------------------------------
// Requêtes admin dossier (assignations, équipe technique, organisations)
// ---------------------------------------------------------------------------

export type AssignmentRow = {
  id: string;
  reservation_id: string;
  technician_id: string | null;
  assigned_by: string;
  created_at: string;
};

/** Assignations technicien récentes (dossier) — lues côté serveur. */
export const getAdminAssignments = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (!(await rateLimit("admin-assignments", 20)))
    throw new Error("Trop de demandes. Réessayez dans une minute.");
  await requireStaffGuard(supabaseAdmin);

  const { data, error } = await supabaseAdmin
    .from("technician_assignments")
    .select("id, reservation_id, technician_id, assigned_by, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error("Impossible de charger les assignations.");
  return (data ?? []) as AssignmentRow[];
});

/** Techniciens (id + nom, PII lue côté serveur). */
export const getAdminTechnicians = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ id: string; full_name: string }[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await rateLimit("admin-technicians", 20)))
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    await requireStaffGuard(supabaseAdmin);

    const { data: roles, error: rError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "technicien");
    if (rError) throw new Error("Impossible de charger les techniciens.");
    const ids = roles.map((r) => r.user_id);
    if (ids.length === 0) return [];

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", ids);
    if (error) throw new Error("Impossible de charger les techniciens.");
    return (data ?? []) as { id: string; full_name: string }[];
  },
);

/** Organisations (id + nom) pour l'affichage des dossiers. */
export const getAdminOrganizations = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ id: string; name: string }[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await rateLimit("admin-organizations", 20)))
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    await requireStaffGuard(supabaseAdmin);

    const { data, error } = await supabaseAdmin.from("organizations").select("id, name");
    if (error) throw new Error("Impossible de charger les organisations.");
    return (data ?? []) as { id: string; name: string }[];
  },
);

/** Assignation d'un technicien à un dossier (staff uniquement). */
export const createTechnicianAssignment = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({ reservationId: z.string().trim().min(1), technicianId: z.string().nullable() })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await rateLimit("admin-assign", 30)))
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    const userId = await requireStaffGuard(supabaseAdmin);

    const { error } = await supabaseAdmin.from("technician_assignments").insert({
      reservation_id: data.reservationId,
      technician_id: data.technicianId,
      assigned_by: userId,
    });
    if (error) {
      logger.error("Assign technician failed", error);
      throw new Error("Impossible d'assigner le technicien.");
    }
    return { assigned: true };
  });

// ---------------------------------------------------------------------------
// Liste des dossiers (admin) — PII complète lue côté serveur uniquement.
// ---------------------------------------------------------------------------

export type AdminReservationRow = {
  id: string;
  reference: string;
  customer_name: string;
  phone: string;
  email: string | null;
  device: string;
  issue: string;
  mode: string;
  payment: string;
  slot_date: string;
  slot_period: Enums<"slot_period">;
  slot_hour: string | null;
  status: Enums<"reservation_status">;
  delivery_status: Enums<"delivery_status">;
  delivery_address: string | null;
  staff_notes: string | null;
  created_at: string;
  assigned_technician_id: string | null;
  org_id: string | null;
  quote_amount: number | null;
  quote_status: string;
  quote_decided_at: string | null;
  quote_token: string | null;
  warranty_months: number;
};

/** Liste des dossiers /admin/dossiers — staff (ou technicien pour ses dossiers). */
export const getAdminReservations = createServerFn({ method: "POST" }).handler(
  async (): Promise<AdminReservationRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await rateLimit("admin-reservations", 15)))
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    const userId = await currentUserId(supabaseAdmin);
    await requireFreshOtp(supabaseAdmin, userId);
    const { data: staff } = await supabaseAdmin.rpc("is_staff", { _user_id: userId });
    let isTech = false;
    if (!staff) {
      const { data } = await supabaseAdmin.rpc("has_role", {
        _user_id: userId,
        _role: "technicien",
      });
      isTech = !!data;
      if (!isTech) throw new Error("Action non autorisée");
    }

    let query = supabaseAdmin
      .from("reservations")
      .select(
        "id, reference, customer_name, phone, email, device, issue, mode, payment, slot_date, slot_period, slot_hour, status, delivery_status, delivery_address, staff_notes, created_at, assigned_technician_id, org_id, quote_amount, quote_status, quote_decided_at, quote_token, warranty_months",
      )
      .order("slot_date", { ascending: false })
      .limit(200);
    if (isTech) query = query.eq("assigned_technician_id", userId);
    const { data, error } = await query;
    if (error) {
      logger.error("Admin reservations failed", error);
      throw new Error("Impossible de charger les dossiers.");
    }
    return (data ?? []) as AdminReservationRow[];
  },
);

// ---------------------------------------------------------------------------
// Liste des dossiers paginée (tableau /admin/dossiers) — filtres en SQL.
// ---------------------------------------------------------------------------

const reservationsPageSchema = z.object({
  page: z.number().int().min(1).max(10000).default(1),
  perPage: z.number().int().min(10).max(200).default(50),
  status: z.string().trim().max(30).optional(),
  q: z.string().trim().max(80).optional(),
  dateFrom: z.string().trim().max(20).optional(),
  dateTo: z.string().trim().max(20).optional(),
  type: z.enum(["tous", "b2b", "particulier"]).optional(),
  techFilter: z.string().trim().max(60).optional(),
});

export const getAdminReservationsPage = createServerFn({ method: "POST" })
  .validator((data: unknown) => reservationsPageSchema.parse(data))
  .handler(async ({ data }): Promise<{ rows: AdminReservationRow[]; total: number }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await rateLimit("admin-reservations", 15)))
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    const userId = await currentUserId(supabaseAdmin);
    await requireFreshOtp(supabaseAdmin, userId);
    const { data: staff } = await supabaseAdmin.rpc("is_staff", { _user_id: userId });
    let isTech = false;
    if (!staff) {
      const { data: t } = await supabaseAdmin.rpc("has_role", {
        _user_id: userId,
        _role: "technicien",
      });
      isTech = !!t;
      if (!isTech) throw new Error("Action non autorisée");
    }

    const q = (data.q ?? "").replace(/[%_]/g, "");

    // Filtre technicien : dernière assignation connue par dossier.
    let techIds: string[] | null = null;
    if (data.techFilter && data.techFilter !== "tous") {
      const { data: assignments, error: aError } = await supabaseAdmin
        .from("technician_assignments")
        .select("reservation_id, technician_id, created_at")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (aError) throw new Error("Impossible de filtrer par technicien.");
      const latest = new Map<string, string | null>();
      for (const a of assignments ?? []) {
        if (!latest.has(a.reservation_id)) latest.set(a.reservation_id, a.technician_id);
      }
      techIds = [...latest.entries()]
        .filter(([, tech]) =>
          data.techFilter === "non-assigne" ? tech === null : tech === data.techFilter,
        )
        .map(([rid]) => rid);
      if (data.techFilter !== "non-assigne" && techIds.length === 0) {
        return { rows: [], total: 0 };
      }
    }

    const selectCols =
      "id, reference, customer_name, phone, email, device, issue, mode, payment, slot_date, slot_period, slot_hour, status, delivery_status, delivery_address, staff_notes, created_at, assigned_technician_id, org_id, quote_amount, quote_status, quote_decided_at, quote_token, warranty_months";

    const buildCount = () => {
      let c = supabaseAdmin.from("reservations").select("id", { count: "exact", head: true });
      if (data.status && data.status !== "toutes")
        c = c.eq("status", data.status as Enums<"reservation_status">);
      if (q) {
        c = c.or(
          `reference.ilike.%${q}%,customer_name.ilike.%${q}%,device.ilike.%${q}%,issue.ilike.%${q}%`,
        );
      }
      if (data.dateFrom) c = c.gte("slot_date", data.dateFrom);
      if (data.dateTo) c = c.lte("slot_date", data.dateTo);
      if (data.type === "b2b") c = c.not("org_id", "is", null);
      if (data.type === "particulier") c = c.is("org_id", null);
      if (isTech) c = c.eq("assigned_technician_id", userId);
      return c;
    };

    const buildRows = () => {
      let r = supabaseAdmin
        .from("reservations")
        .select(selectCols)
        .order("slot_date", { ascending: false });
      if (data.status && data.status !== "toutes")
        r = r.eq("status", data.status as Enums<"reservation_status">);
      if (q) {
        r = r.or(
          `reference.ilike.%${q}%,customer_name.ilike.%${q}%,device.ilike.%${q}%,issue.ilike.%${q}%`,
        );
      }
      if (data.dateFrom) r = r.gte("slot_date", data.dateFrom);
      if (data.dateTo) r = r.lte("slot_date", data.dateTo);
      if (data.type === "b2b") r = r.not("org_id", "is", null);
      if (data.type === "particulier") r = r.is("org_id", null);
      if (isTech) r = r.eq("assigned_technician_id", userId);
      return r;
    };

    let total = 0;
    const countQuery = buildCount();
    if (techIds) {
      if (data.techFilter === "non-assigne") {
        if (techIds.length > 0) {
          const { count } = await countQuery.not("id", "in", `(${techIds.join(",")})`);
          total = count ?? 0;
        }
      } else {
        const { count } = await countQuery.in("id", techIds);
        total = count ?? 0;
      }
    } else {
      const { count } = await countQuery;
      total = count ?? 0;
    }

    const rowsBuilder = buildRows();
    const from = (data.page - 1) * data.perPage;
    const to = from + data.perPage - 1;
    let rowsQuery = rowsBuilder;
    if (techIds) {
      if (data.techFilter === "non-assigne") {
        rowsQuery =
          techIds.length === 0
            ? rowsBuilder.limit(0)
            : rowsBuilder.not("id", "in", `(${techIds.join(",")})`);
      } else {
        rowsQuery = rowsBuilder.in("id", techIds);
      }
    }
    const { data: rows, error } = await rowsQuery.range(from, to);
    if (error) {
      logger.error("Admin reservations page failed", error);
      throw new Error("Impossible de charger les dossiers.");
    }
    return { rows: (rows ?? []) as AdminReservationRow[], total };
  });
