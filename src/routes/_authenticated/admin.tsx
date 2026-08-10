import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { lazy, Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  History,
  Loader2,
  FileDown,
  KeyRound,
  MailPlus,
  LayoutGrid,
  FileText,
  Package,
  PieChart,
  RadioTower,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Users,
  Wrench,
  BadgeCheck,
  TrendingUp,
  Webhook,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PERIOD_LABEL, STATUS_LABEL, formatDateFr } from "@/lib/reservation-schema";
import { setReservationStatus } from "@/lib/admin.functions";
import { setDeliveryStatus } from "@/lib/delivery.functions";
import { verifyOtpLogin } from "@/lib/otp.functions";
import {
  downloadInvoicePdf,
  downloadReservationsCsv,
  downloadReservationsPdf,
} from "@/lib/invoice";
import { logAudit } from "@/lib/audit";
const StatsDashboard = lazy(() =>
  import("@/components/admin/StatsDashboard").then((m) => ({ default: m.StatsDashboard })),
);
const AdminMarketing = lazy(() =>
  import("@/components/admin/AdminMarketing").then((m) => ({ default: m.AdminMarketing })),
);
import { useI18n } from "@/lib/i18n/context";
import { exportReservationsCsv } from "@/lib/export.functions";
import type { Enums } from "@/integrations/supabase/types";
import {
  KanbanBoard,
  StageControls,
  StatusHistory,
  DeliveryBlock,
  QuotePanel,
  PhotoPanel,
  STATUSES,
  STATUS_TONE,
} from "@/components/admin/AdminKanban";
import { CsvExportButton, LeadsSection, ClaimsSection } from "@/components/admin/AdminLeadsClaims";
import { TeamSection } from "@/components/admin/AdminTeam";
import { SecuritySection } from "@/components/admin/AdminSecurity";
import { AnalyticsSection } from "@/components/admin/AdminAnalytics";
import { AnalyticsAdvanced } from "@/components/admin/AdminAnalyticsAdvanced";
import { ContentSection } from "@/components/admin/AdminContent";
import { KpisSection } from "@/components/admin/AdminKpis";
import { CatalogSection } from "@/components/admin/AdminCatalog";
import { OrdersSection } from "@/components/admin/AdminOrders";
import { RefundsSection } from "@/components/admin/AdminRefunds";
import { ReturnsSection } from "@/components/admin/AdminReturns";
import { AtelierBoard } from "@/components/admin/AdminAtelier";
import { AuditSection } from "@/components/admin/AdminAudit";
import { AdminWorkshops } from "@/components/admin/AdminWorkshops";
import { AdminSuppliers } from "@/components/admin/AdminSuppliers";
import { AdminReferrals } from "@/components/admin/AdminReferrals";
import { AdminChat } from "@/components/admin/AdminChat";
import { AdminAdvancedReports } from "@/components/admin/AdminAdvancedReports";
import { AdminInventory } from "@/components/admin/AdminInventory";
import { AdminSLA } from "@/components/admin/AdminSLA";
import { AdminSatisfaction } from "@/components/admin/AdminSatisfaction";
import { AdminInternalNotifs } from "@/components/admin/AdminInternalNotifs";
import { AdminKnowledgeBase } from "@/components/admin/AdminKnowledgeBase";
import { AdminWebhooks } from "@/components/admin/AdminWebhooks";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administration des dossiers — Allô Techno" },
      {
        name: "description",
        content:
          "Espace interne Allô Techno : mise à jour du statut des dossiers de réparation et historique des changements.",
      },
      { property: "og:title", content: "Administration des dossiers — Allô Techno" },
      {
        property: "og:description",
        content: "Gérez les statuts des réparations et consultez l'historique complet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  errorComponent: ({ error, reset }) => (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="w-full max-w-md border border-border bg-card p-8 text-center">
        <h2 className="at-display mb-2 text-2xl">Erreur d'administration</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {error?.message ?? "Une erreur est survenue."}
        </p>
        <button
          className="rounded-sm bg-primary px-4 py-2 text-sm text-primary-foreground"
          onClick={() => reset()}
        >
          Réessayer
        </button>
      </div>
    </div>
  ),
  component: AdminPage,
});

type Status = Enums<"reservation_status">;

