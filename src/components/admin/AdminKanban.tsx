import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Building2, History, Loader2, Banknote, ImagePlus, FileDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatDateFr } from "@/lib/reservation-schema";
import { getReservationQuote } from "@/lib/admin.functions";
import { sendQuote } from "@/lib/quote.functions";
import { addStagePhoto, getStaffPhotoUpload } from "@/lib/photos.functions";
import { downloadQuotePdf } from "@/lib/invoice";
import { logAudit } from "@/lib/audit";
import { useI18n } from "@/lib/i18n/context";
import { field } from "@/components/admin/primitives/AdminField";
import { formatFcfa } from "@/data/catalog";
import { Route } from "@/routes/_authenticated/admin";
import type { Enums } from "@/integrations/supabase/types";

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

const PHOTO_STAGES = ["diagnostic", "pieces", "repair"] as const;

type KanbanRow = {
  id: string;
  reference: string;
  customer_name: string;
  device: string;
  phone: string;
  slot_date: string;
  slot_period: Enums<"slot_period">;
  status: Status;
  org_id?: string | null;
};

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
  const { t } = useI18n();
  const [address, setAddress] = useState(r.delivery_address ?? "");
  const DELIVERY_LABELS: Record<Enums<"delivery_status">, string> = {
    non_applicable: t("admin.kanban.delivery.nonApplicable"),
    a_planifier: t("admin.kanban.delivery.toPlan"),
    en_route: t("admin.kanban.delivery.inTransit"),
    livre: t("admin.kanban.delivery.delivered"),
  };
  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">{t("admin.kanban.delivery.label")}</span>
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
          {Object.entries(DELIVERY_LABELS).map(([value, label]) => (
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
            placeholder={t("admin.kanban.delivery.addressPlaceholder")}
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
            {t("admin.kanban.delivery.saveAddress")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function KanbanBoard({
  rows,
  updateStatus,
  orgName,
}: {
  rows: KanbanRow[];
  updateStatus: (v: { id: string; status: Status }) => void;
  orgName?: Map<string, string>;
}) {
  const { t, locale } = useI18n();
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
                {t("admin.status." + status)}
              </span>
              <span className="font-mono text-xs text-muted-foreground">{columnRows.length}</span>
            </div>
            <div className="space-y-2">
              {columnRows.map((r) => (
                <Button
                  key={r.id}
                  variant="ghost"
                  size="sm"
                  draggable
                  onDragStart={() => setDragId(r.id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverCol(null);
                  }}
                  className="block w-full cursor-grab border border-border bg-surface p-3 text-left transition-shadow hover:shadow-md active:cursor-grabbing"
                >
                  <p className="font-mono text-[10px] text-muted-foreground">{r.reference}</p>
                  {r.org_id && (
                    <p className="mt-1 inline-flex items-center gap-1 border border-border bg-muted px-2 py-0.5 text-[10px] font-medium">
                      <Building2 className="size-3 text-muted-foreground" />
                      {orgName?.get(r.org_id) ?? "B2B"}
                    </p>
                  )}
                  <p className="mt-1 text-sm font-semibold leading-snug">
                    {r.customer_name} — {r.device}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatDateFr(r.slot_date, locale)} · {t("admin.period." + r.slot_period)} · {r.phone}
                  </p>
                </Button>
              ))}
              {columnRows.length === 0 && (
                <p className="rounded-sm border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                  {t("admin.kanban.empty")}
                </p>
              )}
            </div>
          </div>
        );
      })}
      <p className="bg-card p-3 text-xs text-muted-foreground sm:col-span-2 lg:col-span-4">
        {t("admin.kanban.dragHelp")}
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
  const { t } = useI18n();
  const [status, setStatus] = useState<Status>(current);
  const [note, setNote] = useState("");
  const next = NEXT_STATUS[current];
  const dirty = status !== current;

  useEffect(() => {
    setStatus(current);
  }, [current]);

  return (
    <div className="mt-4 space-y-3" data-tour="admin-status">
      <div className="flex flex-wrap items-center gap-3">
        <select
          className={`${field} max-w-xs`}
          value={status}
          disabled={pending}
          onChange={(e) => setStatus(e.target.value as Status)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t("admin.status." + s)}
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
          {t("admin.kanban.apply")}
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
            {t("admin.kanban.moveToNext", [t("admin.status." + next)])}
          </Button>
        ) : null}
        <Button variant="outline" size="sm" onClick={onToggleHistory}>
          <History className="mr-2 size-4" />
          {historyOpen ? t("admin.kanban.hideHistory") : t("admin.kanban.history")}
        </Button>
      </div>
      <textarea
        className="min-h-16 w-full border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        placeholder={t("admin.kanban.notePlaceholder")}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
    </div>
  );
}

