import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FileDown, LayoutGrid, RadioTower, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PERIOD_LABEL, STATUS_LABEL, formatDateFr } from "@/lib/reservation-schema";
import { setReservationStatus } from "@/lib/admin.functions";
import { setDeliveryStatus } from "@/lib/delivery.functions";
import { downloadInvoicePdf, downloadReservationsCsv, downloadReservationsPdf } from "@/lib/invoice";
import { logAudit } from "@/lib/audit";
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
import { CsvExportButton } from "@/components/admin/AdminLeadsClaims";
import { field } from "@/components/admin/primitives/AdminField";
import { AdminSkeleton } from "@/components/admin/primitives/AdminSkeleton";
import { AdminEmptyState } from "@/components/admin/primitives/AdminEmptyState";
import { useRouteContext } from "@tanstack/react-router";

type Status = Enums<"reservation_status">;

export function DossiersSection() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [filter, setFilter] = useState<Status | "toutes">("toutes");
  const [techFilter, setTechFilter] = useState<string>("tous");
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<"liste" | "kanban">("liste");

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
    enabled: !isTechnicien,
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
    mutationFn: async ({ reservationId, technicianId }: { reservationId: string; technicianId: string }) => {
      const { error } = await supabase.from("technician_assignments").insert({
        reservation_id: reservationId,
        technician_id: technicianId || null,
        assigned_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("admin.dossier.technicianAssigned"));
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      void logAudit(supabase as never, {
        user_id: user.id,
        action: "reservation.assigned",
        entity: "reservation",
        details: {},
      });
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : t("admin.dossier.assignError")),
  });

  const reservations = useQuery({
    queryKey: ["admin-reservations", isTechnicien ? user.id : "all"],
    queryFn: async () => {
      let q = supabase
        .from("reservations")
        .select(
          "id, reference, customer_name, phone, email, device, issue, mode, payment, slot_date, slot_period, slot_hour, status, delivery_status, delivery_address, staff_notes, created_at, assigned_technician_id",
        )
        .order("slot_date", { ascending: false })
        .limit(200);
      if (isTechnicien) {
        q = q.eq("assigned_technician_id" as never, user.id);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: Status; note?: string }) => {
      await setReservationStatus({ data: { id, status, note: note || undefined } });
    },
    onSuccess: (_d, vars) => {
      toast.success(t("admin.dossier.statusUpdated", [STATUS_LABEL[vars.status] ?? vars.status]));
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["status-history"] });
      void logAudit(supabase as never, {
        user_id: user.id,
        action: vars.status === "annulee" ? "reservation.cancelled" : "reservation.status_changed",
        entity: "reservation",
        entity_id: vars.id,
        details: { status: vars.status, note: vars.note },
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : t("admin.dossier.updateError");
      if (message.includes("code d'authentification")) {
        sessionStorage.removeItem("at-otp-unlocked");
        toast.error(t("admin.dossier.otpExpired"));
      } else {
        toast.error(message);
      }
    },
  });

  const setDeliveryStatusFn = useServerFn(setDeliveryStatus);
  const updateDelivery = useMutation({
    mutationFn: async ({ reservationId, status, address }: { reservationId: string; status: Enums<"delivery_status">; address?: string }) => {
      await setDeliveryStatusFn({ data: { reservationId, status, address } });
    },
    onSuccess: () => {
      toast.success(t("admin.dossier.deliveryUpdated"));
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : t("admin.dossier.updateError")),
  });

  const latestTechByReservation = new Map<string, { technician_id: string | null; created_at: string }>();
  for (const a of assignments.data ?? []) {
    if (!latestTechByReservation.has(a.reservation_id)) {
      latestTechByReservation.set(a.reservation_id, { technician_id: a.technician_id, created_at: a.created_at });
    }
  }
  const technicianName = new Map((technicians.data ?? []).map((tech) => [tech.id, tech.full_name ?? t("admin.dossier.technician")]));

  const rows = (reservations.data ?? []).filter((r) => {
    const matchStatus = filter === "toutes" || r.status === filter;
    const q = query.trim().toLowerCase();
    const matchQuery = !q || r.reference.toLowerCase().includes(q) || r.customer_name.toLowerCase().includes(q) || r.device.toLowerCase().includes(q) || r.issue.toLowerCase().includes(q);
    const assignedTech = latestTechByReservation.get(r.id)?.technician_id ?? "";
    const matchTech = techFilter === "tous" || (techFilter === "non-assigne" ? !assignedTech : assignedTech === techFilter);
    const matchDateFrom = !dateFrom || r.slot_date >= dateFrom;
    const matchDateTo = !dateTo || r.slot_date <= dateTo;
    return matchStatus && matchQuery && matchTech && matchDateFrom && matchDateTo;
  });

  const hasFilters = filter !== "toutes" || query || dateFrom || dateTo || techFilter !== "tous";

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{t("admin.tab.dossiers")}</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
            <RadioTower className="size-3 animate-pulse" />
            {t("admin.header.live")}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{t("admin.header.subtitle")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          id="admin-search"
          className={field}
          placeholder={t("admin.filters.search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select id="filter-status" className={field} value={filter} onChange={(e) => setFilter(e.target.value as Status | "toutes")}>
          <option value="toutes">{t("admin.filters.all")}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
        {!isTechnicien && (
          <select id="filter-tech" className={field} value={techFilter} onChange={(e) => setTechFilter(e.target.value)}>
            <option value="tous">{t("admin.dossier.allTechs")}</option>
            <option value="non-assigne">{t("admin.dossier.unassigned")}</option>
            {(technicians.data ?? []).map((tech) => (
              <option key={tech.id} value={tech.id}>{tech.full_name ?? t("admin.dossier.technician")}</option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-2">
          <input id="filter-date-from" type="date" className={field} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input id="filter-date-to" type="date" className={field} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <Button variant="outline" size="sm" onClick={() => setView(view === "liste" ? "kanban" : "liste")}>
          <LayoutGrid className="size-4" /> {view === "liste" ? t("admin.dossier.kanbanView") : t("admin.dossier.listView")}
        </Button>
      </div>

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-muted-foreground">{t("admin.filters.results", [rows.length])}</span>
          <Button variant="ghost" size="sm" onClick={() => { setFilter("toutes"); setQuery(""); setDateFrom(""); setDateTo(""); setTechFilter("tous"); }}>
            {t("admin.filters.clear")}
          </Button>
        </div>
      )}

      {view === "kanban" ? (
        <KanbanBoard rows={rows} updateStatus={updateStatus.mutate} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <CsvExportButton serverFn={exportReservationsCsv} filenamePrefix="dossiers" label={t("admin.export.dossiers")} />
            <Button variant="outline" size="sm" disabled={rows.length === 0} onClick={() => downloadReservationsCsv(rows)}>
              <FileDown className="mr-2 size-4" /> CSV ({rows.length})
            </Button>
            <Button variant="outline" size="sm" disabled={rows.length === 0} onClick={() => downloadReservationsPdf(rows)}>
              <FileDown className="mr-2 size-4" /> PDF ({rows.length})
            </Button>
          </div>

          {reservations.isLoading ? (
            <AdminSkeleton rows={5} />
          ) : rows.length === 0 ? (
            <AdminEmptyState
              icon={<Wrench className="size-6" />}
              title={t("admin.dossier.empty")}
              description={t("admin.dossier.emptyDesc")}
            />
          ) : (
            <ul className="space-y-4">
              {rows.map((r) => (
                <li key={r.id} className="rounded-sm border border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-sm text-muted-foreground">{r.reference}</p>
                      <h2 className="text-lg font-semibold">{r.customer_name} — {r.device}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{r.issue}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateFr(r.slot_date)} · {PERIOD_LABEL[r.slot_period]} · {r.phone}
                      </p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs ${STATUS_TONE[r.status] ?? ""}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => downloadInvoicePdf(r)}>
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
                      reservationId={r.id} reference={r.reference} customer_name={r.customer_name}
                      phone={r.phone} email={r.email} device={r.device} issue={r.issue} created_at={r.created_at}
                    />
                  )}

                  {!isTechnicien && <PhotoPanel reservationId={r.id} />}

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                    <Wrench className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{t("admin.dossier.technician")} :</span>
                    {isTechnicien ? (
                      <strong>{latestTechByReservation.get(r.id)?.technician_id === user.id ? t("admin.dossier.you") : t("admin.dossier.notAssignedToYou")}</strong>
                    ) : (
                      <select
                        className={`${field} max-w-56 py-1.5 text-xs`}
                        value={latestTechByReservation.get(r.id)?.technician_id ?? ""}
                        disabled={assignTech.isPending}
                        onChange={(e) => assignTech.mutate({ reservationId: r.id, technicianId: e.target.value })}
                      >
                        <option value="">{t("admin.dossier.unassigned")}</option>
                        {(technicians.data ?? []).map((tech) => (
                          <option key={tech.id} value={tech.id}>{tech.full_name ?? t("admin.dossier.technician")}</option>
                        ))}
                      </select>
                    )}
                    <span className="text-muted-foreground">
                      {latestTechByReservation.get(r.id) ? (technicianName.get(latestTechByReservation.get(r.id)?.technician_id ?? "") ?? "") : ""}
                    </span>
                  </div>

                  {r.mode === "domicile" && !isTechnicien && (
                    <DeliveryBlock r={r} pending={updateDelivery.isPending} onUpdate={(v) => updateDelivery.mutate(v)} />
                  )}

                  {openId === r.id ? <StatusHistory reservationId={r.id} /> : null}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
