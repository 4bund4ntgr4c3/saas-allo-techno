import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Building2,
  FileDown,
  LayoutGrid,
  RadioTower,
  Wrench,
  Tag,
  ClipboardCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatDateFr } from "@/lib/reservation-schema";
import {
  createTechnicianAssignment,
  getAdminAssignments,
  getAdminOrganizations,
  getAdminReservations,
  getAdminReservationsPage,
  getAdminTechnicians,
  setReservationStatus,
  type AtelierCard as AtelierCardType,
  type AtelierChecklist,
} from "@/lib/admin.functions";
import { setDeliveryStatus } from "@/lib/delivery.functions";
import {
  downloadInvoicePdf,
  downloadReservationsCsv,
  downloadReservationsPdf,
} from "@/lib/invoice";
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
import { AdminDeviceLabel, type DeviceLabelData } from "@/components/admin/AdminDeviceLabel";
import { AdminQuickContact } from "@/components/admin/AdminQuickContact";
import { AdminChecklistModal } from "@/components/admin/AdminChecklistModal";
import { useRouteContext } from "@tanstack/react-router";

type Status = Enums<"reservation_status">;

export function DossiersSection() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const queryClient = useQueryClient();
  const { t, locale } = useI18n();
  const [filter, setFilter] = useState<Status | "toutes">("toutes");
  const [techFilter, setTechFilter] = useState<string>("tous");
  const [typeFilter, setTypeFilter] = useState<"tous" | "b2b" | "particulier">("tous");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 50;
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<"liste" | "kanban">("liste");
  const [labelTarget, setLabelTarget] = useState<DeviceLabelData | null>(null);
  const [checklistTarget, setChecklistTarget] = useState<{
    id: string;
    reference: string;
    device: string;
    type: "intake" | "qa";
    initial?: AtelierChecklist["items"] | null;
  } | null>(null);

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

  const getAssignmentsFn = useServerFn(getAdminAssignments);
  const assignments = useQuery({
    queryKey: ["assignments"],
    queryFn: () => getAssignmentsFn({ data: undefined }),
  });

  const getTechniciansFn = useServerFn(getAdminTechnicians);
  const technicians = useQuery({
    queryKey: ["technicians"],
    enabled: !isTechnicien,
    queryFn: () => getTechniciansFn({ data: undefined }),
  });

  const getOrganizationsFn = useServerFn(getAdminOrganizations);
  const organizations = useQuery({
    queryKey: ["organizations"],
    enabled: !isTechnicien,
    queryFn: () => getOrganizationsFn({ data: undefined }),
  });
  const orgName = new Map((organizations.data ?? []).map((o) => [o.id, o.name]));

  const assignTechFn = useServerFn(createTechnicianAssignment);
  const assignTech = useMutation({
    mutationFn: async ({
      reservationId,
      technicianId,
    }: {
      reservationId: string;
      technicianId: string;
    }) => {
      await assignTechFn({ data: { reservationId, technicianId } });
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
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : t("admin.dossier.assignError")),
  });

  const getReservationsFn = useServerFn(getAdminReservations);
  const reservations = useQuery({
    queryKey: ["admin-reservations", isTechnicien ? user.id : "all"],
    queryFn: () => getReservationsFn({ data: undefined }),
  });

  const getReservationsPageFn = useServerFn(getAdminReservationsPage);
  const reservationsPage = useQuery({
    queryKey: [
      "admin-reservations-page",
      page,
      filter,
      debouncedQuery,
      dateFrom,
      dateTo,
      typeFilter,
      techFilter,
      isTechnicien ? user.id : "all",
    ],
    enabled: view === "liste",
    queryFn: () =>
      getReservationsPageFn({
        data: {
          page,
          perPage: PER_PAGE,
          status: filter === "toutes" ? undefined : filter,
          q: debouncedQuery || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          type: typeFilter,
          techFilter: techFilter === "tous" ? undefined : techFilter,
        },
      }),
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [filter, techFilter, typeFilter, debouncedQuery, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil((reservationsPage.data?.total ?? 0) / PER_PAGE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: Status; note?: string }) => {
      await setReservationStatus({ data: { id, status, note: note || undefined } });
    },
    onSuccess: (_d, vars) => {
      toast.success(t("admin.dossier.statusUpdated", [t("admin.status." + vars.status)]));
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
      toast.success(t("admin.dossier.deliveryUpdated"));
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : t("admin.dossier.updateError")),
  });

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
    (technicians.data ?? []).map((tech) => [
      tech.id,
      tech.full_name ?? t("admin.dossier.technician"),
    ]),
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
    const matchType =
      typeFilter === "tous" || (typeFilter === "b2b" ? Boolean(r.org_id) : !r.org_id);
    return matchStatus && matchQuery && matchTech && matchDateFrom && matchDateTo && matchType;
  });

  const hasFilters =
    filter !== "toutes" ||
    query ||
    dateFrom ||
    dateTo ||
    techFilter !== "tous" ||
    typeFilter !== "tous";

  const rowsWithOrg = rows.map((r) => ({
    ...r,
    org_name: r.org_id ? (orgName.get(r.org_id) ?? "") : "",
  }));

  const pageRows = reservationsPage.data?.rows ?? [];
  const pageTotal = reservationsPage.data?.total ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="at-eyebrow">{t("admin.dossiers.eyebrow")}</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">{t("admin.tab.dossiers")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.header.subtitle")}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 border border-success/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
          <RadioTower className="size-3 animate-pulse" />
          {t("admin.header.live")}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]" data-tour="admin-filters">
        <input
          id="admin-search"
          className={field}
          placeholder={t("admin.filters.search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          id="filter-status"
          className={field}
          value={filter}
          onChange={(e) => setFilter(e.target.value as Status | "toutes")}
        >
          <option value="toutes">{t("admin.filters.all")}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t("admin.status." + s)}
            </option>
          ))}
        </select>
        {!isTechnicien && (
          <select
            id="filter-tech"
            className={field}
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
          >
            <option value="tous">{t("admin.dossier.allTechs")}</option>
            <option value="non-assigne">{t("admin.dossier.unassigned")}</option>
            {(technicians.data ?? []).map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.full_name ?? t("admin.dossier.technician")}
              </option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-2">
          <input
            id="filter-date-from"
            type="date"
            className={field}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <input
            id="filter-date-to"
            type="date"
            className={field}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        {!isTechnicien && (
          <select
            id="filter-type"
            className={field}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "tous" | "b2b" | "particulier")}
          >
            <option value="tous">{t("admin.dossier.allTypes")}</option>
            <option value="b2b">{t("admin.dossier.typeB2B")}</option>
            <option value="particulier">{t("admin.dossier.typeRetail")}</option>
          </select>
        )}
        <Button
          variant="outline"
          size="sm"
          data-tour="admin-kanban-toggle"
          onClick={() => setView(view === "liste" ? "kanban" : "liste")}
        >
          <LayoutGrid className="size-4" />{" "}
          {view === "liste" ? t("admin.dossier.kanbanView") : t("admin.dossier.listView")}
        </Button>
      </div>

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-3">
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
              setTypeFilter("tous");
            }}
          >
            {t("admin.filters.clear")}
          </Button>
        </div>
      )}

      {view === "kanban" ? (
        <KanbanBoard rows={rows} updateStatus={updateStatus.mutate} orgName={orgName} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3" data-tour="admin-export">
            <CsvExportButton
              serverFn={exportReservationsCsv}
              filenamePrefix="dossiers"
              label={t("admin.export.dossiers")}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={rows.length === 0}
              onClick={() => downloadReservationsCsv(rowsWithOrg)}
            >
              <FileDown className="mr-2 size-4" /> CSV ({rows.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={rows.length === 0}
              onClick={() => downloadReservationsPdf(rowsWithOrg)}
            >
              <FileDown className="mr-2 size-4" /> PDF ({rows.length})
            </Button>
          </div>

          {reservationsPage.isLoading && pageRows.length === 0 ? (
            <AdminSkeleton rows={5} />
          ) : pageRows.length === 0 ? (
            <AdminEmptyState
              icon={<Wrench className="size-6" />}
              title={t("admin.dossier.empty")}
              description={t("admin.dossier.emptyDesc")}
            />
          ) : (
            <>
              <ul className="space-y-4">
                {pageRows.map((r) => (
                  <li key={r.id} className="rounded-sm border border-border bg-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-sm text-muted-foreground">{r.reference}</p>
                        <h2 className="text-lg font-semibold">
                          {r.customer_name} — {r.device}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">{r.issue}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDateFr(r.slot_date, locale)} · {t("admin.period." + r.slot_period)}{" "}
                          · {r.phone}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs ${STATUS_TONE[r.status] ?? ""}`}
                      >
                        {t("admin.status." + r.status)}
                      </span>
                      {r.org_id && orgName.get(r.org_id) && (
                        <span className="inline-flex items-center gap-1.5 border border-border bg-muted px-3 py-1 text-xs font-medium">
                          <Building2 className="size-3.5 text-muted-foreground" />
                          {orgName.get(r.org_id)}
                        </span>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <AdminQuickContact data={r} />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLabelTarget(r)}
                          className="text-xs gap-1"
                          title="Imprimer l'étiquette atelier"
                        >
                          <Tag className="size-3.5" />
                          <span>Étiquette</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setChecklistTarget({
                              id: r.id,
                              reference: r.reference,
                              device: r.device,
                              type:
                                r.status === "pret" ||
                                r.status === "livre" ||
                                r.status === "terminee"
                                  ? "qa"
                                  : "intake",
                              initial:
                                r.status === "pret" ||
                                r.status === "livre" ||
                                r.status === "terminee"
                                  ? ((r as unknown as AtelierCardType).qa_checklist?.items ?? null)
                                  : ((r as unknown as AtelierCardType).intake_checklist?.items ??
                                    null),
                            })
                          }
                          className="text-xs gap-1"
                          title="Inspection & Contrôle Qualité"
                        >
                          <ClipboardCheck className="size-3.5" />
                          <span>Contrôle QA</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadInvoicePdf(r)}
                          title="Télécharger facture PDF"
                        >
                          <FileDown className="size-4" />
                        </Button>
                      </div>
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
                        quote={r}
                      />
                    )}

                    {!isTechnicien && <PhotoPanel reservationId={r.id} />}

                    <div
                      className="mt-4 flex flex-wrap items-center gap-2 text-xs"
                      data-tour="admin-technician"
                    >
                      <Wrench className="size-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {t("admin.dossier.technician")} :
                      </span>
                      {isTechnicien ? (
                        <strong>
                          {latestTechByReservation.get(r.id)?.technician_id === user.id
                            ? t("admin.dossier.you")
                            : t("admin.dossier.notAssignedToYou")}
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
                          <option value="">{t("admin.dossier.unassigned")}</option>
                          {(technicians.data ?? []).map((tech) => (
                            <option key={tech.id} value={tech.id}>
                              {tech.full_name ?? t("admin.dossier.technician")}
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

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  {pageTotal} dossier{pageTotal > 1 ? "s" : ""} · Page {Math.min(page, totalPages)}{" "}
                  / {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || reservationsPage.isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    ← Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || reservationsPage.isFetching}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Suivant →
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {labelTarget && <AdminDeviceLabel data={labelTarget} onClose={() => setLabelTarget(null)} />}
      {checklistTarget && (
        <AdminChecklistModal
          reservationId={checklistTarget.id}
          reference={checklistTarget.reference}
          device={checklistTarget.device}
          type={checklistTarget.type}
          initialData={checklistTarget.initial ?? null}
          onClose={() => setChecklistTarget(null)}
        />
      )}
    </div>
  );
}