function StatusHistoryList({ reservationId }: { reservationId: string }) {
  const { t } = useI18n();
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
    return <p className="mt-4 text-sm text-muted-foreground">{t("admin.kanban.historyLoading")}</p>;
  }

  const rows = history.data ?? [];
  if (rows.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">{t("admin.kanban.historyEmpty")}</p>;
  }

  return (
    <ol className="mt-4 space-y-2 border-t border-border pt-4">
      {rows.map((h) => (
        <li key={h.id} className="flex flex-wrap items-baseline gap-2 text-sm">
          <time className="font-mono text-xs text-muted-foreground">
            {new Date(h.created_at).toLocaleString(t("locale") as string)}
          </time>
          <span>
            {h.old_status ? `${t("admin.status." + h.old_status)} → ` : t("admin.kanban.history.creation")}
            <strong>{t("admin.status." + h.new_status)}</strong>
          </span>
          {h.note ? <span className="text-muted-foreground">— {h.note}</span> : null}
        </li>
      ))}
    </ol>
  );
}

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
  const { user } = Route.useRouteContext();
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
        throw new Error(t("admin.kanban.quote.amountInvalid"));
      }
      const finalAmount = warranty === 12 ? Math.round(parsed * 1.15) : Math.round(parsed);
      await sendQuoteFn({
        data: { reservationId, amount: finalAmount, warrantyMonths: warranty },
      });
    },
    onSuccess: () => {
      toast.success(t("admin.kanban.quote.sentSuccess"));
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["reservation-quote", reservationId] });
      void logAudit(supabase as never, {
        user_id: user.id,
        action: "quote.sent",
        entity: "reservation",
        entity_id: reservationId,
        details: { reference },
      });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : t("admin.kanban.quote.sendError")),
  });

  const status = quote.data?.quote_status ?? "none";
  const sentAmount = quote.data?.quote_amount;

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Banknote className="size-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">{t("admin.kanban.quote.label")}</span>
        <span className="font-medium">{status === "none" ? t("admin.kanban.quote.none") : status}</span>
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
            {t("admin.kanban.quote.amountLabel")}
          </label>
          <input
            id={`quote-amount-${reservationId}`}
            type="number"
            min={0}
            step={500}
            className={`${field} max-w-40 py-1.5 text-xs`}
            placeholder={t("admin.kanban.quote.amountPlaceholder")}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor={`quote-warranty-${reservationId}`}
            className="mb-1 block text-[11px] text-muted-foreground"
          >
            {t("admin.kanban.quote.extendedWarranty")}
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
          {send.isPending ? t("admin.kanban.quote.sending") : t("admin.kanban.quote.send")}
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
            aria-label={t("admin.kanban.quote.pdfAria", [reference])}
          >
            <FileDown className="mr-1 size-3.5" />
            PDF
          </Button>
        )}
      </div>
    </div>
  );
}

function PhotoPanel({ reservationId }: { reservationId: string }) {
  const { t } = useI18n();
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
      const stageLabels: Record<string, string> = {
        diagnostic: t("admin.kanban.photoStage.diagnostic"),
        pieces: t("admin.kanban.photoStage.pieces"),
        repair: t("admin.kanban.photoStage.repair"),
      };
      toast.success(t("admin.kanban.photo.addedSuccess", [stageLabels[vars.stage] ?? vars.stage]));
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : t("admin.kanban.photo.uploadError");
      if (message.includes("code d'authentification")) {
        toast.error(t("admin.kanban.photo.authRequired"));
      } else {
        toast.error(message);
      }
    },
  });

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <ImagePlus className="size-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">{t("admin.kanban.photo.label")}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        {PHOTO_STAGES.map((stage) => (
          <label
            key={stage}
            className="flex cursor-pointer items-center gap-2 border border-border px-3 py-1.5 text-xs hover:bg-surface"
          >
            <span className="text-muted-foreground">{t(`admin.kanban.photoStage.${stage}` as any)}</span>
            {busyStage === stage ? (
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            ) : (
              <span className="text-primary underline">{t("admin.catalog.button.add")}</span>
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

export {
  StatusHistory,
  DeliveryBlock,
  KanbanBoard,
  StageControls,
  StatusHistoryList,
  QuotePanel,
  PhotoPanel,
};
export type { KanbanRow, Status };
export {
  STATUSES,
  NEXT_STATUS,
  STATUS_TONE,
  PHOTO_STAGES,
};
