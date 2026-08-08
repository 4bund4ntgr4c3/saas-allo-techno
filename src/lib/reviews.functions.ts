// Avis clients vérifiés : invitations par lien secret, publication publique
// et modération par l'atelier. Les tables `reviews` (nouveau schéma) et
// `review_invites` ne sont pas (encore) dans src/integrations/supabase/types.ts :
// les requêtes passent par un client brut dont on retype les résultats.

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { COMPANY } from "@/data/catalog/company";
import { rateLimit } from "@/lib/security";
import { createLogger } from "@/lib/logger";

const logger = createLogger("reviews");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReviewStatus = "pending" | "published" | "hidden";

export type ReviewInviteInfo = {
  reservation_id: string;
  sent_at: string;
  used_at: string | null;
};

export type PublishedReview = {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
  reference: string | null;
  device: string | null;
};

export type AdminReviewRow = {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  rating: number;
  comment: string;
  status: ReviewStatus;
  verified: boolean;
  created_at: string;
  reservation_id: string | null;
  reference: string | null;
  device: string | null;
  invite: { sent_at: string; used_at: string | null } | null;
};

// ---------------------------------------------------------------------------
// Client brut (tables absentes de types.ts) — résultats retypés à la main.
// ---------------------------------------------------------------------------

type RawFilter<T> = {
  eq: (col: string, val: unknown) => RawFilter<T>;
  in: (col: string, vals: unknown[]) => RawFilter<T>;
  order: (col: string, opts?: { ascending?: boolean }) => RawFilter<T>;
  limit: (n: number) => RawFilter<T>;
  select: (cols: string) => RawFilter<T>;
  maybeSingle: () => Promise<{ data: T | null; error: { message: string } | null }>;
  single: () => Promise<{ data: T | null; error: { message: string } | null }>;
  then: PromiseLike<{ data: T[] | null; error: { message: string } | null }>["then"];
};

type RawQuery<T> = {
  select: (cols: string) => RawFilter<T>;
  insert: (values: Record<string, unknown>) => RawFilter<T>;
  update: (values: Record<string, unknown>) => RawFilter<T>;
};

function raw<T = Record<string, unknown>>(
  client: SupabaseClient<Database>,
): { from: (table: string) => RawQuery<T> } {
  return client as unknown as { from: (table: string) => RawQuery<T> };
}

/** Table `review_invites` en accès brut (absente de types.ts), côté client comme côté serveur. */
export function rawReviewsTable(client: SupabaseClient<Database>): RawQuery<ReviewInviteInfo> {
  return raw<ReviewInviteInfo>(client).from("review_invites");
}

// ---------------------------------------------------------------------------
// Garde admin — même patron que admin.tsx : session requise + RPC is_staff
// (les RPC tournent sous service_role, la vérification est côté serveur).
// ---------------------------------------------------------------------------

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

/** Appelant admis (admin/staff). Lève une erreur sinon. */
async function requireStaff(supabaseAdmin: SupabaseClient<Database>): Promise<string> {
  const userId = await currentUserId(supabaseAdmin);
  const { data: staff, error } = await supabaseAdmin.rpc("is_staff", { _user_id: userId });
  if (error || !staff) throw new Error("Action non autorisée");
  return userId;
}

// ---------------------------------------------------------------------------
// Notification best-effort de l'invitation (WhatsApp + e-mail).
// sendWhatsApp/sendEmail de notifications.ts ne sont pas exportés : on
// reproduit ici le même comportement silencieux (jamais d'erreur propagée)
// avec les mêmes variables d'environnement (RESEND_API_KEY, WHATSAPP_TOKEN…).
// ---------------------------------------------------------------------------

const RESEND_API_KEY = process.env["RESEND_API_KEY"];
const RESEND_FROM =
  process.env["RESEND_FROM"] ?? `Allô Techno <noreply@${COMPANY.email.split("@")[1]}>`;
const WHATSAPP_TOKEN = process.env["WHATSAPP_TOKEN"];
const WHATSAPP_PHONE_NUMBER_ID = process.env["WHATSAPP_PHONE_NUMBER_ID"];
const PHONE_PREFIX = process.env["PHONE_COUNTRY_PREFIX"] ?? "229";

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const cleaned = digits.startsWith("00") ? digits.slice(2) : digits;
  return cleaned.startsWith(PHONE_PREFIX) ? cleaned : `${PHONE_PREFIX}${cleaned}`;
}

