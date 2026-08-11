import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Calendar,
  LayoutGrid,
  ArrowRightLeft,
  Building2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { formatFcfa } from "@/data/catalog";
import { useI18n } from "@/lib/i18n/context";
import { field } from "@/components/admin/primitives/AdminField";
import { AdminCalendar } from "@/components/admin/AdminCalendar";
import {
  ATELIER_STATUSES,
  assignTechnician,
  getAtelierBoard,
  setReservationStatus,
  transferReservation,
  getWorkshopLoad,
  type AtelierCard as AtelierCardType,
  type AtelierTechnician,
  type WorkshopLoad,
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

export function AtelierBoard() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const getBoardFn = useServerFn(getAtelierBoard);
  const assignFn = useServerFn(assignTechnician);
  const transferFn = useServerFn(transferReservation);
  const getLoadFn = useServerFn(getWorkshopLoad);

  const board = useQuery({
    queryKey: ["atelier-board"],
    queryFn: () => getBoardFn({ data: {} }),
  });

  const workshopLoad = useQuery({
    queryKey: ["workshop-load"],
    queryFn: () => getLoadFn(),
  });

  const [workshopFilter, setWorkshopFilter] = useState<string>("all");

  const move = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      await setReservationStatus({ data: { id, status } });
    },
    onSuccess: (_d, vars) => {
      toast.success(t("admin.atelier.statusChanged", [t("admin.status." + vars.status)]));
      queryClient.invalidateQueries({ queryKey: ["atelier-board"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["status-history"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : t("admin.returns.error.updateFailed")),
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
      toast.success(t("admin.atelier.technicianAssigned"));
      queryClient.invalidateQueries({ queryKey: ["atelier-board"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : t("admin.atelier.assignError")),
  });

  const transfer = useMutation({
    mutationFn: async ({
      reservationId,
      targetWorkshopId,
    }: {
      reservationId: string;
      targetWorkshopId: string;
    }) => transferFn({ data: { reservationId, targetWorkshopId } }),
    onSuccess: (result) => {
      if (result?.ok) {
        toast.success(t("admin.atelier.transferred", [result.target_name ?? ""]));
        queryClient.invalidateQueries({ queryKey: ["atelier-board"] });
        queryClient.invalidateQueries({ queryKey: ["workshop-load"] });
      } else {
        toast.error(result?.error ?? t("admin.atelier.transfer.error"));
      }
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : t("admin.atelier.transfer.error")),
  });

  useEffect(() => {
    const channel = supabase
      .channel("atelier-board-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => {
        queryClient.invalidateQueries({ queryKey: ["atelier-board"] });
        queryClient.invalidateQueries({ queryKey: ["workshop-load"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const allCards = board.data?.reservations ?? [];
  const technicians = board.data?.technicians ?? [];
  const workshops = workshopLoad.data ?? [];
  const busy = move.isPending || assign.isPending || transfer.isPending;
  const [view, setView] = useState<"kanban" | "calendar">("kanban");

  const cards =
    workshopFilter === "all"
      ? allCards
      : allCards.filter(
          (c) => (c as AtelierCardType & { workshop_id?: string }).workshop_id === workshopFilter,
        );

  const calendarEvents = cards.map((c) => ({
    id: c.id,
    date: c.slot_date ?? "",
    period: c.slot_hour ?? "",
    reference: c.reference,
    device: c.device,
    customerName: c.customer_name,
    status: c.status,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="at-eyebrow">{t("admin.atelier.eyebrow")}</p>
          <h2 className="mt-1 text-xl font-semibold">
            {view === "kanban" ? t("admin.atelier.title.kanban") : t("admin.atelier.title.calendar")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("admin.atelier.description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={workshopFilter}
            onChange={(e) => setWorkshopFilter(e.target.value)}
            className="h-9 rounded-sm border border-border bg-card px-3 text-xs font-medium focus:outline-none"
          >
            <option value="all">{t("admin.atelier.filter.all")}</option>
            {workshops.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.active_count})
              </option>
            ))}
          </select>
          <div className="flex rounded-md border border-border">
            <Button
              variant={view === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("kanban")}
            >
              <LayoutGrid className="size-3" />
              {t("admin.atelier.view.kanban")}
            </Button>
            <Button
              variant={view === "calendar" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("calendar")}
            >
              <Calendar className="size-3" />
              {t("admin.atelier.view.calendar")}
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={board.isFetching}
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["atelier-board"] });
              queryClient.invalidateQueries({ queryKey: ["workshop-load"] });
            }}
          >
            <RefreshCw className={`mr-2 size-4 ${board.isFetching ? "animate-spin" : ""}`} />
            Rafraîchir
          </Button>
        </div>
      </div>

      {workshops.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {workshops.map((w) => (
            <Button
              key={w.id}
              variant={w.id === workshopFilter ? "secondary" : "outline"}
              size="sm"
              className="h-auto flex-col items-start p-3"
              onClick={() => setWorkshopFilter(w.id === workshopFilter ? "all" : w.id)}
            >
              <div className="flex items-center gap-2">
                <Building2 className="size-3 text-muted-foreground" />
                <span className="text-xs font-bold">{w.name}</span>
              </div>
              <div className="mt-2 flex gap-3 font-mono text-[10px] text-muted-foreground">
                <span>{w.active_count} {t("admin.atelier.load.active")}</span>
                <span>{w.in_progress_count} {t("admin.atelier.load.progress")}</span>
                <span>{w.pending_count} {t("admin.atelier.load.pending")}</span>
              </div>
            </Button>
          ))}
        </div>
      )}

      {board.isLoading ? (
        <p className="text-sm text-muted-foreground">{t("admin.atelier.loading")}</p>
      ) : view === "calendar" ? (
        <AdminCalendar events={calendarEvents} />
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
                      {t("admin.status." + status)}
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
                        workshops={workshops}
                        busy={busy}
                        onMove={(status) => move.mutate({ id: card.id, status })}
                        onAssign={(technicianId) =>
                          assign.mutate({ reservationId: card.id, technicianId })
                        }
                        onTransfer={(targetWorkshopId) =>
                          transfer.mutate({ reservationId: card.id, targetWorkshopId })
                        }
                      />
                    ))}
                    {columnCards.length === 0 && (
                      <p className="rounded-sm border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                        {t("admin.atelier.empty")}
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
  workshops,
  busy,
  onMove,
  onAssign,
  onTransfer,
}: {
  card: AtelierCardType;
  technicians: AtelierTechnician[];
  workshops: WorkshopLoad[];
  busy: boolean;
  onMove: (status: Status) => void;
  onAssign: (technicianId: string) => void;
  onTransfer: (targetWorkshopId: string) => void;
}) {
  const { t } = useI18n();
  const index = ATELIER_STATUSES.findIndex((s) => s === card.status);
  const prev = index > 0 ? (ATELIER_STATUSES[index - 1] ?? null) : null;
  const next =
    index >= 0 && index < ATELIER_STATUSES.length - 1
      ? (ATELIER_STATUSES[index + 1] ?? null)
      : null;
  const paid = card.payment_status === "paid";
  const quotePending = card.quote_status === "approved" && !paid;
  const cardWorkshopId = (card as AtelierCardType & { workshop_id?: string }).workshop_id;
  const otherWorkshops = workshops.filter((w) => w.id !== cardWorkshopId && w.active);

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
            {t("admin.atelier.badge.new")}
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
            {t("admin.atelier.badge.quote", [formatFcfa(card.quote_amount ?? 0)])}
          </span>
        )}
        {paid && (
          <span className="rounded-full border border-success/50 px-2 py-0.5 text-[10px] font-medium text-success">
            {t("admin.atelier.badge.paid")}
          </span>
        )}
        {card.sla && (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] ${
              card.sla.remainingDays < 0
                ? "border-destructive/50 text-destructive"
                : "border-border text-muted-foreground"
            }`}
            title={t("admin.atelier.sla.estimatedReturn", [card.sla.expectedDate])}
          >
            SLA {shortDate(card.sla.expectedDate)} ·{" "}
            {card.sla.remainingDays < 0 ? t("admin.atelier.sla.overdue") : t("admin.atelier.sla.countdown", [Math.round(card.sla.remainingDays)])}
          </span>
        )}
      </div>

      <label htmlFor={`atelier-tech-${card.id}`} className="sr-only">
        {t("admin.atelier.technicianAria", [card.reference])}
      </label>
      <select
        id={`atelier-tech-${card.id}`}
        className={`${field} mt-2 h-8 px-2 py-0.5 text-xs`}
        value={card.assigned_technician_id ?? ""}
        disabled={busy}
        onChange={(e) => onAssign(e.target.value)}
      >
        <option value="">{t("admin.atelier.unassigned")}</option>
        {technicians.map((tech) => (
          <option key={tech.id} value={tech.id}>
            {tech.full_name ?? t("admin.atelier.technicianFallback")}
          </option>
        ))}
      </select>

      {otherWorkshops.length > 0 && (
        <div className="mt-2 flex items-center gap-1">
          <ArrowRightLeft className="size-3 text-muted-foreground" />
          <select
            className="h-7 flex-1 rounded-sm border border-border bg-card px-1.5 text-[10px] focus:outline-none"
            value=""
            disabled={busy}
            onChange={(e) => {
              if (e.target.value) onTransfer(e.target.value);
            }}
          >
            <option value="">{t("admin.atelier.transferPlaceholder")}</option>
            {otherWorkshops.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.active_count})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="px-2"
          disabled={busy || !prev}
          aria-label={t("admin.atelier.prevStep")}
          onClick={() => {
            if (prev) onMove(prev);
          }}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-[10px] text-muted-foreground">
          {t("admin.status." + card.status)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="px-2"
          disabled={busy || !next}
          aria-label={t("admin.atelier.nextStep")}
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
