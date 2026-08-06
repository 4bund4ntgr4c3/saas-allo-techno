import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  History,
  Loader2,
  FileDown,
  KeyRound,
  MailPlus,
  RadioTower,
  ShieldAlert,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { QrCode } from "@/components/site/QrCode";
import { PERIOD_LABEL, STATUS_LABEL, formatDateFr } from "@/lib/reservation-schema";
import { setReservationStatus } from "@/lib/admin.functions";
import { confirmOtp, disableOtp, enrollOtp, verifyOtpLogin } from "@/lib/otp.functions";
import {
  downloadInvoicePdf,
  downloadReservationsCsv,
  downloadReservationsPdf,
} from "@/lib/invoice";
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

const field =
  "h-11 w-full rounded-sm border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function AdminPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Status | "toutes">("toutes");
  const [techFilter, setTechFilter] = useState<string>("tous");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState<"dossiers" | "equipe" | "leads" | "analytics" | "securite">(
    "dossiers",
  );
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
          "id, reference, customer_name, phone, email, device, issue, mode, payment, slot_date, slot_period, slot_hour, status, staff_notes, created_at",
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
      r.device.toLowerCase().includes(q);
    const assignedTech = latestTechByReservation.get(r.id)?.technician_id ?? "";
    const matchTech =
      techFilter === "tous" ||
      (techFilter === "non-assigne" ? !assignedTech : assignedTech === techFilter);
    return matchStatus && matchQuery && matchTech;
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
          variant={tab === "analytics" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("analytics")}
        >
          <BarChart3 className="mr-2 size-4" />
          Analytics
        </Button>
        <Button
          variant={tab === "securite" ? "technical" : "outline"}
          size="sm"
          onClick={() => setTab("securite")}
        >
          <ShieldCheck className="mr-2 size-4" />
          Sécurité
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
              placeholder="Rechercher (référence, client, appareil)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <label htmlFor="filter-status" className="sr-only">
              Filtrer par statut
            </label>
            <select
              id="filter-status"
              className={field}
              value={filter}
              onChange={(e) => setFilter(e.target.value as Status | "toutes")}
            >
              <option value="toutes">Tous les statuts</option>
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
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-3">
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
                          assignTech.mutate({ reservationId: r.id, technicianId: e.target.value })
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

                  {openId === r.id ? <StatusHistory reservationId={r.id} /> : null}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tab === "equipe" && <TeamSection />}
      {tab === "leads" && <LeadsSection />}
      {tab === "analytics" && <AnalyticsSection />}
      {tab === "securite" && <SecuritySection />}
    </div>
  );
}

function StatusHistory({ reservationId }: { reservationId: string }) {
  return <StatusHistoryList reservationId={reservationId} />;
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

function LeadsSection() {
  const queryClient = useQueryClient();

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