async function sendRawEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) {
    logger.warn("RESEND_API_KEY manquante — e-mail ignoré");
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: RESEND_FROM, to: [to], subject, html }),
    });
    if (!res.ok)
      logger.error("Resend error", new Error(`HTTP ${res.status}`), {
        status: res.status,
        body: await res.text(),
      });
  } catch (err) {
    logger.error("Resend échec réseau", err as Error);
  }
}

async function sendRawWhatsApp(to: string, body: string): Promise<void> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    logger.warn("WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID manquants — WhatsApp ignoré");
    return;
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: normalizePhone(to),
          type: "text",
          text: { body },
        }),
      },
    );
    if (!res.ok)
      logger.error("WhatsApp error", new Error(`HTTP ${res.status}`), {
        status: res.status,
        body: await res.text(),
      });
  } catch (err) {
    logger.error("WhatsApp échec réseau", err as Error);
  }
}

async function notifyReviewInvite(
  r: {
    reference: string;
    customer_name: string;
    phone: string;
    email: string | null;
    device: string;
  },
  token: string,
): Promise<void> {
  const link = `${COMPANY.url}/fr/avis?token=${encodeURIComponent(token)}`;
  const sujet = `Dossier ${r.reference} — partagez votre avis`;
  const waBody = [
    `Bonjour ${r.customer_name}, merci pour votre confiance dans la réparation de votre ${r.device} (dossier ${r.reference}).`,
    `Votre avis compte : laissez-nous une note en moins de 2 minutes : ${link}`,
    `${COMPANY.name} — ${COMPANY.phone}`,
  ].join("\n");

  if (r.email) {
    const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#111827">
  <div style="background:#0f172a;color:#fff;padding:20px 24px;border-radius:10px 10px 0 0">
    <strong style="font-size:16px">${COMPANY.name}</strong>
    <p style="margin:2px 0 0;font-size:12px;opacity:.8">Réparation &amp; vente — ${COMPANY.city}, Bénin</p>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 10px 10px">
    <h2 style="margin:0 0 16px;font-size:18px">${sujet}</h2>
    <p style="font-size:14px">Bonjour <strong>${r.customer_name}</strong>, votre appareil (${r.device}, dossier ${r.reference}) a été pris en charge. Un retour rapide nous aide à progresser :</p>
    <p style="margin:18px 0">
      <a href="${link}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600">Laisser un avis</a>
    </p>
    <p style="margin-top:20px;font-size:12px;color:#6b7280">${COMPANY.address} — ${COMPANY.phone}</p>
  </div>
</div>`;
    await sendRawEmail(r.email, sujet, html);
  }
  await sendRawWhatsApp(r.phone, waBody);
}

// ---------------------------------------------------------------------------
// Schémas de validation
// ---------------------------------------------------------------------------

const inviteTokenSchema = z.object({
  token: z.string().trim().min(1).max(200),
});

const submitReviewSchema = z.object({
  token: z.string().trim().min(1).max(200),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(2000),
});

const sendInviteSchema = z.object({
  reservationId: z.string().uuid(),
});

const setReviewStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "published", "hidden"]),
});

const emptySchema = z.object({});

// ---------------------------------------------------------------------------
// Lecture publique d'une invitation (page avis, sans session)
// ---------------------------------------------------------------------------

export type ReviewInviteReservation = {
  reference: string;
  device: string;
  customer_name: string;
};

export type GetReviewInviteResult =
  { ok: true; reservation: ReviewInviteReservation } | { ok: false; error: string };

export const getReviewInvite = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inviteTokenSchema.parse(data))
  .handler(async ({ data }): Promise<GetReviewInviteResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!rateLimit("review-invite-check", 15)) {
      return { ok: false, error: "Trop de demandes. Réessayez dans une minute." };
    }

    const { data: invite } = await raw<{
      id: string;
      reservation_id: string;
      used_at: string | null;
    }>(supabaseAdmin)
      .from("review_invites")
      .select("id, reservation_id, used_at")
      .eq("token", data.token)
      .maybeSingle();

    if (!invite) return { ok: false, error: "Ce lien d'invitation n'est pas valide." };
    if (invite.used_at)
      return { ok: false, error: "Vous avez déjà laissé un avis pour ce dossier." };

    const { data: reservation } = await raw<{
      reference: string;
      device: string;
      customer_name: string;
    }>(supabaseAdmin)
      .from("reservations")
      .select("reference, device, customer_name")
      .eq("id", invite.reservation_id)
      .maybeSingle();

    if (!reservation) return { ok: false, error: "Dossier introuvable." };

    return {
      ok: true,
      reservation: {
        reference: reservation.reference,
        device: reservation.device,
        customer_name: reservation.customer_name,
      },
    };
  });

// ---------------------------------------------------------------------------
// Avis du client connecté (mes avis)
// ---------------------------------------------------------------------------

export type CustomerReview = {
  id: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  verified: boolean;
  created_at: string;
  reference: string | null;
  device: string | null;
};

export const listCustomerReviews = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => emptySchema.parse(data ?? {}))
  .handler(async (): Promise<CustomerReview[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!rateLimit("customer-reviews-list", 20)) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const userId = await currentUserId(supabaseAdmin);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("phone")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.phone) return [];

    const { data, error } = await raw<{
      id: string;
      rating: number;
      comment: string;
      status: ReviewStatus;
      verified: boolean;
      created_at: string;
      reservation: { reference: string; device: string } | null;
    }>(supabaseAdmin)
      .from("reviews")
      .select(
        "id, rating, comment, status, verified, created_at, reservation:reservations(reference, device)",
      )
      .eq("phone", profile.phone)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      logger.error("customer list failed", error as Error);
      return [];
    }

    return (data ?? []).map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      status: r.status,
      verified: r.verified,
      created_at: r.created_at,
      reference: r.reservation?.reference ?? null,
      device: r.reservation?.device ?? null,
    }));
  });

// ---------------------------------------------------------------------------
// Soumission d'un avis via le jeton (une seule fois par dossier)
// ---------------------------------------------------------------------------

export type SubmitReviewResult = { ok: true } | { ok: false; error: string };

export const submitReview = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitReviewSchema.parse(data))
  .handler(async ({ data }): Promise<SubmitReviewResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!rateLimit("review-submit", 3)) {
      return { ok: false, error: "Trop de demandes. Réessayez dans une minute." };
    }

    const { data: invite } = await raw<{
      id: string;
      reservation_id: string;
      used_at: string | null;
    }>(supabaseAdmin)
      .from("review_invites")
      .select("id, reservation_id, used_at")
      .eq("token", data.token)
      .maybeSingle();

    if (!invite) return { ok: false, error: "Ce lien d'invitation n'est pas valide." };
    if (invite.used_at)
      return { ok: false, error: "Vous avez déjà laissé un avis pour ce dossier." };

    const { data: reservation } = await raw<{
      customer_name: string;
      phone: string;
      email: string | null;
    }>(supabaseAdmin)
      .from("reservations")
      .select("customer_name, phone, email")
      .eq("id", invite.reservation_id)
      .maybeSingle();

    if (!reservation) return { ok: false, error: "Dossier introuvable." };

    const { error: insertError } = await raw(supabaseAdmin)
      .from("reviews")
      .insert({
        reservation_id: invite.reservation_id,
        customer_name: reservation.customer_name,
        phone: reservation.phone,
        email: reservation.email,
        rating: data.rating,
        comment: data.comment,
        status: "pending",
        verified: true,
      })
      .select("id")
      .single();

    if (insertError) {
      logger.error("submit insert failed", insertError as Error);
      return { ok: false, error: "Impossible d'enregistrer votre avis. Réessayez." };
    }

    const { error: markError } = await raw(supabaseAdmin)
      .from("review_invites")
      .update({ used_at: new Date().toISOString() })
      .eq("id", invite.id)
      .select("id")
      .single();

    if (markError) logger.error("invite mark used failed", markError as Error);

    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Liste publique des avis publiés (page avis)
// ---------------------------------------------------------------------------

export const listPublishedReviews = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => emptySchema.parse(data ?? {}))
  .handler(async (): Promise<PublishedReview[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!rateLimit("reviews-list", 30)) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const { data, error } = await raw<{
      id: string;
      customer_name: string;
      rating: number;
      comment: string;
      created_at: string;
      reservation: { reference: string; device: string } | null;
    }>(supabaseAdmin)
      .from("reviews")
      .select(
        "id, customer_name, rating, comment, created_at, reservation:reservations(reference, device)",
      )
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      logger.error("list published failed", error as Error);
      return [];
    }

    return (data ?? []).map((r) => ({
      id: r.id,
      customer_name: r.customer_name,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      reference: r.reservation?.reference ?? null,
      device: r.reservation?.device ?? null,
    }));
  });

// ---------------------------------------------------------------------------
// Invitation d'un client (atelier uniquement)
// ---------------------------------------------------------------------------

export type SendReviewInviteResult = { ok: true } | { ok: false; error: string };

export const sendReviewInvite = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => sendInviteSchema.parse(data))
  .handler(async ({ data }): Promise<SendReviewInviteResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!rateLimit("review-invite-send", 20)) {
      return { ok: false, error: "Trop de demandes. Réessayez dans une minute." };
    }

    await requireStaff(supabaseAdmin);

    const { data: reservation, error: fetchError } = await raw<{
      id: string;
      reference: string;
      customer_name: string;
      phone: string;
      email: string | null;
      device: string;
      status: string;
    }>(supabaseAdmin)
      .from("reservations")
      .select("id, reference, customer_name, phone, email, device, status")
      .eq("id", data.reservationId)
      .maybeSingle();

    if (fetchError) {
      logger.error("reservation fetch failed", fetchError as Error);
      return { ok: false, error: "Impossible de lire ce dossier." };
    }
    if (!reservation) return { ok: false, error: "Dossier introuvable." };

    if (reservation.status !== "livre" && reservation.status !== "terminee") {
      return {
        ok: false,
        error: "Ce dossier n'est pas encore livré — invitez après remise de l'appareil.",
      };
    }

    const { data: existing } = await raw<{ id: string; used_at: string | null }>(supabaseAdmin)
      .from("review_invites")
      .select("id, used_at")
      .eq("reservation_id", reservation.id)
      .maybeSingle();

    if (existing) {
      return {
        ok: false,
        error: existing.used_at
          ? "Ce client a déjà laissé son avis."
          : "Une invitation a déjà été envoyée pour ce dossier.",
      };
    }

    const token = crypto.randomUUID();

    const { error: insertError } = await raw(supabaseAdmin)
      .from("review_invites")
      .insert({ reservation_id: reservation.id, token })
      .select("id")
      .single();

    if (insertError) {
      logger.error("invite insert failed", insertError as Error);
      return { ok: false, error: "Impossible de créer l'invitation." };
    }

    void notifyReviewInvite(
      {
        reference: reservation.reference,
        customer_name: reservation.customer_name,
        phone: reservation.phone,
        email: reservation.email,
        device: reservation.device,
      },
      token,
    );

    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Modération (atelier uniquement)
// ---------------------------------------------------------------------------

export const adminListReviews = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => emptySchema.parse(data ?? {}))
  .handler(async (): Promise<AdminReviewRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!rateLimit("admin-reviews-list", 20)) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    await requireStaff(supabaseAdmin);

    const { data, error } = await raw<{
      id: string;
      customer_name: string;
      phone: string;
      email: string | null;
      rating: number;
      comment: string;
      status: ReviewStatus;
      verified: boolean;
      created_at: string;
      reservation_id: string | null;
      reservation: {
        reference: string;
        device: string;
        invites: { sent_at: string; used_at: string | null }[] | null;
      } | null;
    }>(supabaseAdmin)
      .from("reviews")
      .select(
        "id, customer_name, phone, email, rating, comment, status, verified, created_at, reservation_id, reservation:reservations(reference, device, invites:review_invites(sent_at, used_at))",
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      logger.error("admin list failed", error as Error);
      throw new Error("Impossible de charger les avis.");
    }

    const rows = (data ?? []).slice();
    const rank: Record<ReviewStatus, number> = { pending: 0, published: 1, hidden: 2 };
    rows.sort(
      (a, b) => rank[a.status] - rank[b.status] || b.created_at.localeCompare(a.created_at),
    );

    return rows.map((r) => ({
      id: r.id,
      customer_name: r.customer_name,
      phone: r.phone,
      email: r.email,
      rating: r.rating,
      comment: r.comment,
      status: r.status,
      verified: r.verified,
      created_at: r.created_at,
      reservation_id: r.reservation_id,
      reference: r.reservation?.reference ?? null,
      device: r.reservation?.device ?? null,
      invite: r.reservation?.invites?.[0] ?? null,
    }));
  });

export const adminSetReviewStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => setReviewStatusSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!rateLimit("admin-review-status", 20)) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    await requireStaff(supabaseAdmin);

    const { error } = await raw(supabaseAdmin)
      .from("reviews")
      .update({ status: data.status })
      .eq("id", data.id)
      .select("id")
      .single();

    if (error) {
      logger.error("set status failed", error as Error);
      throw new Error("Impossible de mettre à jour cet avis.");
    }

    return { ok: true };
  });
