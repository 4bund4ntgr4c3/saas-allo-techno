import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { History, Loader2, RadioTower, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PERIOD_LABEL, STATUS_LABEL, formatDateFr } from "@/lib/reservation-schema";
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

const STATUSES: Status[] = ["en_attente", "confirmee", "en_cours", "terminee", "annulee"];

const NEXT_STATUS: Partial<Record<Status, Status>> = {
  en_attente: "confirmee",
  confirmee: "en_cours",
  en_cours: "terminee",
};

const STATUS_TONE: Record<string, string> = {
  en_attente: "border-border text-muted-foreground",
  confirmee: "border-primary/50 text-primary",
  en_cours: "border-primary/50 text-primary",
  terminee: "border-success/50 text-success",
  annulee: "border-destructive/50 text-destructive",
};

const field =
  "h-11 w-full rounded-sm border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function AdminPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Status | "toutes">("toutes");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const access = useQuery({
    queryKey: ["is-staff", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_staff", { _user_id: user.id });
      if (error) throw error;
      return Boolean(data);
    },
  });

  const reservations = useQuery({
    queryKey: ["admin-reservations"],
    enabled: access.data === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select(
          "id, reference, customer_name, phone, email, device, issue, mode, payment, slot_date, slot_period, status, staff_notes, created_at",
        )
        .order("slot_date", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: Status; note?: string }) => {
      const { error } = await supabase.rpc("staff_set_reservation_status", {
        _reservation_id: id,
        _status: status,
        _note: note?.trim() ? note.trim() : undefined,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success(`Statut mis à jour : ${STATUS_LABEL[vars.status]}`);
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["status-history"] });
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
          <Button
            disabled={claimAdmin.isPending}
            onClick={() => claimAdmin.mutate()}
          >
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

  const rows = (reservations.data ?? []).filter((r) => {
    const matchStatus = filter === "toutes" || r.status === filter;
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q ||
      r.reference.toLowerCase().includes(q) ||
      r.customer_name.toLowerCase().includes(q) ||
      r.device.toLowerCase().includes(q);
    return matchStatus && matchQuery;
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Espace interne</p>
        <h1 className="mt-2 text-3xl font-semibold">Administration des dossiers</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Mettez à jour le statut d'une réparation et consultez l'historique des changements.
        </p>
      </header>

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          className={field}
          placeholder="Rechercher (référence, client, appareil)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
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
      </div>

      {reservations.isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement des dossiers…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun dossier ne correspond à ce filtre.</p>
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
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <select
                  className={`${field} max-w-xs`}
                  value={r.status}
                  disabled={updateStatus.isPending}
                  onChange={(e) =>
                    updateStatus.mutate({ id: r.id, status: e.target.value as Status })
                  }
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenId(openId === r.id ? null : r.id)}
                >
                  <History className="mr-2 size-4" />
                  {openId === r.id ? "Masquer l'historique" : "Historique"}
                </Button>
              </div>

              {openId === r.id ? <StatusHistory reservationId={r.id} /> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusHistory({ reservationId }: { reservationId: string }) {
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
