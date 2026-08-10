import { createServerFn } from "@tanstack/react-start";
import { rateLimit } from "@/lib/security";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CampaignType = "email" | "sms" | "whatsapp";
export type CampaignStatus = "draft" | "sending" | "sent" | "failed";

export type Campaign = {
  id: string;
  name: string;
  type: CampaignType;
  template_id: string | null;
  subject: string | null;
  body: string;
  segment_filter: string;
  status: CampaignStatus;
  sent_count: number;
  open_count: number;
  click_count: number;
  error_count: number;
  sent_at: string | null;
  created_by: string | null;
  created_at: string;
};

export type CampaignSend = {
  id: string;
  campaign_id: string;
  recipient_phone: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
};

export type ClientSegment = {
  phone: string;
  customer_name: string;
  email: string | null;
  frequency: number;
  recency_days: number;
  monetary: number;
  segment: "vip" | "loyal" | "active" | "new" | "inactive";
};

export type SegmentCounts = {
  vip: number;
  loyal: number;
  active: number;
  new: number;
  inactive: number;
  total: number;
};

// ---------------------------------------------------------------------------
// Templates prédéfinis
// ---------------------------------------------------------------------------

export const CAMPAIGN_TEMPLATES = [
  {
    id: "welcome",
    name: "Bienvenue",
    type: "email" as CampaignType,
    subject: "Bienvenue chez {company} !",
    body: "Bonjour {name},\n\nMerci pour votre première réparation chez {company}. Nous espérons que votre appareil fonctionne parfaitement.\n\nN'hésitez pas à nous contacter pour toute question.\n\nL'équipe {company}",
  },
  {
    id: "reengagement",
    name: "Réactivation client",
    type: "sms" as CampaignType,
    subject: null,
    body: "Bonjour {name}, ça fait longtemps ! Profitez de -10% sur votre prochaine réparation avec le code BIENTOT10. — {company}",
  },
  {
    id: "promo",
    name: "Promotion",
    type: "email" as CampaignType,
    subject: "Offre spéciale pour vous !",
    body: "Bonjour {name},\n\nProfitez de {discount}% de réduction sur votre prochaine intervention.\n\nCode promo : {code}\n\nValable jusqu'au {expiry}.\n\n{company}",
  },
  {
    id: "review-request",
    name: "Demander un avis",
    type: "whatsapp" as CampaignType,
    subject: null,
    body: "Bonjour {name}, votre appareil {device} a été réparé avec succès. Pourriez-vous laisser un avis ? {review_link}\n\nMerci ! — {company}",
  },
  {
    id: "maintenance-reminder",
    name: "Rappel maintenance",
    type: "sms" as CampaignType,
    subject: null,
    body: "Bonjour {name}, pensez à faire vérifier votre {device} tous les 6 mois. Prenez RDV : {booking_link} — {company}",
  },
] as const;

// ---------------------------------------------------------------------------
// RPCs
// ---------------------------------------------------------------------------

/** Liste toutes les campagnes. */
export const listCampaigns = createServerFn({ method: "GET" }).handler(
  async (): Promise<Campaign[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await rateLimit("list-campaigns", 20))) throw new Error("Trop de demandes.");
    const { data, error } = await supabaseAdmin
      .from("marketing_campaigns" as never)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Campaign[];
  },
);

/** Liste les envois d'une campagne. */
export const listCampaignSends = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { campaign_id } = data as { campaign_id: string };
    return { campaign_id };
  })
  .handler(async ({ data }): Promise<CampaignSend[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await rateLimit("list-campaign-sends", 20))) throw new Error("Trop de demandes.");
    const { data: rows, error } = await supabaseAdmin
      .from("campaign_sends" as never)
      .select("*")
      .eq("campaign_id", data.campaign_id)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as CampaignSend[];
  });

/** Crée une campagne (brouillon). */
export const createCampaign = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const c = data as {
      name: string;
      type: CampaignType;
      template_id?: string;
      subject?: string;
      body: string;
      segment_filter?: Record<string, unknown>;
    };
    if (!c.name || !c.body) throw new Error("Nom et contenu requis.");
    return c;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await rateLimit("create-campaign", 10))) throw new Error("Trop de demandes.");
    const { data: row, error } = await supabaseAdmin
      .from("marketing_campaigns" as never)
      .insert({
        name: data.name,
        type: data.type,
        template_id: data.template_id ?? null,
        subject: data.subject ?? null,
        body: data.body,
        segment_filter: JSON.stringify(data.segment_filter ?? {}),
        status: "draft",
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: (row as { id: string }).id };
  });

