import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
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
  Pencil,
  PieChart,
  Plus,
  RadioTower,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Users,
  Wrench,
  Banknote,
  ImagePlus,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { QrCode } from "@/components/site/QrCode";
import { Stars } from "@/components/site/Blocks";
import { ACCESSORIES, formatFcfa } from "@/data/catalog";
import { PERIOD_LABEL, STATUS_LABEL, formatDateFr } from "@/lib/reservation-schema";
import {
  ATELIER_STATUSES,
  assignTechnician,
  getAdminKpis,
  getAtelierBoard,
  getReservationQuote,
  setReservationStatus,
  type AtelierCard,
  type AtelierTechnician,
} from "@/lib/admin.functions";
import { setDeliveryStatus } from "@/lib/delivery.functions";
import { confirmOtp, disableOtp, enrollOtp, verifyOtpLogin } from "@/lib/otp.functions";
import { sendQuote } from "@/lib/quote.functions";
import { addStagePhoto, getStaffPhotoUpload } from "@/lib/photos.functions";
import {
  deleteBlogPost,
  deleteReview,
  setInventory,
  upsertBlogPost,
  upsertReview,
  type BlogPost,
} from "@/lib/content.functions";
import {
  downloadInvoicePdf,
  downloadQuotePdf,
  downloadReservationsCsv,
  downloadReservationsPdf,
} from "@/lib/invoice";
const StatsDashboard = lazy(() =>
  import("@/components/admin/StatsDashboard").then((m) => ({ default: m.StatsDashboard })),
);
import { useI18n } from "@/lib/i18n/context";
import { exportLeadsCsv, exportPaymentsCsv, exportReservationsCsv } from "@/lib/export.functions";
import {
  listWarrantyClaims,
  setWarrantyClaimStatus,
  type ClaimStatus,
  type WarrantyClaimRow,
} from "@/lib/claims.functions";
import {
  addCatalogPhoto,
  deleteBrand,
  deleteCatalogPhoto,
  deleteCategory,
  deleteDevice,
  deleteFault,
  getCatalogUpload,
  listCatalog,
  upsertBrand,
  upsertCategory,
  upsertDevice,
  upsertFault,
  type CatalogBrand,
  type CatalogCategory,
  type CatalogDevice,
  type CatalogFault,
  type CatalogPhoto,
} from "@/lib/catalog.functions";
import { getSecurityStats } from "@/lib/security.functions";
import { getMetrics } from "@/lib/monitoring.functions";
import {
  createReturn,
  listReturns,
  setReturnStatus,
  type ReturnRow,
  type ReturnStatus,
} from "@/lib/returns.functions";
import { Badge } from "@/components/ui/badge";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import "@/lib/i18n/segments/admin";
import "@/lib/i18n/segments/reservation";
import type { Enums } from "@/integrations/supabase/types";

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

const STATUSES: Status[] = [
  "en_attente",
  "confirmee",
  "pieces",
  "en_cours",
  "pret",
  "livre",
  "terminee",
  "annulee",
];

const NEXT_STATUS: Partial<Record<Status, Status>> = {
  en_attente: "confirmee",
  confirmee: "pieces",
  pieces: "en_cours",
  en_cours: "pret",
  pret: "livre",
};

const STATUS_TONE: Record<string, string> = {
  en_attente: "border-border text-muted-foreground",
  confirmee: "border-primary/50 text-primary",
  pieces: "border-amber-500/50 text-amber-500",
  en_cours: "border-primary/50 text-primary",
  pret: "border-success/50 text-success",
  livre: "border-success/50 text-success",
  terminee: "border-success/50 text-success",
  annulee: "border-destructive/50 text-destructive",
};

const DELIVERY_STATUS_LABEL: Record<Enums<"delivery_status">, string> = {
  non_applicable: "Non applicable",
  a_planifier: "À planifier",
  en_route: "En route",
  livre: "Livré",
};

const QUOTE_STATUS_LABEL: Record<string, string> = {
  none: "Aucun devis",
  sent: "Devis envoyé (en attente de validation)",
  approved: "Devis approuvé",
  declined: "Devis refusé",
};

const PHOTO_STAGE_LABEL: Record<string, string> = {
  diagnostic: "Diagnostic",
  pieces: "Pièces",
  repair: "Réparation",
};

const field =
  "h-11 w-full rounded-sm border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring";

/** Déclenche le téléchargement d'une chaîne CSV via un Blob. */
function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

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
    | "securite"
    | "contenu"
    | "stats"
    | "kpis"
    | "catalogue"
    | "commandes"
    | "retours"
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
    queryKey: ["admin-reservations"],
    enabled: access.data === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select(
          "id, reference, customer_name, phone, email, device, issue, mode, payment, slot_date, slot_period, slot_hour, status, delivery_status, delivery_address, staff_notes, created_at",
        )
        .order("slot_date", { ascending: false })
        .limit(200);
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
          variant={tab === "retours" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("retours")}
        >
          <RotateCcw className="mr-2 size-4" />
          Retours
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
      {tab === "retours" && <ReturnsSection />}
    </div>
  );
}

function StatusHistory({ reservationId }: { reservationId: string }) {
  return <StatusHistoryList reservationId={reservationId} />;
}

function DeliveryBlock({
  r,
  pending,
  onUpdate,
}: {
  r: { id: string; delivery_status: Enums<"delivery_status">; delivery_address: string | null };
  pending: boolean;
  onUpdate: (v: {
    reservationId: string;
    status: Enums<"delivery_status">;
    address?: string;
  }) => void;
}) {
  const [address, setAddress] = useState(r.delivery_address ?? "");
  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">Livraison :</span>
        <select
          className={`${field} max-w-44 py-1.5 text-xs`}
          value={r.delivery_status}
          disabled={pending}
          onChange={(e) =>
            onUpdate({
              reservationId: r.id,
              status: e.target.value as Enums<"delivery_status">,
              ...(r.delivery_address ? { address: r.delivery_address } : {}),
            })
          }
        >
          {Object.entries(DELIVERY_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {r.delivery_address ? (
        <p className="mt-1 text-xs text-muted-foreground">{r.delivery_address}</p>
      ) : r.delivery_status === "a_planifier" ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            className={`${field} max-w-64 py-1.5 text-xs`}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Adresse d'enlèvement / livraison"
          />
          <Button
            size="sm"
            disabled={pending || !address.trim()}
            onClick={() =>
              onUpdate({
                reservationId: r.id,
                status: r.delivery_status,
                ...(address.trim() ? { address: address.trim() } : {}),
              })
            }
          >
            Enregistrer l'adresse
          </Button>
        </div>
      ) : null}
    </div>
  );
}

type KanbanRow = {
  id: string;
  reference: string;
  customer_name: string;
  device: string;
  phone: string;
  slot_date: string;
  slot_period: Enums<"slot_period">;
  status: Status;
};

function KanbanBoard({
  rows,
  updateStatus,
}: {
  rows: KanbanRow[];
  updateStatus: (v: { id: string; status: Status }) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<Status | null>(null);

  return (
    <div className="grid gap-px border border-border bg-border lg:grid-cols-4">
      {STATUSES.map((status) => {
        const columnRows = rows.filter((r) => r.status === status);
        const active = overCol === status;
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              if (active) return;
              setOverCol(status);
            }}
            onDragLeave={() => setOverCol((c) => (c === status ? null : c))}
            onDrop={(e) => {
              e.preventDefault();
              setOverCol(null);
              if (dragId) updateStatus({ id: dragId, status });
              setDragId(null);
            }}
            className={`min-h-[18rem] bg-card p-3 transition-colors ${
              active ? "bg-primary/5" : ""
            }`}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <span
                className={`rounded-full border px-3 py-1 text-xs ${STATUS_TONE[status] ?? ""}`}
              >
                {STATUS_LABEL[status]}
              </span>
              <span className="font-mono text-xs text-muted-foreground">{columnRows.length}</span>
            </div>
            <div className="space-y-2">
              {columnRows.map((r) => (
                <button
                  key={r.id}
                  draggable
                  onDragStart={() => setDragId(r.id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverCol(null);
                  }}
                  className="block w-full cursor-grab rounded-sm border border-border bg-surface p-3 text-left transition-shadow hover:shadow-md active:cursor-grabbing"
                >
                  <p className="font-mono text-[10px] text-muted-foreground">{r.reference}</p>
                  <p className="mt-1 text-sm font-semibold leading-snug">
                    {r.customer_name} — {r.device}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatDateFr(r.slot_date)} · {PERIOD_LABEL[r.slot_period]} · {r.phone}
                  </p>
                </button>
              ))}
              {columnRows.length === 0 && (
                <p className="rounded-sm border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                  Aucun dossier
                </p>
              )}
            </div>
          </div>
        );
      })}
      <p className="bg-card p-3 text-xs text-muted-foreground sm:col-span-2 lg:col-span-4">
        Glissez-déposez une carte dans une autre colonne pour changer son statut. Les changements
        sont enregistrés immédiatement et notifiés à l'équipe.
      </p>
    </div>
  );
}

function StageControls({
  current,
  pending,
  onApply,
  historyOpen,
  onToggleHistory,
}: {
  current: Status;
  pending: boolean;
  onApply: (status: Status, note: string) => void;
  historyOpen: boolean;
  onToggleHistory: () => void;
}) {
  const [status, setStatus] = useState<Status>(current);
  const [note, setNote] = useState("");
  const next = NEXT_STATUS[current];
  const dirty = status !== current;

  useEffect(() => {
    setStatus(current);
  }, [current]);

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <select
          className={`${field} max-w-xs`}
          value={status}
          disabled={pending}
          onChange={(e) => setStatus(e.target.value as Status)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          disabled={pending || !dirty}
          onClick={() => {
            onApply(status, note);
            setNote("");
          }}
        >
          Appliquer
        </Button>
        {next ? (
          <Button
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => {
              onApply(next, note);
              setNote("");
            }}
          >
            Passer à « {STATUS_LABEL[next]} »
          </Button>
        ) : null}
        <Button variant="outline" size="sm" onClick={onToggleHistory}>
          <History className="mr-2 size-4" />
          {historyOpen ? "Masquer l'historique" : "Historique"}
        </Button>
      </div>
      <textarea
        className="min-h-16 w-full rounded-sm border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        placeholder="Note visible par le client (ex. : pièce commandée, écran remplacé…)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
    </div>
  );
}

