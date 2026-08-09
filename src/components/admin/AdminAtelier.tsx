import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { formatFcfa } from "@/data/catalog";
import { STATUS_LABEL } from "@/lib/reservation-schema";
import {
  ATELIER_STATUSES,
  assignTechnician,
  getAtelierBoard,
  setReservationStatus,
  type AtelierCard as AtelierCardType,
  type AtelierTechnician,
} from "@/lib/admin.functions";

type Status = Enums<"reservation_status">;

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

export function AtelierBoard() {
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

export function shortDate(iso: string): string {
  return `${iso.slice(8)}/${iso.slice(5, 7)}`;
}

export function AtelierCard({
  card,
  technicians,
  busy,
  onMove,
  onAssign,
}: {
  card: AtelierCardType;
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
        className={`${field} mt-2 h-8 px-2 py-0.5 text-xs`}
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