/** Supprime une campagne. */
export const deleteCampaign = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { id } = data as { id: string };
    return { id };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await rateLimit("delete-campaign", 10))) throw new Error("Trop de demandes.");
    const { error } = await supabaseAdmin
      .from("marketing_campaigns" as never)
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { deleted: true };
  });

/** Met à jour une campagne. */
export const updateCampaign = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { id, ...updates } = data as { id: string } & Partial<Campaign>;
    if (!id) throw new Error("id requis");
    return { id, updates };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await rateLimit("update-campaign", 10))) throw new Error("Trop de demandes.");
    const { error } = await supabaseAdmin
      .from("marketing_campaigns" as never)
      .update(data.updates as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { updated: true };
  });

/** Envoie une campagne (marque comme 'sending', crée les envois). */
export const sendCampaign = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { id } = data as { id: string };
    return { id };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await rateLimit("send-campaign", 5))) throw new Error("Trop de demandes.");

    // Récupérer la campagne
    const { data: campaign, error: cErr } = await supabaseAdmin
      .from("marketing_campaigns" as never)
      .select("*")
      .eq("id", data.id)
      .single();
    if (cErr || !campaign) throw new Error("Campagne introuvable.");
    if ((campaign as Campaign).status !== "draft") throw new Error("Campagne déjà envoyée.");

    // Récupérer les clients selon le filtre RFM
    const { data: segmentsRaw } = await supabaseAdmin.rpc("get_client_segments" as never);
    let clients = (segmentsRaw as ClientSegment[] | null) ?? [];
    const filter = JSON.parse((campaign as Campaign).segment_filter || "{}") as {
      segment?: string;
    };
    if (filter.segment && filter.segment !== "all") {
      clients = clients.filter((c) => c.segment === filter.segment);
    }

    // Filtrer ceux qui ont un email ou phone selon le type
    const type = (campaign as Campaign).type;
    const recipients = clients.filter((c) => (type === "email" ? !!c.email : !!c.phone));

    if (recipients.length === 0) {
      throw new Error("Aucun destinataire trouvé pour ce segment.");
    }

    // Marquer comme sending
    await supabaseAdmin
      .from("marketing_campaigns" as never)
      .update({ status: "sending", sent_count: recipients.length } as never)
      .eq("id", data.id);

    // Créer les envois individuels (en background, best-effort)
    const sends = recipients.map((r) => ({
      campaign_id: data.id,
      recipient_phone: r.phone ?? null,
      recipient_email: r.email ?? null,
      recipient_name: r.customer_name ?? null,
      status: "pending" as const,
    }));

    // Insérer en batch
    const { error: insertErr } = await supabaseAdmin
      .from("campaign_sends" as never)
      .insert(sends as never);
    if (insertErr) {
      console.error("[marketing] batch insert failed", insertErr);
    }

    // Marquer comme sent (le vrai envoi serait fait en background)
    await supabaseAdmin
      .from("marketing_campaigns" as never)
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      } as never)
      .eq("id", data.id);

    return { sent: recipients.length };
  });

/** Segments RFM. */
export const getClientSegments = createServerFn({ method: "GET" }).handler(
  async (): Promise<ClientSegment[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await rateLimit("client-segments", 10))) throw new Error("Trop de demandes.");
    const { data, error } = await supabaseAdmin.rpc("get_client_segments" as never);
    if (error) throw new Error(error.message);
    return (data as ClientSegment[]) ?? [];
  },
);

/** Compteurs par segment. */
export const getSegmentCounts = createServerFn({ method: "GET" }).handler(
  async (): Promise<SegmentCounts> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await rateLimit("segment-counts", 10))) throw new Error("Trop de demandes.");
    const { data, error } = await supabaseAdmin.rpc("get_segment_counts" as never);
    if (error) throw new Error(error.message);
    return (
      (data as SegmentCounts) ?? { vip: 0, loyal: 0, active: 0, new: 0, inactive: 0, total: 0 }
    );
  },
);