function StatusHistoryList({ reservationId }: { reservationId: string }) {
  const history = useQuery({
    queryKey: ["status-history", reservationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservation_status_history")
        .select("id, old_status, new_status, note, created_at")
        .eq("reservation_id", reservationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (history.isLoading) {
    return <p className="mt-4 text-sm text-muted-foreground">Chargement de l'historique…</p>;
  }

  const rows = history.data ?? [];
  if (rows.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">Aucun changement enregistré.</p>;
  }

  return (
    <ol className="mt-4 space-y-2 border-t border-border pt-4">
      {rows.map((h) => (
        <li key={h.id} className="flex flex-wrap items-baseline gap-2 text-sm">
          <time className="font-mono text-xs text-muted-foreground">
            {new Date(h.created_at).toLocaleString("fr-FR")}
          </time>
          <span>
            {h.old_status ? `${STATUS_LABEL[h.old_status]} → ` : "Création : "}
            <strong>{STATUS_LABEL[h.new_status]}</strong>
          </span>
          {h.note ? <span className="text-muted-foreground">— {h.note}</span> : null}
        </li>
      ))}
    </ol>
  );
}

const PHOTO_STAGES = ["diagnostic", "pieces", "repair"] as const;

/**
 * Devis à valider par le client : l'atelier fixe le montant (FCFA) et la durée
 * de garantie étendue, puis envoie la demande (e-mail + WhatsApp) au client.
 */
function QuotePanel({
  reservationId,
  reference,
  customer_name,
  phone,
  email,
  device,
  issue,
  created_at,
}: {
  reservationId: string;
  reference: string;
  customer_name: string;
  phone: string;
  email: string | null;
  device: string;
  issue: string;
  created_at: string;
}) {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const getQuoteFn = useServerFn(getReservationQuote);
  const sendQuoteFn = useServerFn(sendQuote);
  const [amount, setAmount] = useState("");
  const [warranty, setWarranty] = useState(0);

  const quote = useQuery({
    queryKey: ["reservation-quote", reservationId],
    enabled: Boolean(reservationId),
    queryFn: () => getQuoteFn({ data: { reservationId } }),
  });

  const send = useMutation({
    mutationFn: async () => {
      const parsed = Number(amount);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 50_000_000) {
        throw new Error("Montant invalide (0 à 50 000 000 FCFA).");
      }
      // Garantie étendue (+15 %) — le warranty sélecteur gère déjà 0/6/12
      const finalAmount = warranty === 12 ? Math.round(parsed * 1.15) : Math.round(parsed);
      await sendQuoteFn({
        data: { reservationId, amount: finalAmount, warrantyMonths: warranty },
      });
    },
    onSuccess: () => {
      toast.success("Devis envoyé au client");
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["reservation-quote", reservationId] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Envoi du devis impossible"),
  });

  const status = quote.data?.quote_status ?? "none";
  const sentAmount = quote.data?.quote_amount;

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Banknote className="size-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">Devis :</span>
        <span className="font-medium">{QUOTE_STATUS_LABEL[status] ?? status}</span>
        {sentAmount != null && (
          <span className="font-mono text-muted-foreground">{formatFcfa(sentAmount)}</span>
        )}
        {quote.data && quote.data.warranty_months > 0 && (
          <span className="text-muted-foreground">
            ·{" "}
            {quote.data.warranty_months >= 12
              ? t("reservation.warranty.extended")
              : t("reservation.warranty.standard")}
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label
            htmlFor={`quote-amount-${reservationId}`}
            className="mb-1 block text-[11px] text-muted-foreground"
          >
            Montant (FCFA)
          </label>
          <input
            id={`quote-amount-${reservationId}`}
            type="number"
            min={0}
            step={500}
            className={`${field} max-w-40 py-1.5 text-xs`}
            placeholder="ex. 45000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor={`quote-warranty-${reservationId}`}
            className="mb-1 block text-[11px] text-muted-foreground"
          >
            Garantie étendue
          </label>
          <select
            id={`quote-warranty-${reservationId}`}
            className={`${field} max-w-48 py-1.5 text-xs`}
            value={warranty}
            onChange={(e) => setWarranty(Number(e.target.value))}
          >
            <option value={0}>{t("reservation.warranty.standard")}</option>
            <option value={12}>{t("reservation.warranty.extended")}</option>
          </select>
        </div>
        <Button
          size="sm"
          variant="secondary"
          disabled={send.isPending || !amount.trim()}
          onClick={() => send.mutate()}
        >
          {send.isPending ? "Envoi…" : "Envoyer le devis"}
        </Button>
        {sentAmount != null && sentAmount > 0 && (
          <Button
            size="sm"
            variant="technicalOutline"
            onClick={() =>
              downloadQuotePdf({
                reference,
                customer_name,
                phone,
                email,
                device,
                issue,
                quote_amount: sentAmount,
                warranty_months: quote.data?.warranty_months ?? 0,
                quote_token: quote.data?.quote_token ?? "",
                created_at,
              })
            }
            aria-label={`Devis PDF du dossier ${reference}`}
          >
            <FileDown className="mr-1 size-3.5" />
            PDF
          </Button>
        )}
      </div>
    </div>
  );
}

/** Photos de suivi par étape : l'atelier téléverse une photo puis la rattache au dossier. */
function PhotoPanel({ reservationId }: { reservationId: string }) {
  const getUpload = useServerFn(getStaffPhotoUpload);
  const addPhoto = useServerFn(addStagePhoto);
  const [busyStage, setBusyStage] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: async ({ stage, file }: { stage: string; file: File }) => {
      setBusyStage(stage);
      try {
        const prepared = await getUpload({
          data: {
            reservationId,
            stage: stage as "diagnostic" | "pieces" | "repair",
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size,
          },
        });
        const put = await fetch(prepared.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type, "x-upsert": "false" },
          body: file,
        });
        if (!put.ok) throw new Error(`Upload ${put.status}`);
        await addPhoto({
          data: {
            reservationId,
            stage: stage as "diagnostic" | "pieces" | "repair",
            url: prepared.path,
          },
        });
      } finally {
        setBusyStage(null);
      }
    },
    onSuccess: (_d, vars) => {
      toast.success(`Photo « ${PHOTO_STAGE_LABEL[vars.stage] ?? vars.stage} » ajoutée au dossier`);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Upload impossible";
      if (message.includes("code d'authentification")) {
        toast.error("Veuillez confirmer votre code d'authentification.");
      } else {
        toast.error(message);
      }
    },
  });

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <ImagePlus className="size-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">Photos de suivi :</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        {PHOTO_STAGES.map((stage) => (
          <label
            key={stage}
            className="flex cursor-pointer items-center gap-2 rounded-sm border border-border px-3 py-1.5 text-xs hover:bg-surface"
          >
            <span className="text-muted-foreground">{PHOTO_STAGE_LABEL[stage]}</span>
            {busyStage === stage ? (
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            ) : (
              <span className="text-primary underline">Ajouter</span>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              className="sr-only"
              disabled={busyStage !== null}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload.mutate({ stage, file });
                e.target.value = "";
              }}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrateur",
  staff: "Personnel atelier",
  technicien: "Technicien",
  user: "Client",
};

const LEAD_SOURCE_LABEL: Record<string, string> = {
  devis: "Devis",
  contact: "Contact",
  suivi: "Assistance",
  boutique: "Commande boutique",
};

const LEAD_STATUS_LABEL: Record<string, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  clos: "Clôturé",
};

/** Bouton « Exporter CSV » : appelle une server function et télécharge le résultat. */
function CsvExportButton({
  serverFn,
  filenamePrefix,
  label,
}: {
  serverFn: typeof exportReservationsCsv;
  filenamePrefix: string;
  label: string;
}) {
  const { t } = useI18n();
  const fn = useServerFn(serverFn);
  const [pending, setPending] = useState(false);

  const run = async () => {
    setPending(true);
    try {
      const res = await fn();
      const date = new Date().toISOString().slice(0, 10);
      downloadCsv(res.csv, `${filenamePrefix}-${date}.csv`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.export.error"));
    } finally {
      setPending(false);
    }
  };

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={run}>
      {pending ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <FileDown className="mr-2 size-4" />
      )}
      {label}
    </Button>
  );
}

function ExportPaymentsButton() {
  const fn = useServerFn(exportPaymentsCsv);
  const [pending, setPending] = useState(false);

  const run = async () => {
    setPending(true);
    try {
      const res = await fn();
      const date = new Date().toISOString().slice(0, 10);
      downloadCsv(res.csv, `paiements-allotechno-${date}.csv`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export impossible");
    } finally {
      setPending(false);
    }
  };

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={run}>
      {pending ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <FileDown className="mr-2 size-4" />
      )}
      Export paiements
    </Button>
  );
}

function LeadsSection() {
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const leads = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, source, reference, name, phone, email, message, status, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Mise à jour impossible"),
  });

  if (leads.isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement des demandes…</p>;
  }

  const rows = leads.data ?? [];
  if (rows.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold">Leads</h2>
        <p className="mt-4 text-sm text-muted-foreground">
          Les demandes de devis et messages de contact apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">Leads</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Devis, contacts et demandes d'assistance reçus via le site.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <CsvExportButton
          serverFn={exportLeadsCsv}
          filenamePrefix="leads"
          label={t("admin.export.leads")}
        />
      </div>
      <ul className="mt-6 space-y-3">
        {rows.map((l) => (
          <li key={l.id} className="border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium">
                {l.name ?? "Anonyme"}{" "}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {LEAD_SOURCE_LABEL[l.source] ?? l.source}
                  {l.reference ? ` · dossier ${l.reference}` : ""}
                </span>
              </p>
              <select
                className={`${field} max-w-40 py-1.5 text-xs`}
                value={l.status}
                disabled={setStatus.isPending}
                onChange={(e) => setStatus.mutate({ id: l.id, status: e.target.value })}
              >
                {Object.entries(LEAD_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{l.message}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {[l.phone, l.email].filter(Boolean).join(" · ") || "—"} ·{" "}
              {new Date(l.created_at).toLocaleString("fr-FR")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

const CLAIM_STATUS_LABEL: Record<string, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  acceptee: "Acceptée",
  refuse: "Refusé",
  cloturee: "Clôturée",
};

const CLAIM_STATUS_ORDER: ClaimStatus[] = ["nouveau", "en_cours", "acceptee", "refuse", "cloturee"];

function ClaimsSection() {
  const queryClient = useQueryClient();
  const listClaims = useServerFn(listWarrantyClaims);
  const updateClaim = useServerFn(setWarrantyClaimStatus);

  const claims = useQuery({
    queryKey: ["claims"],
    queryFn: () => listClaims({ data: {} }),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ClaimStatus }) => {
      await updateClaim({ data: { id, status } });
    },
    onSuccess: (_d, vars) => {
      toast.success(`Statut mis à jour : ${CLAIM_STATUS_LABEL[vars.status] ?? vars.status}`);
      queryClient.invalidateQueries({ queryKey: ["claims"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Mise à jour impossible"),
  });

  const saveNote = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      await updateClaim({ data: { id, staffNote: note || undefined } });
    },
    onSuccess: () => {
      toast.success("Note enregistrée");
      queryClient.invalidateQueries({ queryKey: ["claims"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Enregistrement impossible"),
  });

  if (claims.isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement des réclamations…</p>;
  }

  const rows = claims.data ?? [];
  if (rows.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold">Réclamations</h2>
        <p className="mt-4 text-sm text-muted-foreground">
          Les réclamations de garantie soumises via le site apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">Réclamations</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Réclamations de garantie soumises en ligne — traitez le statut, notez la décision et le
        client est prévenu par WhatsApp.
      </p>
      <ul className="mt-6 space-y-3">
        {rows.map((c) => (
          <ClaimCard
            key={c.id}
            claim={c}
            busy={setStatus.isPending || saveNote.isPending}
            onStatus={(status) => setStatus.mutate({ id: c.id, status })}
            onSaveNote={(note) => saveNote.mutate({ id: c.id, note })}
          />
        ))}
      </ul>
    </div>
  );
}

function ClaimCard({
  claim,
  busy,
  onStatus,
  onSaveNote,
}: {
  claim: WarrantyClaimRow;
  busy: boolean;
  onStatus: (status: ClaimStatus) => void;
  onSaveNote: (note: string) => void;
}) {
  const [note, setNote] = useState(claim.staff_note ?? "");

  return (
    <li className="border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-primary/50 px-3 py-1 font-mono text-xs font-bold text-primary">
            {claim.reference}
          </span>
          <p className="font-medium">{claim.name}</p>
          {claim.reservation_reference ? (
            <span className="font-mono text-xs text-muted-foreground">
              {claim.reservation_reference}
            </span>
          ) : null}
        </div>
        <select
          className={`${field} max-w-44 py-1.5 text-xs`}
          value={claim.status}
          disabled={busy}
          onChange={(e) => onStatus(e.target.value as ClaimStatus)}
        >
          {CLAIM_STATUS_ORDER.map((value) => (
            <option key={value} value={value}>
              {CLAIM_STATUS_LABEL[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span className="text-muted-foreground">{claim.phone}</span>
        {claim.email ? <span className="text-muted-foreground">{claim.email}</span> : null}
        {claim.device ? <span>{claim.device}</span> : null}
        <span className="text-xs text-muted-foreground">
          {new Date(claim.created_at).toLocaleString("fr-FR")}
        </span>
      </div>

      <p className="mt-3 rounded-sm bg-surface p-3 text-sm text-muted-foreground">
        {claim.message}
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <textarea
          className={`${field} min-h-20 max-w-md py-1.5 text-xs`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note / réponse de l'atelier…"
          maxLength={500}
        />
        <Button
          size="sm"
          disabled={busy || !note.trim() || note.trim() === (claim.staff_note ?? "")}
          onClick={() => onSaveNote(note.trim())}
        >
          {busy ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : null}
          Enregistrer
        </Button>
      </div>
    </li>
  );
}

function TeamSection() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();

  const isAdmin = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (error) throw error;
      return Boolean(data);
    },
  });

  const members = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const { data: profiles, error: pError } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, created_at")
        .order("created_at", { ascending: true })
        .limit(200);
      if (pError) throw pError;
      const { data: roles, error: rError } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rError) throw rError;
      return {
        profiles,
        roles,
      };
    },
  });

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: Enums<"app_role"> }) => {
      const { error } = await supabase.rpc("set_user_role", {
        _user_id: userId,
        _role: role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rôle mis à jour");
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Mise à jour impossible"),
  });

  if (members.isLoading || isAdmin.isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement de l'équipe…</p>;
  }

  const rolesByUser = new Map((members.data?.roles ?? []).map((r) => [r.user_id, r.role]));

  return (
    <div>
      <h2 className="text-lg font-semibold">Équipe</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Attribuez les rôles : administrateur, personnel atelier, technicien ou client.
      </p>
      <ul className="mt-6 space-y-3">
        {(members.data?.profiles ?? []).map((p) => {
          const role = rolesByUser.get(p.id) ?? "user";
          return (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-4 border border-border bg-card p-4"
            >
              <div className="min-w-0">
                <p className="font-medium">{p.full_name ?? "Sans nom"}</p>
                <p className="text-xs text-muted-foreground">{p.email ?? p.phone ?? p.id}</p>
              </div>
              {isAdmin.data ? (
                <select
                  className={`${field} max-w-xs`}
                  value={role}
                  disabled={setRole.isPending}
                  onChange={(e) =>
                    setRole.mutate({
                      userId: p.id,
                      role: e.target.value as Enums<"app_role">,
                    })
                  }
                >
                  {Object.entries(ROLE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="rounded-full border border-border px-3 py-1 text-xs">
                  {ROLE_LABEL[role] ?? role}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SecuritySection() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [pendingSecret, setPendingSecret] = useState<string | null>(null);
  const [pendingUri, setPendingUri] = useState<string | null>(null);

  const otp = useQuery({
    queryKey: ["otp", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_otp")
        .select("secret, enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const enrollFn = useServerFn(enrollOtp);
  const confirmFn = useServerFn(confirmOtp);
  const disableFn = useServerFn(disableOtp);

  const enroll = useMutation({
    mutationFn: async () => enrollFn(),
    onSuccess: (res) => {
      setPendingSecret(res.secret);
      setPendingUri(res.uri);
      toast.success("Scanner le QR code dans votre application d'authentification.");
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Opération impossible"),
  });

  const confirm = useMutation({
    mutationFn: async () => confirmFn({ data: { code } }),
    onSuccess: () => {
      toast.success("Double authentification activée");
      setPendingSecret(null);
      setPendingUri(null);
      setCode("");
      queryClient.invalidateQueries({ queryKey: ["otp", user.id] });
      queryClient.invalidateQueries({ queryKey: ["otp-enabled", user.id] });
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Code invalide"),
  });

  const disable = useMutation({
    mutationFn: async () => disableFn({ data: { code } }),
    onSuccess: () => {
      toast.success("Double authentification désactivée");
      setCode("");
      queryClient.invalidateQueries({ queryKey: ["otp", user.id] });
      queryClient.invalidateQueries({ queryKey: ["otp-enabled", user.id] });
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Code invalide"),
  });

  const enrolling = pendingSecret !== null;

  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-semibold">Sécurité du compte</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        La double authentification (TOTP) protège l'accès à l'administration.
      </p>

      <RateLimitPanel />

      <MetricsPanel />

      {enrolling ? (
        <div className="mt-6 space-y-5 border border-border bg-card p-6">
          <p className="text-sm">
            1. Scannez le QR code avec Google Authenticator, Authy ou équivalent.
          </p>
          <QrCode
            value={pendingUri ?? ""}
            size={180}
            label="Clé TOTP"
            caption="QR code d'activation de la double authentification"
          />
          <p className="break-all font-mono text-xs text-muted-foreground">{pendingSecret}</p>
          <p className="text-sm">2. Saisissez le code à 6 chiffres affiché par l'application.</p>
          <div className="flex gap-3">
            <input
              className={`${field} max-w-40 text-center font-mono tracking-widest`}
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <Button
              disabled={confirm.isPending || code.length !== 6}
              onClick={() => confirm.mutate()}
            >
              {confirm.isPending ? "Vérification…" : "Activer"}
            </Button>
          </div>
        </div>
      ) : otp.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Chargement…</p>
      ) : otp.data?.enabled ? (
        <div className="mt-6 space-y-4 border border-border bg-card p-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-success">
            <ShieldCheck className="size-4" />
            Double authentification active
          </p>
          <p className="text-sm text-muted-foreground">
            À chaque session d'administration (24 h), un code à 6 chiffres sera demandé.
          </p>
          <div className="flex flex-wrap gap-3">
            <input
              className={`${field} max-w-40 text-center font-mono tracking-widest`}
              inputMode="numeric"
              maxLength={6}
              placeholder="Code actuel"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <Button
              variant="outline"
              disabled={disable.isPending || code.length !== 6}
              onClick={() => disable.mutate()}
            >
              Désactiver
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-4 border border-border bg-card p-6">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <KeyRound className="size-4" />
            Double authentification désactivée
          </p>
          <p className="text-sm text-muted-foreground">
            Recommandé pour protéger l'accès aux dossiers clients.
          </p>
          <Button disabled={enroll.isPending} onClick={() => enroll.mutate()}>
            {enroll.isPending ? "Préparation…" : "Activer la double authentification"}
          </Button>
        </div>
      )}
    </div>
  );
}

function RateLimitPanel() {
  const getSecurityStatsFn = useServerFn(getSecurityStats);
  const stats = useQuery({
    queryKey: ["rate-limit-stats"],
    queryFn: () => getSecurityStatsFn(),
    refetchInterval: 15_000,
  });

  return (
    <div className="mt-6 rounded-sm border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">Limiteur de débit</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Surveillance des requêtes par IP et action (fenêtre de 60 secondes).
      </p>
      {stats.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Chargement…</p>
      ) : stats.data ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-sm border border-border p-3 text-center">
              <p className="font-mono text-2xl font-bold">{stats.data.totalBuckets}</p>
              <p className="mt-1 text-xs text-muted-foreground">Buckets actifs</p>
            </div>
            <div className="rounded-sm border border-border p-3 text-center">
              <p className="font-mono text-2xl font-bold">{stats.data.activeBuckets}</p>
              <p className="mt-1 text-xs text-muted-foreground">Dans la fenêtre</p>
            </div>
            <div className="rounded-sm border border-border p-3 text-center">
              <p
                className={`font-mono text-2xl font-bold ${stats.data.blockedBuckets > 0 ? "text-destructive" : ""}`}
              >
                {stats.data.blockedBuckets}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Proches du blocage</p>
            </div>
          </div>
          {stats.data.buckets.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2">Clé</th>
                    <th className="px-3 py-2 text-right">Requêtes</th>
                    <th className="px-3 py-2 text-right">Expire dans</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.data.buckets.map((b) => (
                    <tr key={b.key} className="border-b border-border last:border-b-0">
                      <td className="px-3 py-2 font-mono">{b.key}</td>
                      <td className="px-3 py-2 text-right font-mono">{b.count}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{b.resetIn}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

const METRIC_LABEL: Record<string, string> = {
  reservation_created: "Réservation créée",
  reservation_completed: "Réservation terminée",
  payment_processed: "Paiement traité",
  payment_failed: "Paiement échoué",
  review_submitted: "Avis soumis",
  lead_created: "Lead créé",
  quote_sent: "Devis envoyé",
  quote_approved: "Devis approuvé",
  quote_declined: "Devis refusé",
};

function MetricsPanel() {
  const getMetricsFn = useServerFn(getMetrics);
  const metrics = useQuery({
    queryKey: ["metrics-summary"],
    queryFn: () => getMetricsFn(),
    refetchInterval: 30_000,
  });

  return (
    <div className="mt-6 rounded-sm border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">Métriques en temps réel</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Événements trackés depuis le dernier redémarrage de l'isolat.
      </p>
      {metrics.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Chargement…</p>
      ) : metrics.data && metrics.data.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2">Événement</th>
                <th className="px-3 py-2 text-right">Nombre</th>
              </tr>
            </thead>
            <tbody>
              {metrics.data.map((m) => (
                <tr key={m.name} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-2">
                    <span className="inline-block rounded-sm bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {METRIC_LABEL[m.name] ?? m.name}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{m.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">Aucune métrique enregistrée.</p>
      )}
    </div>
  );
}

function AnalyticsSection() {
  const events = useQuery({
    queryKey: ["analytics-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("event, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const counts = useQuery({
    queryKey: ["analytics-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("analytics_events").select("event");
      if (error) throw error;
      const map = new Map<string, number>();
      for (const row of data ?? []) {
        map.set(row.event, (map.get(row.event) ?? 0) + 1);
      }
      return [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([event, count]) => ({ event, count }));
    },
  });

  const EVENT_LABEL: Record<string, string> = {
    step_viewed: "Étape consultée",
    estimation_shown: "Estimation affichée",
    reservation_created: "Réservation créée",
  };

  if (events.isLoading) {
    return <p className="mt-6 text-sm text-muted-foreground">Chargement…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-4 text-xl font-semibold">Vue d'ensemble</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {(counts.data ?? []).map((c) => (
            <div key={c.event} className="border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold">{c.count}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {EVENT_LABEL[c.event] ?? c.event}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Événements récents</h2>
        <div className="overflow-x-auto border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 text-left">Événement</th>
                <th className="px-4 py-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {(events.data ?? []).slice(0, 50).map((e, i) => (
                <tr key={i} className="border-b border-border last:border-b-0 hover:bg-surface">
                  <td className="px-4 py-2">
                    <span className="inline-block rounded-sm bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {EVENT_LABEL[e.event] ?? e.event}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {new Date(e.created_at).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const contentTabs = [
  { id: "blog", label: "Articles" },
  { id: "avis", label: "Avis clients" },
  { id: "stock", label: "Stock boutique" },
] as const;

type ContentTab = (typeof contentTabs)[number]["id"];

function ContentSection() {
  const [sub, setSub] = useState<ContentTab>("blog");
  const lowStockQuery = useQuery({
    queryKey: ["admin-low-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("slug, quantity, low_stock_threshold");
      if (error) return [];
      return (data ?? []).filter((row) => row.quantity <= row.low_stock_threshold);
    },
    refetchInterval: 5 * 60 * 1000,
  });
  const lowStockCount = lowStockQuery.data?.length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {contentTabs.map((t) => (
          <Button
            key={t.id}
            variant={sub === t.id ? "technical" : "outline"}
            size="sm"
            onClick={() => setSub(t.id)}
          >
            {t.label}
            {t.id === "stock" && lowStockCount > 0 && (
              <span className="ml-2 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
                {lowStockCount}
              </span>
            )}
          </Button>
        ))}
      </div>
      {sub === "blog" && <BlogAdmin />}
      {sub === "avis" && <ReviewsAdmin />}
      {sub === "stock" && <StockAdmin />}
    </div>
  );
}

function BlogAdmin() {
  const queryClient = useQueryClient();
  const [locale, setLocale] = useState<string>("fr");
  const postsQuery = useQuery({
    queryKey: ["admin-blog", locale],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("slug, title, excerpt, date, category, reading_time, body, locale")
        .eq("locale", locale)
        .order("date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const [editing, setEditing] = useState<Partial<BlogPost> | null>(null);
  const [form, setForm] = useState({
    slug: "",
    locale: "fr",
    title: "",
    excerpt: "",
    date: "",
    category: "Guides",
    readingTime: "5 min",
    bodyText: "",
  });

  const upsertFn = useServerFn(upsertBlogPost);
  const deleteFn = useServerFn(deleteBlogPost);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = (p: BlogPost) => {
    setForm({
      slug: p.slug,
      locale: p.locale ?? "fr",
      title: p.title,
      excerpt: p.excerpt,
      date: p.date,
      category: p.category,
      readingTime: p.readingTime,
      bodyText: p.body.join("\n"),
    });
    setEditing(p);
    setError(null);
  };

  const startNew = () => {
    setForm({
      slug: "",
      locale,
      title: "",
      excerpt: "",
      date: new Date().toISOString().slice(0, 10),
      category: "Guides",
      readingTime: "5 min",
      bodyText: "",
    });
    setEditing(null);
    setError(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await upsertFn({
        data: {
          slug: form.slug.trim(),
          locale: form.locale.trim(),
          title: form.title.trim(),
          excerpt: form.excerpt.trim(),
          date: form.date,
          category: form.category.trim(),
          readingTime: form.readingTime.trim(),
          body: form.bodyText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        },
      });
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      toast.success("Article enregistré");
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (slug: string) => {
    try {
      await deleteFn({ data: { slug, locale } });
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      toast.success("Article supprimé");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suppression impossible");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="w-full" onClick={startNew}>
            <Plus className="mr-2 size-4" />
            Nouvel article
          </Button>
          <label className="sr-only" htmlFor="blog-locale">
            Langue
          </label>
          <select
            id="blog-locale"
            className={`${field} w-24 py-2`}
            value={locale}
            onChange={(e) => {
              setLocale(e.target.value);
              setEditing(null);
            }}
          >
            <option value="fr">FR</option>
            <option value="en">EN</option>
          </select>
        </div>
        {postsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
          (postsQuery.data ?? []).map((p) => (
            <div key={p.slug} className="rounded-sm border border-border bg-card p-4">
              <p className="text-xs font-semibold">{p.title}</p>
              <p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">
                {p.category} · {p.date}
                {p.locale !== "fr" ? ` · ${p.locale.toUpperCase()}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="technicalOutline"
                  size="sm"
                  onClick={() =>
                    startEdit({
                      slug: p.slug,
                      locale: p.locale ?? locale,
                      title: p.title,
                      excerpt: p.excerpt,
                      date: p.date,
                      category: p.category,
                      readingTime: p.reading_time,
                      body: parsePostBody(p.body),
                    })
                  }
                >
                  <Pencil className="size-3.5" /> Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => remove(p.slug)}
                  className="text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {(editing || form.slug) && (
        <form onSubmit={save} className="space-y-4 rounded-sm border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              {editing ? "Modifier l'article" : "Nouvel article"}
            </p>
            <span className="rounded-full border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Langue : {form.locale === "en" ? "English" : "Français"}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="at-eyebrow mb-2 block">Titre</span>
              <input
                className={field}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </label>
            <label className="block">
              <span className="at-eyebrow mb-2 block">Slug</span>
              <input
                className={field}
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]+/g, "-")
                      .replace(/^-+|-+$/g, ""),
                  }))
                }
                required
                disabled={!!editing}
              />
            </label>
          </div>
          <label className="block">
            <span className="at-eyebrow mb-2 block">Résumé</span>
            <textarea
              className={`${field} h-20`}
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              required
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="at-eyebrow mb-2 block">Date</span>
              <input
                type="date"
                className={field}
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
              />
            </label>
            <label className="block">
              <span className="at-eyebrow mb-2 block">Catégorie</span>
              <input
                className={field}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                required
              />
            </label>
            <label className="block">
              <span className="at-eyebrow mb-2 block">Lecture</span>
              <input
                className={field}
                value={form.readingTime}
                onChange={(e) => setForm((f) => ({ ...f, readingTime: e.target.value }))}
                placeholder="5 min"
                required
              />
            </label>
          </div>
          <label className="block">
            <span className="at-eyebrow mb-2 block">Contenu (un paragraphe par ligne)</span>
            <textarea
              className={`${field} h-56`}
              value={form.bodyText}
              onChange={(e) => setForm((f) => ({ ...f, bodyText: e.target.value }))}
              required
            />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="technical" disabled={saving}>
              {saving ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Publier"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(null)}
              disabled={saving}
            >
              Annuler
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function parsePostBody(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((p): p is string => typeof p === "string");
  } catch {
    /* ignore */
  }
  return [];
}

function ReviewsAdmin() {
  const queryClient = useQueryClient();
  const reviewsQuery = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, customer_name, phone, email, rating, comment, status, verified, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const [form, setForm] = useState({
    id: "",
    customer_name: "",
    phone: "",
    email: "",
    rating: 5,
    comment: "",
    status: "published",
  });
  const upsertFn = useServerFn(upsertReview);
  const deleteFn = useServerFn(deleteReview);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () =>
    setForm({
      id: "",
      customer_name: "",
      phone: "",
      email: "",
      rating: 5,
      comment: "",
      status: "published",
    });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await upsertFn({
        data: {
          id: form.id || undefined,
          customer_name: form.customer_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          rating: form.rating,
          comment: form.comment.trim(),
          status: form.status,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success(form.id ? "Avis mis à jour" : "Avis ajouté");
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteFn({ data: { id } });
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Avis supprimé");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suppression impossible");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-3">
        {(reviewsQuery.data ?? []).map((r) => (
          <div key={r.id} className="rounded-sm border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Stars n={r.rating} />
                <p className="text-sm font-semibold">
                  {r.customer_name} — {r.email || "—"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="technicalOutline"
                  size="sm"
                  onClick={() =>
                    setForm({
                      id: r.id,
                      customer_name: r.customer_name,
                      phone: r.phone ?? "",
                      email: r.email ?? "",
                      rating: r.rating,
                      comment: r.comment,
                      status: r.status ?? "published",
                    })
                  }
                >
                  <Pencil className="size-3.5" /> Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => remove(r.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">« {r.comment} »</p>
          </div>
        ))}
      </div>

      <form onSubmit={save} className="space-y-4 rounded-sm border border-border bg-card p-5 h-fit">
        <h3 className="text-sm font-semibold">{form.id ? "Modifier l'avis" : "Ajouter un avis"}</h3>
        <label className="block">
          <span className="at-eyebrow mb-2 block">Nom</span>
          <input
            className={field}
            value={form.customer_name}
            onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
            required
          />
        </label>
        <label className="block">
          <span className="at-eyebrow mb-2 block">Téléphone</span>
          <input
            className={field}
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            required
          />
        </label>
        <label className="block">
          <span className="at-eyebrow mb-2 block">Email</span>
          <input
            className={field}
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="at-eyebrow mb-2 block">Note ({form.rating}/5)</span>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            className="w-full"
            value={form.rating}
            onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))}
          />
        </label>
        <label className="block">
          <span className="at-eyebrow mb-2 block">Commentaire</span>
          <textarea
            className={`${field} h-24`}
            value={form.comment}
            onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
            required
          />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="technical" disabled={saving}>
            {saving ? "Enregistrement…" : form.id ? "Enregistrer" : "Ajouter"}
          </Button>
          {form.id && (
            <Button type="button" variant="outline" onClick={reset} disabled={saving}>
              Annuler
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

const LOW_STOCK_THRESHOLD = 5;

function StockAdmin() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const stockQuery = useQuery({
    queryKey: ["admin-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("slug, quantity, updated_at")
        .order("slug");
      if (error) throw error;
      const map = new Map<string, number>();
      for (const row of data ?? []) map.set(row.slug, row.quantity);
      return map;
    },
  });
  const setFn = useServerFn(setInventory);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingSlug, setSavingSlug] = useState<string | null>(null);

  const lowItems = useMemo(() => {
    const map = stockQuery.data;
    if (!map) return [];
    return ACCESSORIES.map((a) => {
      const quantity = map.get(a.slug);
      return quantity !== undefined && quantity < LOW_STOCK_THRESHOLD
        ? { slug: a.slug, name: a.name, quantity }
        : null;
    })
      .filter((x): x is { slug: string; name: string; quantity: number } => x !== null)
      .sort((a, b) => a.quantity - b.quantity);
  }, [stockQuery.data]);

  const save = async (a: { slug: string; stock: number }) => {
    const value = Number(drafts[a.slug] ?? a.stock);
    if (!Number.isFinite(value) || value < 0) {
      toast.error("Quantité invalide");
      return;
    }
    setSavingSlug(a.slug);
    try {
      await setFn({ data: { slug: a.slug, quantity: value } });
      queryClient.invalidateQueries({ queryKey: ["admin-stock"] });
      setDrafts((d) => {
        const next = { ...d };
        delete next[a.slug];
        return next;
      });
      toast.success(`${a.slug} : stock mis à jour`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Mise à jour impossible");
    } finally {
      setSavingSlug(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      {lowItems.length > 0 && (
        <div className="mb-4 rounded-sm border border-destructive/40 bg-destructive/5 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <ShieldAlert className="size-4" />
            {t("admin.stock.low.title")}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {lowItems.map((item) => (
              <li key={item.slug}>
                {item.name} —{" "}
                <span className="font-mono text-destructive">
                  {item.quantity === 1
                    ? t("admin.stock.low.remaining.one", [item.quantity])
                    : t("admin.stock.low.remaining.other", [item.quantity])}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2">Référence</th>
            <th className="px-4 py-2">Désignation</th>
            <th className="px-4 py-2">Prix</th>
            <th className="px-4 py-2">Stock</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {ACCESSORIES.map((a) => {
            const real = stockQuery.data?.get(a.slug);
            const tracked = real !== undefined;
            const draft = drafts[a.slug];
            const low = tracked && real < LOW_STOCK_THRESHOLD;
            return (
              <tr
                key={a.slug}
                className={`border-b border-border ${low ? "bg-destructive/5" : ""}`}
              >
                <td className="px-4 py-2 font-mono text-xs uppercase">{a.slug}</td>
                <td className="px-4 py-2">{a.name}</td>
                <td className="px-4 py-2 font-mono">{formatFcfa(a.price)}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      className={`${field} w-28 py-1.5 text-sm ${low ? "text-destructive" : ""}`}
                      value={draft ?? String(tracked ? (real as number) : a.stock)}
                      onChange={(e) => setDrafts((d) => ({ ...d, [a.slug]: e.target.value }))}
                    />
                    {tracked && (
                      <span className="font-mono text-[10px] uppercase text-muted-foreground">
                        suivi
                      </span>
                    )}
                    {low && (
                      <span
                        className="size-2 shrink-0 rounded-full bg-destructive"
                        title="Stock faible"
                      />
                    )}
                  </div>
                </td>
                <td className="px-4 py-2">
                  <Button
                    variant="technical"
                    size="sm"
                    disabled={savingSlug === a.slug}
                    onClick={() => save({ slug: a.slug, stock: real ?? a.stock })}
                  >
                    {savingSlug === a.slug ? "…" : "Mettre à jour"}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ===========================================================================
// Catalogue — gestion des marques, appareils, pannes et photos par l'atelier
// ===========================================================================

function CatalogSection() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listCatalog);
  const [brandSlug, setBrandSlug] = useState<string | null>(null);
  const [deviceSlug, setDeviceSlug] = useState<string | null>(null);

  const catalog = useQuery({
    queryKey: ["catalog"],
    queryFn: () => listFn({ data: {} }),
  });

  if (catalog.isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement du catalogue…</p>;
  }

  if (catalog.isError) {
    return (
      <div>
        <h2 className="text-lg font-semibold">Catalogue</h2>
        <p className="mt-4 text-sm text-destructive">
          Impossible de charger le catalogue. Réessayez.
        </p>
      </div>
    );
  }

  const data = catalog.data ?? { categories: [], brands: [], devices: [], faults: [], photos: [] };
  const selectedBrand = data.brands.find((b) => b.slug === brandSlug) ?? null;
  const devices = data.devices.filter((d) => d.brand_slug === selectedBrand?.slug);
  const selectedDevice = devices.find((d) => d.slug === deviceSlug) ?? null;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["catalog"] });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Catalogue</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Marques, appareils et pannes affichés sur le site — les modifications sont immédiates.
        </p>
      </div>
      <CategoriesPanel categories={data.categories} onChanged={invalidate} />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <BrandPanel
          brands={data.brands}
          selectedSlug={selectedBrand?.slug ?? null}
          onSelect={(slug) => {
            setBrandSlug(slug);
            setDeviceSlug(null);
          }}
          onChanged={invalidate}
        />
        <DevicePanel
          brand={selectedBrand}
          devices={devices}
          categories={data.categories}
          deviceSlug={deviceSlug}
          onSelectDevice={setDeviceSlug}
          onChanged={invalidate}
        />
        <DeviceDetailPanel
          device={selectedDevice}
          faults={data.faults.filter((f) => f.device_slug === selectedDevice?.slug)}
          photos={data.photos.filter((p) => p.device_slug === selectedDevice?.slug)}
          onChanged={invalidate}
        />
      </div>
    </div>
  );
}

function CategoriesPanel({
  categories,
  onChanged,
}: {
  categories: CatalogCategory[];
  onChanged: () => void;
}) {
  const upsertFn = useServerFn(upsertCategory);
  const deleteFn = useServerFn(deleteCategory);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ slug: "", label: "", sort: 0, active: true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEditing(null);
    setForm({ slug: "", label: "", sort: 0, active: true });
    setError(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await upsertFn({
        data: {
          slug: form.slug.trim(),
          label: form.label.trim(),
          sort: form.sort,
          active: form.active,
        },
      });
      toast.success(editing ? "Catégorie mise à jour" : "Catégorie ajoutée");
      reset();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (slug: string) => {
    setBusy(true);
    try {
      await deleteFn({ data: { slug } });
      toast.success("Catégorie supprimée");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suppression impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Catégories d'appareils</h3>
        <Button variant="outline" size="sm" onClick={reset}>
          <Plus className="size-3.5" /> Ajouter
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <span
            key={c.slug}
            className="inline-flex items-center gap-2 rounded-sm border border-border bg-surface px-2 py-1 text-xs"
          >
            {c.label}
            {!c.active && <span className="text-muted-foreground">(inactive)</span>}
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Modifier ${c.label}`}
              onClick={() => {
                setEditing(c.slug);
                setForm({ slug: c.slug, label: c.label, sort: c.sort, active: c.active });
              }}
            >
              <Pencil className="size-3" />
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:text-destructive"
              disabled={busy}
              aria-label={`Supprimer ${c.label}`}
              onClick={() => remove(c.slug)}
            >
              <Trash2 className="size-3" />
            </button>
          </span>
        ))}
        {categories.length === 0 && (
          <p className="text-xs text-muted-foreground">Aucune catégorie.</p>
        )}
      </div>
      <form onSubmit={save} className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
        <label className="block">
          <span className="at-eyebrow mb-1 block text-[11px]">Libellé</span>
          <input
            className={field}
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            required
          />
        </label>
        <label className="block">
          <span className="at-eyebrow mb-1 block text-[11px]">Slug</span>
          <input
            className={field}
            value={form.slug}
            disabled={editing !== null}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                slug: e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]+/g, "-")
                  .replace(/^-+|-+$/g, ""),
              }))
            }
            required
          />
        </label>
        <label className="block">
          <span className="at-eyebrow mb-1 block text-[11px]">Ordre</span>
          <input
            type="number"
            min={0}
            className={field}
            value={form.sort}
            onChange={(e) => setForm((f) => ({ ...f, sort: Number(e.target.value) || 0 }))}
          />
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          />
          Visible sur le site
        </label>
        {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2">
          <Button
            type="submit"
            variant="technical"
            size="sm"
            disabled={busy || !form.label.trim() || !form.slug.trim()}
          >
            {busy ? "Enregistrement…" : editing ? "Enregistrer" : "Ajouter"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function BrandPanel({
  brands,
  selectedSlug,
  onSelect,
  onChanged,
}: {
  brands: CatalogBrand[];
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
  onChanged: () => void;
}) {
  const upsertFn = useServerFn(upsertBrand);
  const deleteFn = useServerFn(deleteBrand);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ slug: "", name: "", tag: "", sort: 0, active: true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEditing(null);
    setForm({ slug: "", name: "", tag: "", sort: 0, active: true });
    setError(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await upsertFn({
        data: {
          slug: form.slug.trim(),
          name: form.name.trim(),
          tag: form.tag.trim(),
          sort: form.sort,
          active: form.active,
        },
      });
      toast.success(editing ? "Marque mise à jour" : "Marque ajoutée");
      reset();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (slug: string) => {
    setBusy(true);
    try {
      await deleteFn({ data: { slug } });
      if (slug === selectedSlug) onSelect(null);
      toast.success("Marque supprimée (appareils cascadés)");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suppression impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Marques</h3>
        <Button variant="outline" size="sm" onClick={reset}>
          <Plus className="size-3.5" /> Ajouter
        </Button>
      </div>
      <ul className="mt-4 space-y-2">
        {brands.map((b) => {
          const selected = b.slug === selectedSlug;
          return (
            <li
              key={b.slug}
              className={`flex items-center justify-between gap-2 border px-3 py-2 ${
                selected ? "border-primary/60 bg-primary/5" : "border-border bg-surface"
              }`}
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => onSelect(selected ? null : b.slug)}
              >
                <p className="truncate text-sm font-medium">{b.name}</p>
                <p className="truncate font-mono text-[10px] uppercase text-muted-foreground">
                  {b.slug}
                  {b.tag ? ` · ${b.tag}` : ""}
                  {b.active ? "" : " · inactive"}
                </p>
              </button>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Modifier ${b.name}`}
                  onClick={() => {
                    setEditing(b.slug);
                    setForm({
                      slug: b.slug,
                      name: b.name,
                      tag: b.tag,
                      sort: b.sort,
                      active: b.active,
                    });
                  }}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  disabled={busy}
                  aria-label={`Supprimer ${b.name}`}
                  onClick={() => remove(b.slug)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          );
        })}
        {brands.length === 0 && (
          <li className="rounded-sm border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
            Aucune marque
          </li>
        )}
      </ul>
      <form onSubmit={save} className="mt-4 space-y-3 border-t border-border pt-4">
        <p className="text-xs font-semibold">
          {editing ? `Modifier : ${editing}` : "Nouvelle marque"}
        </p>
        <label className="block">
          <span className="at-eyebrow mb-1 block text-[11px]">Nom</span>
          <input
            className={field}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </label>
        <label className="block">
          <span className="at-eyebrow mb-1 block text-[11px]">Slug</span>
          <input
            className={field}
            value={form.slug}
            disabled={editing !== null}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                slug: e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]+/g, "-")
                  .replace(/^-+|-+$/g, ""),
              }))
            }
            required
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">Tag</span>
            <input
              className={field}
              value={form.tag}
              onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
              placeholder="ex. iPhone, Android"
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">Ordre</span>
            <input
              type="number"
              min={0}
              className={field}
              value={form.sort}
              onChange={(e) => setForm((f) => ({ ...f, sort: Number(e.target.value) || 0 }))}
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          />
          Visible sur le site
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          variant="technical"
          size="sm"
          disabled={busy || !form.name.trim() || !form.slug.trim()}
        >
          {busy ? "Enregistrement…" : editing ? "Enregistrer" : "Ajouter"}
        </Button>
      </form>
    </div>
  );
}

function DevicePanel({
  brand,
  devices,
  categories,
  deviceSlug,
  onSelectDevice,
  onChanged,
}: {
  brand: CatalogBrand | null;
  devices: CatalogDevice[];
  categories: CatalogCategory[];
  deviceSlug: string | null;
  onSelectDevice: (slug: string | null) => void;
  onChanged: () => void;
}) {
  const upsertFn = useServerFn(upsertDevice);
  const deleteFn = useServerFn(deleteDevice);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    slug: "",
    name: "",
    categorySlug: "",
    series: "",
    year: 0,
    sort: 0,
    active: true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!brand) {
    return (
      <div className="rounded-sm border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">Appareils</h3>
        <p className="mt-4 text-sm text-muted-foreground">
          Sélectionnez une marque pour gérer ses appareils.
        </p>
      </div>
    );
  }

  const reset = () => {
    setEditing(null);
    setForm({
      slug: "",
      name: "",
      categorySlug: categories[0]?.slug ?? "",
      series: "",
      year: 0,
      sort: 0,
      active: true,
    });
    setError(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categorySlug) {
      setError("Sélectionnez une catégorie avant d'enregistrer.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await upsertFn({
        data: {
          slug: form.slug.trim(),
          name: form.name.trim(),
          brandSlug: brand.slug,
          categorySlug: form.categorySlug,
          series: form.series.trim(),
          year: form.year,
          sort: form.sort,
          active: form.active,
        },
      });
      toast.success(editing ? "Appareil mis à jour" : "Appareil ajouté");
      reset();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (slug: string) => {
    setBusy(true);
    try {
      await deleteFn({ data: { slug } });
      if (slug === deviceSlug) onSelectDevice(null);
      toast.success("Appareil supprimé");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suppression impossible");
    } finally {
      setBusy(false);
    }
  };

  const categoryLabel = (slug: string) => categories.find((c) => c.slug === slug)?.label ?? slug;

  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Appareils — {brand.name}</h3>
        <Button variant="outline" size="sm" onClick={reset}>
          <Plus className="size-3.5" /> Ajouter
        </Button>
      </div>
      <ul className="mt-4 space-y-2">
        {devices.map((d) => {
          const selected = d.slug === deviceSlug;
          return (
            <li
              key={d.slug}
              className={`flex items-center justify-between gap-2 border px-3 py-2 ${
                selected ? "border-primary/60 bg-primary/5" : "border-border bg-surface"
              }`}
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => onSelectDevice(selected ? null : d.slug)}
              >
                <p className="truncate text-sm font-medium">{d.name}</p>
                <p className="truncate font-mono text-[10px] uppercase text-muted-foreground">
                  {d.slug} · {categoryLabel(d.category_slug)}
                  {d.year ? ` · ${d.year}` : ""}
                  {d.active ? "" : " · inactif"}
                </p>
              </button>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Modifier ${d.name}`}
                  onClick={() => {
                    setEditing(d.slug);
                    setForm({
                      slug: d.slug,
                      name: d.name,
                      categorySlug: d.category_slug,
                      series: d.series,
                      year: d.year,
                      sort: d.sort,
                      active: d.active,
                    });
                  }}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  disabled={busy}
                  aria-label={`Supprimer ${d.name}`}
                  onClick={() => remove(d.slug)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          );
        })}
        {devices.length === 0 && (
          <li className="rounded-sm border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
            Aucun appareil pour cette marque
          </li>
        )}
      </ul>
      <form onSubmit={save} className="mt-4 space-y-3 border-t border-border pt-4">
        <p className="text-xs font-semibold">
          {editing ? `Modifier : ${editing}` : "Nouvel appareil"}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">Nom</span>
            <input
              className={field}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">Slug</span>
            <input
              className={field}
              value={form.slug}
              disabled={editing !== null}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  slug: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]+/g, "-")
                    .replace(/^-+|-+$/g, ""),
                }))
              }
              required
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">Catégorie</span>
            <select
              className={field}
              value={form.categorySlug}
              onChange={(e) => setForm((f) => ({ ...f, categorySlug: e.target.value }))}
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">Série</span>
            <input
              className={field}
              value={form.series}
              onChange={(e) => setForm((f) => ({ ...f, series: e.target.value }))}
              placeholder="ex. Galaxy A15"
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">Année</span>
            <input
              type="number"
              min={1990}
              max={2100}
              className={field}
              value={form.year}
              onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) || 0 }))}
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">Ordre</span>
            <input
              type="number"
              min={0}
              className={field}
              value={form.sort}
              onChange={(e) => setForm((f) => ({ ...f, sort: Number(e.target.value) || 0 }))}
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          />
          Visible sur le site
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          variant="technical"
          size="sm"
          disabled={busy || !form.name.trim() || !form.slug.trim()}
        >
          {busy ? "Enregistrement…" : editing ? "Enregistrer" : "Ajouter"}
        </Button>
      </form>
    </div>
  );
}

function DeviceDetailPanel({
  device,
  faults,
  photos,
  onChanged,
}: {
  device: CatalogDevice | null;
  faults: CatalogFault[];
  photos: CatalogPhoto[];
  onChanged: () => void;
}) {
  const upsertFn = useServerFn(upsertFault);
  const deleteFn = useServerFn(deleteFault);
  const addPhotoFn = useServerFn(addCatalogPhoto);
  const deletePhotoFn = useServerFn(deleteCatalogPhoto);
  const getUploadFn = useServerFn(getCatalogUpload);
  const [editingFault, setEditingFault] = useState<number | null>(null);
  const [faultForm, setFaultForm] = useState({
    slug: "",
    label: "",
    price: "",
    duration: "",
    warranty: "",
    part: "",
    sort: 0,
  });
  const [photoUrl, setPhotoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!device) {
    return (
      <div className="rounded-sm border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">Pannes & photos</h3>
        <p className="mt-4 text-sm text-muted-foreground">
          Sélectionnez un appareil pour gérer ses pannes et photos.
        </p>
      </div>
    );
  }

  const resetFault = () => {
    setEditingFault(null);
    setFaultForm({ slug: "", label: "", price: "", duration: "", warranty: "", part: "", sort: 0 });
    setError(null);
  };

  const saveFault = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(faultForm.price);
    setBusy(true);
    setError(null);
    try {
      await upsertFn({
        data: {
          id: editingFault,
          deviceSlug: device.slug,
          slug: faultForm.slug.trim(),
          label: faultForm.label.trim(),
          price: Number.isFinite(price) && price >= 0 ? Math.round(price) : 0,
          duration: faultForm.duration.trim(),
          warranty: faultForm.warranty.trim(),
          part: faultForm.part.trim(),
          sort: faultForm.sort,
        },
      });
      toast.success(editingFault ? "Panne mise à jour" : "Panne ajoutée");
      resetFault();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setBusy(false);
    }
  };

  const removeFault = async (id: number) => {
    setBusy(true);
    try {
      await deleteFn({ data: { id } });
      toast.success("Panne supprimée");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suppression impossible");
    } finally {
      setBusy(false);
    }
  };

  const addPhoto = async (url: string) => {
    setBusy(true);
    setError(null);
    try {
      await addPhotoFn({ data: { deviceSlug: device.slug, url } });
      toast.success("Photo ajoutée");
      setPhotoUrl("");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ajout impossible");
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async (id: number) => {
    setBusy(true);
    try {
      await deletePhotoFn({ data: { id } });
      toast.success("Photo supprimée");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suppression impossible");
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const prepared = await getUploadFn({
        data: { fileName: file.name, contentType: file.type, fileSize: file.size },
      });
      const put = await fetch(prepared.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type, "x-upsert": "false" },
        body: file,
      });
      if (!put.ok) throw new Error(`Upload ${put.status}`);
      await addPhotoFn({ data: { deviceSlug: device.slug, url: prepared.path } });
      toast.success("Photo téléversée et ajoutée");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">Pannes & photos — {device.name}</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2">Panne</th>
              <th className="px-3 py-2">Prix</th>
              <th className="px-3 py-2">Durée</th>
              <th className="px-3 py-2">Garantie</th>
              <th className="px-3 py-2">Pièce</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {faults.map((f) => (
              <tr key={f.id} className="border-b border-border last:border-b-0">
                <td className="px-3 py-2">
                  <p className="font-medium">{f.label}</p>
                  <p className="font-mono text-[10px] uppercase text-muted-foreground">
                    {f.slug} · ordre {f.sort}
                  </p>
                </td>
                <td className="px-3 py-2 font-mono">{formatFcfa(f.price)}</td>
                <td className="px-3 py-2">{f.duration || "—"}</td>
                <td className="px-3 py-2">{f.warranty || "—"}</td>
                <td className="px-3 py-2">{f.part || "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Modifier ${f.label}`}
                      onClick={() => {
                        setEditingFault(f.id);
                        setFaultForm({
                          slug: f.slug,
                          label: f.label,
                          price: String(f.price),
                          duration: f.duration,
                          warranty: f.warranty,
                          part: f.part,
                          sort: f.sort,
                        });
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      disabled={busy}
                      aria-label={`Supprimer ${f.label}`}
                      onClick={() => removeFault(f.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {faults.length === 0 && (
          <p className="py-3 text-xs text-muted-foreground">Aucune panne enregistrée.</p>
        )}
      </div>
      <form onSubmit={saveFault} className="mt-4 space-y-3 border-t border-border pt-4">
        <p className="text-xs font-semibold">
          {editingFault ? `Modifier la panne #${editingFault}` : "Nouvelle panne"}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">Libellé</span>
            <input
              className={field}
              value={faultForm.label}
              onChange={(e) => setFaultForm((f) => ({ ...f, label: e.target.value }))}
              required
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">Slug</span>
            <input
              className={field}
              value={faultForm.slug}
              onChange={(e) =>
                setFaultForm((f) => ({
                  ...f,
                  slug: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]+/g, "-")
                    .replace(/^-+|-+$/g, ""),
                }))
              }
              required
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">Prix (FCFA)</span>
            <input
              type="number"
              min={0}
              step={500}
              className={field}
              value={faultForm.price}
              onChange={(e) => setFaultForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="ex. 15000"
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">Durée</span>
            <input
              className={field}
              value={faultForm.duration}
              onChange={(e) => setFaultForm((f) => ({ ...f, duration: e.target.value }))}
              placeholder="ex. 1 à 2 jours"
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">Garantie</span>
            <input
              className={field}
              value={faultForm.warranty}
              onChange={(e) => setFaultForm((f) => ({ ...f, warranty: e.target.value }))}
              placeholder="ex. 6 mois"
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">Pièce</span>
            <input
              className={field}
              value={faultForm.part}
              onChange={(e) => setFaultForm((f) => ({ ...f, part: e.target.value }))}
              placeholder="ex. Écran + batterie"
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">Ordre</span>
            <input
              type="number"
              min={0}
              className={field}
              value={faultForm.sort}
              onChange={(e) => setFaultForm((f) => ({ ...f, sort: Number(e.target.value) || 0 }))}
            />
          </label>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            variant="technical"
            size="sm"
            disabled={busy || !faultForm.label.trim() || !faultForm.slug.trim()}
          >
            {busy ? "Enregistrement…" : editingFault ? "Enregistrer" : "Ajouter la panne"}
          </Button>
          {editingFault !== null && (
            <Button type="button" variant="outline" size="sm" onClick={resetFault} disabled={busy}>
              Annuler
            </Button>
          )}
        </div>
      </form>
      <div className="mt-4 border-t border-border pt-4">
        <p className="text-sm font-semibold">Photos</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {photos.map((p) => (
            <div key={p.id} className="relative">
              <img
                src={p.url}
                alt={p.alt || device.name}
                loading="lazy"
                decoding="async"
                className="h-16 w-16 rounded-sm border border-border object-cover"
              />
              <button
                type="button"
                className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full border border-border bg-card text-destructive hover:bg-destructive/10"
                disabled={busy}
                aria-label="Supprimer la photo"
                onClick={() => removePhoto(p.id)}
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
          {photos.length === 0 && <p className="text-xs text-muted-foreground">Aucune photo.</p>}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label
              htmlFor={`photo-url-${device.slug}`}
              className="mb-1 block text-[11px] text-muted-foreground"
            >
              URL de la photo
            </label>
            <input
              id={`photo-url-${device.slug}`}
              className={`${field} max-w-64 py-1.5 text-xs`}
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://… ou chemin du bucket"
            />
          </div>
          <Button
            size="sm"
            variant="secondary"
            disabled={busy || !photoUrl.trim()}
            onClick={() => addPhoto(photoUrl.trim())}
          >
            Ajouter
          </Button>
          <label className="flex cursor-pointer items-center gap-2 rounded-sm border border-border px-3 py-1.5 text-xs hover:bg-surface">
            {busy ? (
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            ) : (
              <ImagePlus className="size-3.5 text-muted-foreground" />
            )}
            Téléverser
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              className="sr-only"
              disabled={busy}
              onChange={handleUpload}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// Commandes — commandes boutique (leads source 'boutique') + paiements
// ===========================================================================

const ORDER_STATUS_LABEL: Record<string, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  livre: "Livré",
  cloture: "Clôturé",
};

const ORDER_STATUS_OPTIONS = ["nouveau", "en_cours", "livre", "cloture"] as const;

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  paid: "Payé",
  pending: "En attente",
  failed: "Échoué",
  refunded: "Remboursé",
};

const PAYMENT_BADGE_TONE: Record<string, string> = {
  paid: "border-success/50 text-success",
  pending: "border-amber-500/50 text-amber-500",
  failed: "border-destructive/50 text-destructive",
  refunded: "border-border text-muted-foreground",
};

/** Extrait le dernier « Total : … FCFA » du message de commande. */
function extractOrderTotal(message: string | null): number | null {
  if (!message) return null;
  const matches = [...message.matchAll(/Total\s*:\s*([\d\s\u00A0]+)\s*FCFA/g)];
  if (matches.length === 0) return null;
  const group = matches[matches.length - 1]?.[1];
  if (!group) return null;
  const raw = group.replace(/[\s\u00A0]/g, "");
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

type OrderRow = {
  id: string;
  reference: string | null;
  name: string | null;
  phone: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

function OrdersSection() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");

  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("id, reference, name, phone, message, status, created_at")
        .eq("source", "boutique")
        .order("created_at", { ascending: false })
        .limit(200);
      if (leadsError) throw leadsError;
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("reference, status, amount, created_at")
        .eq("source", "boutique")
        .order("created_at", { ascending: true });
      if (paymentsError) throw paymentsError;
      return { orders: leadsData ?? [], payments: paymentsData ?? [] };
    },
  });

  const paymentByReference = useMemo(() => {
    const map = new Map<string, { status: string; amount: number | null }>();
    for (const p of orders.data?.payments ?? []) {
      map.set(p.reference, { status: p.status, amount: p.amount });
    }
    return map;
  }, [orders.data?.payments]);

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Mise à jour impossible"),
  });

  const rows = (orders.data?.orders ?? []).filter((o: OrderRow) => {
    const q = query.trim().toLowerCase();
    return (
      !q ||
      (o.reference ?? "").toLowerCase().includes(q) ||
      (o.name ?? "").toLowerCase().includes(q) ||
      (o.phone ?? "").toLowerCase().includes(q)
    );
  });

  if (orders.isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement des commandes…</p>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">Commandes</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Commandes boutique reçues via le site, avec le statut du paiement en ligne.
      </p>
      <label htmlFor="orders-search" className="sr-only">
        Rechercher une commande
      </label>
      <input
        id="orders-search"
        className={`${field} mt-4`}
        placeholder="Rechercher (référence, nom, téléphone)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Aucune commande boutique ne correspond à cette recherche.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((o) => {
            const payment = paymentByReference.get(o.reference ?? "") ?? null;
            const total = extractOrderTotal(o.message);
            return (
              <li key={o.id} className="border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-primary/50 px-3 py-1 font-mono text-xs font-bold text-primary">
                      {o.reference ?? "—"}
                    </span>
                    <p className="font-medium">{o.name ?? "Anonyme"}</p>
                    <Badge
                      variant="outline"
                      className={
                        payment
                          ? (PAYMENT_BADGE_TONE[payment.status] ??
                            "border-border text-muted-foreground")
                          : "border-border text-muted-foreground"
                      }
                    >
                      {payment
                        ? `${PAYMENT_STATUS_LABEL[payment.status] ?? payment.status}${
                            payment.amount != null ? ` · ${formatFcfa(payment.amount)}` : ""
                          }`
                        : "Non payé"}
                    </Badge>
                  </div>
                  <select
                    className={`${field} max-w-40 py-1.5 text-xs`}
                    value={o.status}
                    disabled={setStatus.isPending}
                    onChange={(e) => setStatus.mutate({ id: o.id, status: e.target.value })}
                  >
                    {ORDER_STATUS_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {ORDER_STATUS_LABEL[value]}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                  {o.message}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{o.phone ?? "—"}</span>
                  {total !== null && <span className="font-mono">{formatFcfa(total)}</span>}
                  <span>{new Date(o.created_at).toLocaleString("fr-FR")}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ===========================================================================
// Retours — demandes de retour commandes créées et suivies par l'atelier
// ===========================================================================

const RETURN_STATUS_ORDER: ReturnStatus[] = ["nouveau", "en_cours", "accepte", "refuse", "cloture"];

const RETURN_STATUS_LABEL: Record<string, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  accepte: "Accepté",
  refuse: "Refusé",
  cloture: "Clôturé",
};

function ReturnsSection() {
  const queryClient = useQueryClient();
  const createFn = useServerFn(createReturn);
  const listFn = useServerFn(listReturns);
  const setFn = useServerFn(setReturnStatus);

  const returns = useQuery({
    queryKey: ["returns"],
    queryFn: () => listFn({ data: {} }),
  });

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    orderReference: "",
    item: "",
    reason: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await createFn({
        data: {
          customerName: form.customerName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          orderReference: form.orderReference.trim(),
          item: form.item.trim(),
          reason: form.reason.trim(),
        },
      });
      toast.success(`Retour créé : ${res.reference}`);
      setForm({ customerName: "", phone: "", email: "", orderReference: "", item: "", reason: "" });
      queryClient.invalidateQueries({ queryKey: ["returns"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création impossible");
    } finally {
      setBusy(false);
    }
  };

  const update = useMutation({
    mutationFn: async ({
      reference,
      status,
      note,
    }: {
      reference: string;
      status: ReturnStatus;
      note?: string;
    }) => {
      await setFn({
        data: { reference, status, ...(note !== undefined ? { note } : {}) },
      });
    },
    onSuccess: (_d, vars) => {
      toast.success(`Statut mis à jour : ${RETURN_STATUS_LABEL[vars.status] ?? vars.status}`);
      queryClient.invalidateQueries({ queryKey: ["returns"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Mise à jour impossible"),
  });

  const saveNote = useMutation({
    mutationFn: async ({
      reference,
      status,
      note,
    }: {
      reference: string;
      status: ReturnStatus;
      note: string;
    }) => {
      await setFn({ data: { reference, status, note } });
    },
    onSuccess: () => {
      toast.success("Note enregistrée");
      queryClient.invalidateQueries({ queryKey: ["returns"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Enregistrement impossible"),
  });

  if (returns.isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement des retours…</p>;
  }

  const rows = returns.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Retours</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Créez une demande de retour pour un client et suivez son traitement ; le client est
          prévenu par WhatsApp/e-mail à chaque changement de statut.
        </p>
      </div>

      <form onSubmit={create} className="space-y-4 rounded-sm border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">Nouvelle demande de retour</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="at-eyebrow mb-2 block">Nom du client</span>
            <input
              className={field}
              value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              required
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-2 block">Téléphone</span>
            <input
              className={field}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+229 …"
              required
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-2 block">E-mail</span>
            <input
              type="email"
              className={field}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-2 block">Référence commande</span>
            <input
              className={field}
              value={form.orderReference}
              onChange={(e) => setForm((f) => ({ ...f, orderReference: e.target.value }))}
              placeholder="ex. AC-2026-0001"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="at-eyebrow mb-2 block">Article concerné</span>
            <input
              className={field}
              value={form.item}
              onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))}
              placeholder="ex. Chargeur 65 W"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="at-eyebrow mb-2 block">Motif du retour</span>
            <textarea
              className={`${field} min-h-24`}
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              required
            />
          </label>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          variant="technical"
          disabled={busy || !form.customerName.trim() || !form.phone.trim() || !form.reason.trim()}
        >
          {busy ? "Création…" : "Créer le retour"}
        </Button>
      </form>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune demande de retour pour le moment.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <ReturnCard
              key={r.id}
              returnRow={r}
              busy={update.isPending || saveNote.isPending}
              onStatus={(status) => update.mutate({ reference: r.reference, status })}
              onSaveNote={(note) =>
                saveNote.mutate({
                  reference: r.reference,
                  status: r.status as ReturnStatus,
                  note,
                })
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ReturnCard({
  returnRow,
  busy,
  onStatus,
  onSaveNote,
}: {
  returnRow: ReturnRow;
  busy: boolean;
  onStatus: (status: ReturnStatus) => void;
  onSaveNote: (note: string) => void;
}) {
  const [note, setNote] = useState(returnRow.note ?? "");

  return (
    <li className="border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-primary/50 px-3 py-1 font-mono text-xs font-bold text-primary">
            {returnRow.reference}
          </span>
          <p className="font-medium">{returnRow.customer_name}</p>
          {returnRow.order_reference ? (
            <span className="font-mono text-xs text-muted-foreground">
              {returnRow.order_reference}
            </span>
          ) : null}
        </div>
        <select
          className={`${field} max-w-44 py-1.5 text-xs`}
          value={returnRow.status}
          disabled={busy}
          onChange={(e) => onStatus(e.target.value as ReturnStatus)}
        >
          {RETURN_STATUS_ORDER.map((value) => (
            <option key={value} value={value}>
              {RETURN_STATUS_LABEL[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span className="text-muted-foreground">{returnRow.phone}</span>
        {returnRow.email ? <span className="text-muted-foreground">{returnRow.email}</span> : null}
        {returnRow.item ? <span>{returnRow.item}</span> : null}
        <span className="text-xs text-muted-foreground">
          {new Date(returnRow.created_at).toLocaleString("fr-FR")}
        </span>
      </div>

      <p className="mt-3 rounded-sm bg-surface p-3 text-sm text-muted-foreground">
        {returnRow.reason}
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <textarea
          className={`${field} min-h-20 max-w-md py-1.5 text-xs`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note interne de l'atelier…"
          maxLength={500}
        />
        <Button
          size="sm"
          disabled={busy || !note.trim() || note.trim() === (returnRow.note ?? "")}
          onClick={() => onSaveNote(note.trim())}
        >
          {busy ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : null}
          Enregistrer
        </Button>
      </div>
    </li>
  );
}

// ===========================================================================
// Atelier — kanban du flux de réparation (temps réel) + KPI avancés
// ===========================================================================

function AtelierBoard() {
  const queryClient = useQueryClient();
  const getBoardFn = useServerFn(getAtelierBoard);
  const assignFn = useServerFn(assignTechnician);

  const board = useQuery({
    queryKey: ["atelier-board"],
    queryFn: () => getBoardFn({ data: {} }),
  });

  const move = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      await setReservationStatus({ data: { id, status } });
    },
    onSuccess: (_d, vars) => {
      toast.success(`Dossier passé en « ${STATUS_LABEL[vars.status] ?? vars.status} »`);
      queryClient.invalidateQueries({ queryKey: ["atelier-board"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["status-history"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Mise à jour impossible"),
  });

  const assign = useMutation({
    mutationFn: async ({
      reservationId,
      technicianId,
    }: {
      reservationId: string;
      technicianId: string;
    }) => assignFn({ data: { reservationId, technicianId } }),
    onSuccess: () => {
      toast.success("Technicien assigné");
      queryClient.invalidateQueries({ queryKey: ["atelier-board"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Assignation impossible"),
  });

  // Temps réel : toute modification de dossier (ailleurs dans l'admin ou par
  // un autre technicien) rafraîchit le board.
  useEffect(() => {
    const channel = supabase
      .channel("atelier-board-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => {
        queryClient.invalidateQueries({ queryKey: ["atelier-board"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const cards = board.data?.reservations ?? [];
  const technicians = board.data?.technicians ?? [];
  const busy = move.isPending || assign.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Atelier — kanban</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Suivez le flux de réparation : chaque changement de statut est immédiat et notifié au
            client.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={board.isFetching}
          onClick={() => queryClient.invalidateQueries({ queryKey: ["atelier-board"] })}
        >
          <RefreshCw className={`mr-2 size-4 ${board.isFetching ? "animate-spin" : ""}`} />
          Rafraîchir
        </Button>
      </div>

      {board.isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement de l'atelier…</p>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="grid min-w-[72rem] grid-cols-6 gap-px border border-border bg-border">
            {ATELIER_STATUSES.map((status) => {
              const columnCards = cards.filter((c) => c.status === status);
              return (
                <div key={status} className="min-h-[26rem] bg-card p-3">
                  <div className="mb-3 flex items-center justify-between gap-2 px-1">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs ${STATUS_TONE[status] ?? ""}`}
                    >
                      {STATUS_LABEL[status] ?? status}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {columnCards.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {columnCards.map((card) => (
                      <AtelierCard
                        key={card.id}
                        card={card}
                        technicians={technicians}
                        busy={busy}
                        onMove={(status) => move.mutate({ id: card.id, status })}
                        onAssign={(technicianId) =>
                          assign.mutate({ reservationId: card.id, technicianId })
                        }
                      />
                    ))}
                    {columnCards.length === 0 && (
                      <p className="rounded-sm border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                        Aucun dossier
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Date de créneau compacte (JJ/MM) pour les cartes du kanban. */
function shortDate(iso: string): string {
  return `${iso.slice(8)}/${iso.slice(5, 7)}`;
}

function AtelierCard({
  card,
  technicians,
  busy,
  onMove,
  onAssign,
}: {
  card: AtelierCard;
  technicians: AtelierTechnician[];
  busy: boolean;
  onMove: (status: Status) => void;
  onAssign: (technicianId: string) => void;
}) {
  const index = ATELIER_STATUSES.findIndex((s) => s === card.status);
  const prev = index > 0 ? (ATELIER_STATUSES[index - 1] ?? null) : null;
  const next =
    index >= 0 && index < ATELIER_STATUSES.length - 1
      ? (ATELIER_STATUSES[index + 1] ?? null)
      : null;
  const paid = card.payment_status === "paid";
  const quotePending = card.quote_status === "approved" && !paid;

  return (
    <div
      className={`rounded-sm border bg-surface p-3 ${
        card.status === "en_attente" ? "border-amber-500/60" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate font-mono text-[10px] text-muted-foreground">{card.reference}</p>
        {card.status === "en_attente" && (
          <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
            Nouveau
          </span>
        )}
      </div>
      <p className="mt-1 text-sm font-semibold leading-snug">{card.device}</p>
      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
        {card.customer_name} · {card.phone}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {shortDate(card.slot_date)} · {card.slot_hour ?? "—"}
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {quotePending && (
          <span className="rounded-full border border-primary/50 px-2 py-0.5 text-[10px] font-medium text-primary">
            Devis {formatFcfa(card.quote_amount ?? 0)}
          </span>
        )}
        {paid && (
          <span className="rounded-full border border-success/50 px-2 py-0.5 text-[10px] font-medium text-success">
            Payé
          </span>
        )}
        {card.sla && (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] ${
              card.sla.remainingDays < 0
                ? "border-destructive/50 text-destructive"
                : "border-border text-muted-foreground"
            }`}
            title={`Restitution estimée : ${card.sla.expectedDate}`}
          >
            SLA {shortDate(card.sla.expectedDate)} ·{" "}
            {card.sla.remainingDays < 0 ? "en retard" : `J-${Math.round(card.sla.remainingDays)}`}
          </span>
        )}
      </div>

      <label htmlFor={`atelier-tech-${card.id}`} className="sr-only">
        Technicien du dossier {card.reference}
      </label>
      <select
        id={`atelier-tech-${card.id}`}
        className={`${field} mt-2 h-8 px-2 py-0 text-xs`}
        value={card.assigned_technician_id ?? ""}
        disabled={busy}
        onChange={(e) => onAssign(e.target.value)}
      >
        <option value="">Non assigné</option>
        {technicians.map((t) => (
          <option key={t.id} value={t.id}>
            {t.full_name ?? "Technicien"}
          </option>
        ))}
      </select>

      <div className="mt-2 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="px-2"
          disabled={busy || !prev}
          aria-label="Étape précédente"
          onClick={() => {
            if (prev) onMove(prev);
          }}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-[10px] text-muted-foreground">
          {STATUS_LABEL[card.status] ?? card.status}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="px-2"
          disabled={busy || !next}
          aria-label="Étape suivante"
          onClick={() => {
            if (next) onMove(next);
          }}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

/** Couleur du graphique « revenus » (orange du thème Allô Techno). */
const REVENUE_CHART_CONFIG = {
  revenu: { label: "Revenus", color: "var(--primary)" },
} satisfies ChartConfig;

function KpisSection() {
  const getKpisFn = useServerFn(getAdminKpis);

  const kpis = useQuery({
    queryKey: ["admin-kpis"],
    queryFn: () => getKpisFn({ data: {} }),
    refetchInterval: 5 * 60 * 1000,
  });

  if (kpis.isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement des indicateurs…</p>;
  }

  if (kpis.isError || !kpis.data) {
    return (
      <div>
        <h2 className="text-lg font-semibold">Indicateurs avancés (KPI)</h2>
        <p className="mt-4 text-sm text-destructive">
          Impossible de charger les indicateurs. Réessayez.
        </p>
      </div>
    );
  }

  const data = kpis.data;
  const totalRevenue = data.dailyRevenue.reduce((sum, d) => sum + d.amount, 0);
  const longestStage = data.avgStageDuration[0]?.avgHours ?? 0;
  const maxFault = data.topFaults[0]?.count ?? 0;
  const { quotesSent, quotesApproved, paid, rate } = data.quoteConversion;
  const approvedShare = quotesSent > 0 ? Math.round((quotesApproved / quotesSent) * 100) : 0;
  const paidShare = quotesSent > 0 ? Math.round((paid / quotesSent) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Indicateurs avancés (KPI)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Revenus encaissés, conversion des devis, durée des étapes et pannes les plus demandées.
          </p>
        </div>
        <ExportPaymentsButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-border bg-card p-4">
          <p className="at-eyebrow">Chiffre d'affaires (30 j)</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{formatFcfa(totalRevenue)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Paiements confirmés (atelier + boutique)
          </p>
        </div>
        <div className="border border-border bg-card p-4">
          <p className="at-eyebrow">Devis envoyés</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{quotesSent}</p>
          <p className="mt-1 text-xs text-muted-foreground">Envoyés ou approuvés</p>
        </div>
        <div className="border border-border bg-card p-4">
          <p className="at-eyebrow">Devis approuvés</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{quotesApproved}</p>
          <p className="mt-1 text-xs text-muted-foreground">Acceptés par le client</p>
        </div>
        <div className="border border-border bg-card p-4">
          <p className="at-eyebrow">Paiements reçus</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{paid}</p>
          <p className="mt-1 text-xs text-muted-foreground">Dossiers réparation payés</p>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="rounded-sm border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Conversion devis → paiement</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Part des devis envoyés qui aboutissent à un paiement.
          </p>
          <p className="mt-4 text-3xl font-bold tabular-nums">{rate}%</p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <span className="w-40 shrink-0 truncate text-muted-foreground">Devis envoyés</span>
              <div className="h-2 flex-1 overflow-hidden rounded-sm bg-surface">
                <div className="h-full bg-primary/70" style={{ width: "100%" }} />
              </div>
              <span className="w-12 text-right font-mono text-xs tabular-nums">{quotesSent}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="w-40 shrink-0 truncate text-muted-foreground">Devis approuvés</span>
              <div className="h-2 flex-1 overflow-hidden rounded-sm bg-surface">
                <div className="h-full bg-primary/70" style={{ width: `${approvedShare}%` }} />
              </div>
              <span className="w-12 text-right font-mono text-xs tabular-nums">
                {quotesApproved}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="w-40 shrink-0 truncate text-muted-foreground">Paiements reçus</span>
              <div className="h-2 flex-1 overflow-hidden rounded-sm bg-surface">
                <div className="h-full bg-success/70" style={{ width: `${paidShare}%` }} />
              </div>
              <span className="w-12 text-right font-mono text-xs tabular-nums">{paid}</span>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Revenus quotidiens (30 jours)</h3>
          <ChartContainer config={REVENUE_CHART_CONFIG} className="mt-4 aspect-auto h-56">
            <BarChart data={data.dailyRevenue}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                fontSize={10}
                tickFormatter={(v) => shortDate(String(v))}
                interval={4}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={10}
                width={48}
                tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent formatter={(value) => formatFcfa(Number(value))} />}
              />
              <Bar
                dataKey="amount"
                fill="var(--color-revenu)"
                radius={[2, 2, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="rounded-sm border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Durée moyenne par étape</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Temps passé dans chaque étape (historique des statuts).
          </p>
          <ul className="mt-4 space-y-2">
            {data.avgStageDuration.map((s) => (
              <li key={s.stage} className="flex items-center gap-3 text-sm">
                <span className="w-44 shrink-0 truncate text-muted-foreground">
                  {STATUS_LABEL[s.stage] ?? s.stage}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-sm bg-surface">
                  <div
                    className="h-full bg-primary/70"
                    style={{
                      width: `${longestStage > 0 ? Math.round((s.avgHours / longestStage) * 100) : 0}%`,
                    }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums">
                  {s.avgHours >= 24 ? `${Math.round(s.avgHours / 24)} j` : `${s.avgHours} h`}
                </span>
              </li>
            ))}
            {data.avgStageDuration.length === 0 && (
              <li className="text-sm text-muted-foreground">Pas encore assez d'historique.</li>
            )}
          </ul>
        </div>

        <div className="rounded-sm border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Pannes les plus estimées</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Catégories de pannes consultées à l'étape estimation du devis en ligne.
          </p>
          <ul className="mt-4 space-y-2">
            {data.topFaults.map((f) => (
              <li key={f.fault} className="flex items-center gap-3 text-sm">
                <span className="flex-1 truncate text-muted-foreground">{f.fault}</span>
                <div className="h-2 w-32 shrink-0 overflow-hidden rounded-sm bg-surface">
                  <div
                    className="h-full bg-primary/70"
                    style={{
                      width: `${maxFault > 0 ? Math.round((f.count / maxFault) * 100) : 0}%`,
                    }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums">
                  {f.count}
                </span>
              </li>
            ))}
            {data.topFaults.length === 0 && (
              <li className="text-sm text-muted-foreground">Pas encore de données.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