const field =
  "h-11 w-full rounded-sm border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function AdminPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [filter, setFilter] = useState<Status | "toutes">("toutes");
  const [techFilter, setTechFilter] = useState<string>("tous");
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<"liste" | "kanban">("liste");
  const [tab, setTab] = useState<
    | "dossiers"
    | "atelier"
    | "equipe"
    | "leads"
    | "reclamations"
    | "analytics"
    | "analytics-advanced"
    | "securite"
    | "contenu"
    | "stats"
    | "kpis"
    | "catalogue"
    | "commandes"
    | "remboursements"
    | "retours"
    | "audit"
    | "ateliers"
    | "fournisseurs"
    | "parrainage"
    | "chat"
    | "rapports"
    | "inventaire"
    | "sla"
    | "satisfaction"
    | "notif-interne"
    | "kb"
    | "marketing"
    | "webhooks"
  >("dossiers");
  const [otpCode, setOtpCode] = useState("");
  const [otpUnlockedAt, setOtpUnlockedAt] = useState(() =>
    Number(sessionStorage.getItem("at-otp-unlocked") ?? 0),
  );

  const access = useQuery({
    queryKey: ["is-staff", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_staff", { _user_id: user.id });
      if (error) throw error;
      return Boolean(data);
    },
  });

  const role = useQuery({
    queryKey: ["my-role", user.id],
    queryFn: async () => {
      const { data: isTech, error: techError } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "technicien",
      });
      if (techError) throw techError;
      if (isTech) return "technicien";
      const { data: staff } = await supabase.rpc("is_staff", { _user_id: user.id });
      return staff ? "staff" : "user";
    },
  });
  const isTechnicien = role.data === "technicien";

  const assignments = useQuery({
    queryKey: ["assignments"],
    enabled: access.data === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("technician_assignments")
        .select("id, reservation_id, technician_id, assigned_by, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const technicians = useQuery({
    queryKey: ["technicians"],
    enabled: access.data === true && !isTechnicien,
    queryFn: async () => {
      const { data: roles, error: rError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "technicien");
      if (rError) throw rError;
      const ids = roles.map((r) => r.user_id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      if (error) throw error;
      return data;
    },
  });

  const assignTech = useMutation({
    mutationFn: async ({
      reservationId,
      technicianId,
    }: {
      reservationId: string;
      technicianId: string;
    }) => {
      const { error } = await supabase.from("technician_assignments").insert({
        reservation_id: reservationId,
        technician_id: technicianId || null,
        assigned_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Technicien assigné");
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      // Audit log
      void logAudit(supabase as never, {
        user_id: user.id,
        action: "reservation.assigned",
        entity: "reservation",
        details: {},
      });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Assignation impossible"),
  });

  const otpEnabled = useQuery({
    queryKey: ["otp-enabled", user.id],
    enabled: access.data === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_otp")
        .select("enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.enabled ?? false;
    },
  });

  const verifyOtpFn = useServerFn(verifyOtpLogin);
  const verifyOtp = useMutation({
    mutationFn: async (code: string) => verifyOtpFn({ data: { code } }),
    onSuccess: (ok) => {
      if (ok) {
        sessionStorage.setItem("at-otp-unlocked", String(Date.now()));
        setOtpUnlockedAt(Date.now());
        setOtpCode("");
      } else {
        toast.error("Code invalide ou expiré.");
      }
    },
    onError: () => toast.error("Vérification impossible"),
  });

  const otpRequired = otpEnabled.data === true && Date.now() - otpUnlockedAt > 24 * 3600 * 1000;

  const reservations = useQuery({
    queryKey: ["admin-reservations", isTechnicien ? user.id : "all"],
    enabled: access.data === true,
    queryFn: async () => {
      let query = supabase
        .from("reservations")
        .select(
          "id, reference, customer_name, phone, email, device, issue, mode, payment, slot_date, slot_period, slot_hour, status, delivery_status, delivery_address, staff_notes, created_at, assigned_technician_id",
        )
        .order("slot_date", { ascending: false })
        .limit(200);
      if (isTechnicien) {
        query = query.eq("assigned_technician_id" as never, user.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: Status; note?: string }) => {
      await setReservationStatus({ data: { id, status, note: note || undefined } });
    },
    onSuccess: (_d, vars) => {
      toast.success(`Statut mis à jour : ${STATUS_LABEL[vars.status]}`);
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["status-history"] });
      // Audit log
      void logAudit(supabase as never, {
        user_id: user.id,
        action: vars.status === "annulee" ? "reservation.cancelled" : "reservation.status_changed",
        entity: "reservation",
        entity_id: vars.id,
        details: { status: vars.status, note: vars.note },
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Mise à jour impossible";
      if (message.includes("code d'authentification")) {
        // La 2FA a expiré côté serveur : on re-demande le code OTP.
        sessionStorage.removeItem("at-otp-unlocked");
        setOtpUnlockedAt(0);
        toast.error("Veuillez confirmer votre code d'authentification.");
      } else {
        toast.error(message);
      }
    },
  });

  const setDeliveryStatusFn = useServerFn(setDeliveryStatus);
  const updateDelivery = useMutation({
    mutationFn: async ({
      reservationId,
      status,
      address,
    }: {
      reservationId: string;
      status: Enums<"delivery_status">;
      address?: string;
    }) => {
      await setDeliveryStatusFn({ data: { reservationId, status, address } });
    },
    onSuccess: () => {
      toast.success("Statut de livraison mis à jour");
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Mise à jour impossible"),
  });

  // Flux temps réel : toute modification faite par un autre technicien remonte immédiatement.
  useEffect(() => {
    if (access.data !== true) return;
    const channel = supabase
      .channel("admin-reservations-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservation_status_history" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["status-history"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [access.data, queryClient]);

  const claimAdmin = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("claim_first_admin");
      if (error) throw error;
      return Boolean(data);
    },
    onSuccess: (granted) => {
      if (granted) {
        toast.success("Vous êtes maintenant administrateur");
        queryClient.invalidateQueries({ queryKey: ["is-staff", user.id] });
      } else {
        toast.error("Un administrateur existe déjà : demandez-lui de vous ajouter.");
      }
    },
    onError: () => toast.error("Action impossible"),
  });

  if (access.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!access.data) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <ShieldAlert className="size-10 text-destructive" />
        <h1 className="text-2xl font-semibold">Accès réservé au personnel</h1>
        <p className="text-sm text-muted-foreground">
          Votre compte n'a pas les droits d'administration sur les dossiers de réparation.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button disabled={claimAdmin.isPending} onClick={() => claimAdmin.mutate()}>
            Devenir administrateur
          </Button>
          <Button asChild variant="outline">
            <Link to="/mon-compte">Retour à mon compte</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Cette action n'est possible que tant qu'aucun administrateur n'existe.
        </p>
      </div>
    );
  }

  if (otpRequired) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
        <KeyRound className="size-10 text-primary" />
        <h1 className="text-2xl font-semibold">Double authentification</h1>
        <p className="text-sm text-muted-foreground">
          Votre compte est protégé par un code à 6 chiffres généré par votre application
          d'authentification.
        </p>
        <label htmlFor="otp-code" className="sr-only">
          Code OTP
        </label>
        <input
          id="otp-code"
          className={`${field} w-full max-w-xs text-center font-mono text-lg tracking-widest`}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && otpCode.length === 6 && !verifyOtp.isPending) {
              verifyOtp.mutate(otpCode);
            }
          }}
        />
        <Button
          disabled={verifyOtp.isPending || otpCode.length !== 6}
          onClick={() => verifyOtp.mutate(otpCode)}
        >
          {verifyOtp.isPending ? "Vérification…" : "Déverrouiller"}
        </Button>
      </div>
    );
  }

  const latestTechByReservation = new Map<
    string,
    { technician_id: string | null; created_at: string }
  >();
  for (const a of assignments.data ?? []) {
    if (!latestTechByReservation.has(a.reservation_id)) {
      latestTechByReservation.set(a.reservation_id, {
        technician_id: a.technician_id,
        created_at: a.created_at,
      });
    }
  }
  const technicianName = new Map(
    (technicians.data ?? []).map((t) => [t.id, t.full_name ?? "Technicien"]),
  );

  const rows = (reservations.data ?? []).filter((r) => {
    const matchStatus = filter === "toutes" || r.status === filter;
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q ||
      r.reference.toLowerCase().includes(q) ||
      r.customer_name.toLowerCase().includes(q) ||
      r.device.toLowerCase().includes(q) ||
      r.issue.toLowerCase().includes(q);
    const assignedTech = latestTechByReservation.get(r.id)?.technician_id ?? "";
    const matchTech =
      techFilter === "tous" ||
      (techFilter === "non-assigne" ? !assignedTech : assignedTech === techFilter);
    const matchDateFrom = !dateFrom || r.slot_date >= dateFrom;
    const matchDateTo = !dateTo || r.slot_date <= dateTo;
    return matchStatus && matchQuery && matchTech && matchDateFrom && matchDateTo;
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Espace interne</p>
          <span className="inline-flex items-center gap-2 rounded-full border border-success/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-success">
            <RadioTower className="size-3 animate-pulse" />
            Temps réel
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-semibold">Administration des dossiers</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Mettez à jour le statut d'une réparation et consultez l'historique des changements.
        </p>
        {isTechnicien && (
          <p className="mt-1 text-xs font-medium text-primary">{t("admin.view.technician")}</p>
        )}
      </header>

      <div className="mb-8 flex flex-wrap gap-2">
        <Button
          variant={tab === "dossiers" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("dossiers")}
        >
          <RadioTower className="mr-2 size-4" />
          Dossiers
        </Button>
        <Button
          variant={tab === "atelier" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("atelier")}
        >
          <Wrench className="mr-2 size-4" />
          Atelier
        </Button>
        <Button
          variant={tab === "equipe" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("equipe")}
        >
          <Users className="mr-2 size-4" />
          Équipe
        </Button>
        <Button
          variant={tab === "leads" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("leads")}
        >
          <MailPlus className="mr-2 size-4" />
          Leads
        </Button>
        <Button
          variant={tab === "reclamations" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("reclamations")}
        >
          <BadgeCheck className="mr-2 size-4" />
          Réclamations
        </Button>
        <Button
          variant={tab === "analytics" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("analytics")}
        >
          <BarChart3 className="mr-2 size-4" />
          Analytics
        </Button>
        <Button
          variant={tab === "analytics-advanced" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("analytics-advanced")}
        >
          <TrendingUp className="mr-2 size-4" />
          Funnel
        </Button>
        <Button
          variant={tab === "stats" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("stats")}
        >
          <PieChart className="mr-2 size-4" />
          {t("admin.stats.tab")}
        </Button>
        <Button
          variant={tab === "kpis" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("kpis")}
        >
          <TrendingUp className="mr-2 size-4" />
          KPI avancés
        </Button>
        <Button
          variant={tab === "securite" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("securite")}
        >
          <ShieldCheck className="mr-2 size-4" />
          Sécurité
        </Button>
        <Button
          variant={tab === "contenu" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("contenu")}
        >
          <FileText className="mr-2 size-4" />
          Contenu
        </Button>
        <Button
          variant={tab === "catalogue" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("catalogue")}
        >
          <Package className="mr-2 size-4" />
          Catalogue
        </Button>
        <Button
          variant={tab === "commandes" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("commandes")}
        >
          <ShoppingCart className="mr-2 size-4" />
          Commandes
        </Button>
        <Button
          variant={tab === "remboursements" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("remboursements")}
        >
          <RotateCcw className="mr-2 size-4" />
          Remboursements
        </Button>
        <Button
          variant={tab === "retours" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("retours")}
        >
          <RotateCcw className="mr-2 size-4" />
          Retours
        </Button>
        <Button
          variant={tab === "audit" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("audit")}
        >
          <History className="mr-2 size-4" />
          {t("admin.audit.title")}
        </Button>
        <Button
          variant={tab === "ateliers" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("ateliers")}
        >
          <Wrench className="mr-2 size-4" />
          Ateliers
        </Button>
        <Button
          variant={tab === "fournisseurs" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("fournisseurs")}
        >
          <Package className="mr-2 size-4" />
          Fournisseurs
        </Button>
        <Button
          variant={tab === "parrainage" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("parrainage")}
        >
          <Users className="mr-2 size-4" />
          Parrainage
        </Button>
        <Button
          variant={tab === "chat" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("chat")}
        >
          <MailPlus className="mr-2 size-4" />
          Chat
        </Button>
        <Button
          variant={tab === "rapports" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("rapports")}
        >
          <BarChart3 className="mr-2 size-4" />
          Rapports
        </Button>
        <Button
          variant={tab === "inventaire" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("inventaire")}
        >
          <Package className="mr-2 size-4" />
          Inventaire
        </Button>
        <Button
          variant={tab === "sla" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("sla")}
        >
          <BarChart3 className="mr-2 size-4" />
          SLA
        </Button>
        <Button
          variant={tab === "satisfaction" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("satisfaction")}
        >
          <TrendingUp className="mr-2 size-4" />
          Satisfaction
        </Button>
        <Button
          variant={tab === "notif-interne" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("notif-interne")}
        >
          <MailPlus className="mr-2 size-4" />
          Notifs
        </Button>
        <Button
          variant={tab === "kb" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("kb")}
        >
          <FileText className="mr-2 size-4" />
          KB
        </Button>
        <Button
          variant={tab === "marketing" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("marketing")}
        >
          <MailPlus className="mr-2 size-4" />
          Marketing
        </Button>
        <Button
          variant={tab === "webhooks" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("webhooks")}
        >
          <Webhook className="mr-2 size-4" />
          Webhooks
        </Button>
      </div>

      {tab === "dossiers" && (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <label htmlFor="admin-search" className="sr-only">
              Rechercher
            </label>
            <input
              id="admin-search"
              className={field}
              placeholder={t("admin.filters.search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <label htmlFor="filter-status" className="sr-only">
              {t("admin.filters.status")}
            </label>
            <select
              id="filter-status"
              className={field}
              value={filter}
              onChange={(e) => setFilter(e.target.value as Status | "toutes")}
            >
              <option value="toutes">{t("admin.filters.all")}</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            {!isTechnicien && (
              <>
                <label htmlFor="filter-tech" className="sr-only">
                  Filtrer par technicien
                </label>
                <select
                  id="filter-tech"
                  className={field}
                  value={techFilter}
                  onChange={(e) => setTechFilter(e.target.value)}
                >
                  <option value="tous">Tous les techniciens</option>
                  <option value="non-assigne">Non assigné</option>
                  {(technicians.data ?? []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name ?? "Technicien"}
                    </option>
                  ))}
                </select>
              </>
            )}
            <div className="flex items-center gap-2">
              <label htmlFor="filter-date-from" className="sr-only">
                {t("admin.filters.date_from")}
              </label>
              <input
                id="filter-date-from"
                type="date"
                className={field}
                placeholder={t("admin.filters.date_from")}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <label htmlFor="filter-date-to" className="sr-only">
                {t("admin.filters.date_to")}
              </label>
              <input
                id="filter-date-to"
                type="date"
                className={field}
                placeholder={t("admin.filters.date_to")}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView(view === "liste" ? "kanban" : "liste")}
            >
              <LayoutGrid className="size-4" />
              {view === "liste" ? "Vue Kanban" : "Vue liste"}
            </Button>
          </div>

          {(filter !== "toutes" || query || dateFrom || dateTo || techFilter !== "tous") && (
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {t("admin.filters.results", [rows.length])}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilter("toutes");
                  setQuery("");
                  setDateFrom("");
                  setDateTo("");
                  setTechFilter("tous");
                }}
              >
                {t("admin.filters.clear")}
              </Button>
            </div>
          )}

          {view === "kanban" ? (
            <KanbanBoard rows={rows} updateStatus={updateStatus.mutate} />
          ) : (
            <>
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <CsvExportButton
                  serverFn={exportReservationsCsv}
                  filenamePrefix="dossiers"
                  label={t("admin.export.dossiers")}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={rows.length === 0}
                  onClick={() => downloadReservationsCsv(rows)}
                >
                  <FileDown className="mr-2 size-4" />
                  Exporter CSV ({rows.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={rows.length === 0}
                  onClick={() => downloadReservationsPdf(rows)}
                >
                  <FileDown className="mr-2 size-4" />
                  Exporter PDF ({rows.length})
                </Button>
                <span className="text-xs text-muted-foreground">
                  Export des dossiers affichés (filtres appliqués)
                </span>
              </div>

              {reservations.isLoading ? (
                <p className="text-sm text-muted-foreground">Chargement des dossiers…</p>
              ) : rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun dossier ne correspond à ce filtre.
                </p>
              ) : (
                <ul className="space-y-4">
                  {rows.map((r) => (
                    <li key={r.id} className="rounded-sm border border-border bg-card p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="font-mono text-sm text-muted-foreground">{r.reference}</p>
                          <h2 className="text-lg font-semibold">
                            {r.customer_name} — {r.device}
                          </h2>
                          <p className="mt-1 text-sm text-muted-foreground">{r.issue}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDateFr(r.slot_date)} · {PERIOD_LABEL[r.slot_period]} · {r.phone}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs ${STATUS_TONE[r.status] ?? ""}`}
                        >
                          {STATUS_LABEL[r.status]}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadInvoicePdf(r)}
                          aria-label={`Reçu PDF du dossier ${r.reference}`}
                        >
                          <FileDown className="size-4" />
                        </Button>
                      </div>

                      <StageControls
                        current={r.status}
                        pending={updateStatus.isPending}
                        onApply={(status, note) => updateStatus.mutate({ id: r.id, status, note })}
                        historyOpen={openId === r.id}
                        onToggleHistory={() => setOpenId(openId === r.id ? null : r.id)}
                      />

                      {!isTechnicien && (
                        <QuotePanel
                          reservationId={r.id}
                          reference={r.reference}
                          customer_name={r.customer_name}
                          phone={r.phone}
                          email={r.email}
                          device={r.device}
                          issue={r.issue}
                          created_at={r.created_at}
                        />
                      )}

                      {!isTechnicien && <PhotoPanel reservationId={r.id} />}
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                        <Wrench className="size-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Technicien :</span>
                        {isTechnicien ? (
                          <strong>
                            {latestTechByReservation.get(r.id)?.technician_id === user.id
                              ? "Vous"
                              : "Non assigné à vous"}
                          </strong>
                        ) : (
                          <select
                            className={`${field} max-w-56 py-1.5 text-xs`}
                            value={latestTechByReservation.get(r.id)?.technician_id ?? ""}
                            disabled={assignTech.isPending}
                            onChange={(e) =>
                              assignTech.mutate({
                                reservationId: r.id,
                                technicianId: e.target.value,
                              })
                            }
                          >
                            <option value="">Non assigné</option>
                            {(technicians.data ?? []).map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.full_name ?? "Technicien"}
                              </option>
                            ))}
                          </select>
                        )}
                        <span className="text-muted-foreground">
                          {latestTechByReservation.get(r.id)
                            ? (technicianName.get(
                                latestTechByReservation.get(r.id)?.technician_id ?? "",
                              ) ?? "")
                            : ""}
                        </span>
                      </div>

                      {r.mode === "domicile" && !isTechnicien && (
                        <DeliveryBlock
                          r={r}
                          pending={updateDelivery.isPending}
                          onUpdate={(v) => updateDelivery.mutate(v)}
                        />
                      )}

                      {openId === r.id ? <StatusHistory reservationId={r.id} /> : null}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </>
      )}

      {tab === "atelier" && <AtelierBoard />}
      {tab === "equipe" && <TeamSection />}
      {tab === "leads" && <LeadsSection />}
      {tab === "reclamations" && <ClaimsSection />}
      {tab === "analytics" && <AnalyticsSection />}
      {tab === "analytics-advanced" && <AnalyticsAdvanced />}
      {tab === "securite" && <SecuritySection />}
      {tab === "contenu" && <ContentSection />}
      {tab === "stats" && (
        <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
          <StatsDashboard />
        </Suspense>
      )}
      {tab === "kpis" && <KpisSection />}
      {tab === "catalogue" && <CatalogSection />}
      {tab === "commandes" && <OrdersSection />}
      {tab === "remboursements" && <RefundsSection />}
      {tab === "retours" && <ReturnsSection />}
      {tab === "audit" && <AuditSection />}
      {tab === "ateliers" && <AdminWorkshops />}
      {tab === "fournisseurs" && <AdminSuppliers />}
      {tab === "parrainage" && <AdminReferrals />}
      {tab === "chat" && <AdminChat />}
      {tab === "rapports" && <AdminAdvancedReports />}
      {tab === "inventaire" && <AdminInventory />}
      {tab === "sla" && <AdminSLA />}
      {tab === "satisfaction" && <AdminSatisfaction />}
      {tab === "notif-interne" && <AdminInternalNotifs />}
      {tab === "kb" && <AdminKnowledgeBase />}
      {tab === "marketing" && (
        <Suspense fallback={<Loader2 className="size-4 animate-spin" />}>
          <AdminMarketing />
        </Suspense>
      )}
      {tab === "webhooks" && (
        <Suspense fallback={<Loader2 className="size-4 animate-spin" />}>
          <AdminWebhooks />
        </Suspense>
      )}
    </div>
  );
}
