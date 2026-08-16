import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Laptop,
  Plus,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { MaintenanceCountdown } from "@/components/b2b/maintenance/MaintenanceCountdown";
import { MaintenanceChecklistModal } from "@/components/b2b/maintenance/MaintenanceChecklistModal";
import { ScheduleMaintenanceModal } from "@/components/b2b/maintenance/ScheduleMaintenanceModal";
import { TropicalAdvisoryCard } from "@/components/b2b/TropicalAdvisoryCard";
import { useI18n } from "@/lib/i18n/context";
import { getMaintenancePlansFn } from "@/lib/maintenance-plans.functions";
import { parseError } from "@/lib/error-parser";
import {
  completeMaintenanceTask,
  getMyOrganizations,
  getOrgEquipment,
  getOrgMaintenanceSchedules,
  scheduleMaintenance,
  type EquipmentMaintenanceSchedule,
} from "@/lib/org.functions";

export const Route = createFileRoute("/app/organizations/$orgId/maintenance")({
  component: OrgMaintenancePage,
});

function OrgMaintenancePage() {
  const { orgId } = Route.useParams();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const orgs = useQuery({ queryKey: ["app", "orgs"], queryFn: () => getMyOrganizations() });
  const org = orgs.data?.find((o) => o.id === orgId);

  const equipmentQuery = useQuery({
    queryKey: ["app", "org", orgId, "equipment"],
    queryFn: () => getOrgEquipment({ data: { org_id: orgId } }),
    enabled: Boolean(org),
  });

  const schedulesQuery = useQuery({
    queryKey: ["app", "org", orgId, "maintenance-schedules"],
    queryFn: () => getOrgMaintenanceSchedules({ data: { org_id: orgId } }),
    enabled: Boolean(org),
  });

  const mPlansQuery = useQuery({
    queryKey: ["app", "org", orgId, "maintenance-plans"],
    queryFn: () => getMaintenancePlansFn({ data: { orgId } }),
    enabled: Boolean(org),
  });

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedScheduleModal, setSelectedScheduleModal] =
    useState<EquipmentMaintenanceSchedule | null>(null);

  const scheduleMut = useMutation({
    mutationFn: (data: {
      equipmentId: string;
      taskTitle: string;
      intervalMonths: number;
      nextDueAt: string;
    }) =>
      scheduleMaintenance({
        data: {
          org_id: orgId,
          equipment_id: data.equipmentId,
          task_title: data.taskTitle,
          interval_months: data.intervalMonths,
          next_due_at: data.nextDueAt,
        },
      }),
    onSuccess: () => {
      toast.success(t("org.maintenance.schedule.success"));
      setShowScheduleForm(false);
      queryClient.invalidateQueries({ queryKey: ["app", "org", orgId, "maintenance-schedules"] });
    },
    onError: (err: unknown) => {
      const parsed = parseError(err, t("org.maintenance.schedule.error"));
      toast.error(parsed.message);
    },
  });

  const completeMut = useMutation({
    mutationFn: (scheduleId: string) =>
      completeMaintenanceTask({
        data: {
          schedule_id: scheduleId,
          org_id: orgId,
          notes: "Maintenance préventive effectuée à l'atelier Allô Techno",
        },
      }),
    onSuccess: (res) => {
      toast.success(`${t("org.maintenance.complete.success")} ${res.nextDue}`);
      setSelectedScheduleModal(null);
      queryClient.invalidateQueries({ queryKey: ["app", "org", orgId, "maintenance-schedules"] });
    },
    onError: (err: unknown) => {
      const parsed = parseError(err, t("org.maintenance.complete.error"));
      toast.error(parsed.message);
    },
  });

  const scheduleList = useMemo(() => schedulesQuery.data ?? [], [schedulesQuery.data]);

  const overdueCount = useMemo(
    () => scheduleList.filter((s) => new Date(s.next_due_at) < new Date()).length,
    [scheduleList],
  );

  const lastPerformed = useMemo(() => {
    const dates = scheduleList
      .filter((s) => s.last_performed_at)
      .map((s) => new Date(s.last_performed_at!));
    return dates.length > 0
      ? new Date(Math.max(...dates.map((d) => d.getTime()))).toLocaleDateString("fr-FR")
      : "—";
  }, [scheduleList]);

  if (!org) {
    return (
      <div className="p-6">
        {orgs.isLoading ? (
          <LoadingState message={t("common.loading")} />
        ) : (
          <EmptyState title={t("org.error.notfound")} description="Vérifiez vos autorisations." />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="at-in">
        <Link
          to="/app/organizations/$orgId"
          params={{ orgId }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {org.name}
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="at-eyebrow mb-1 block">{t("org.nav.maintenance")}</span>
            <h1 className="at-display text-2xl font-bold">{t("org.maintenance.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("org.maintenance.subtitle")}</p>
          </div>
          {org.member_role &&
            ["admin_org", "responsable_maintenance"].includes(org.member_role) && (
              <Button onClick={() => setShowScheduleForm(!showScheduleForm)}>
                {showScheduleForm ? (
                  <X className="size-4 mr-1" />
                ) : (
                  <Plus className="size-4 mr-1" />
                )}
                {t("org.maintenance.schedule")}
              </Button>
            )}
        </div>
      </div>

      {/* ─── LIVE COUNTDOWN TIMER BANNER EXTRAIT ─── */}
      <MaintenanceCountdown />

      {/* ─── Preventive Maintenance Plans Cards ─── */}
      {mPlansQuery.data && mPlansQuery.data.length > 0 && (
        <div className="space-y-3 at-in">
          <h2 className="at-eyebrow text-xs uppercase tracking-wider text-muted-foreground block">
            Programmes de Maintenance Récurrente
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mPlansQuery.data.map((plan) => (
              <div
                key={plan.id}
                className="border border-border bg-card p-4 space-y-3 shadow-xs rounded-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="size-5 text-primary shrink-0" />
                    <h3 className="font-bold text-sm leading-tight">{plan.title}</h3>
                  </div>
                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] uppercase border-primary/40 text-primary bg-primary/10 shrink-0"
                  >
                    Tous les {plan.frequencyMonths} mois
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/60">
                  <span>
                    Sites :{" "}
                    <strong className="text-foreground">{plan.targetSites.join(", ")}</strong>
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    Prochaine échéance : {plan.nextDueDate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Tropical Climate Hardware Protection Advisory ─── */}
      <TropicalAdvisoryCard />

      {/* ─── KPI Cards ─── */}
      <div className="at-in grid grid-cols-3 gap-3">
        <div className="border border-border bg-card p-4 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-4 text-primary" />
            <span className="text-xs font-semibold">{t("org.maintenance.kpi.scheduled")}</span>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-foreground">{scheduleList.length}</p>
        </div>
        <div className="border border-border bg-card p-4 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle
              className={`size-4 ${overdueCount > 0 ? "text-destructive" : "text-primary"}`}
            />
            <span className="text-xs font-semibold">{t("org.maintenance.kpi.overdue")}</span>
          </div>
          <p
            className={`mt-2 font-mono text-2xl font-bold ${
              overdueCount > 0 ? "text-destructive" : "text-foreground"
            }`}
          >
            {overdueCount}
          </p>
        </div>
        <div className="border border-border bg-card p-4 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="size-4 text-success" />
            <span className="text-xs font-semibold">{t("org.maintenance.kpi.lastDone")}</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">{lastPerformed}</p>
        </div>
      </div>

      {/* ─── Schedule Form Modale / Panel Extrait ─── */}
      <ScheduleMaintenanceModal
        equipmentList={equipmentQuery.data ?? []}
        isOpen={showScheduleForm}
        onClose={() => setShowScheduleForm(false)}
        onSubmit={(data) => scheduleMut.mutate(data)}
        isPending={scheduleMut.isPending}
      />

      {/* ─── CHECKLIST MODAL EXTRAITE ─── */}
      <MaintenanceChecklistModal
        schedule={selectedScheduleModal}
        orgName={org.name}
        isOpen={Boolean(selectedScheduleModal)}
        onClose={() => setSelectedScheduleModal(null)}
        onComplete={(scheduleId) => completeMut.mutate(scheduleId)}
        isCompleting={completeMut.isPending}
      />

      {/* ─── Maintenance Schedule List ─── */}
      <div className="at-in">
        <span className="at-eyebrow mb-3 block">{t("org.maintenance.list.title")}</span>

        <div className="overflow-hidden border border-border bg-card rounded-lg">
          {schedulesQuery.isLoading ? (
            <LoadingState message={t("common.loading")} />
          ) : scheduleList.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title={t("org.maintenance.empty.title")}
              description={t("org.maintenance.empty.text")}
              action={
                <Button size="sm" onClick={() => setShowScheduleForm(true)}>
                  <Plus className="size-4 mr-1" />
                  {t("org.maintenance.schedule")}
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-border">
              {scheduleList.map((s: EquipmentMaintenanceSchedule) => {
                const isOverdue = new Date(s.next_due_at) < new Date();
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedScheduleModal(s)}
                    className="group cursor-pointer flex flex-col gap-4 p-4 transition-all hover:bg-accent/10 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-md ${
                          isOverdue
                            ? "bg-destructive/10 text-destructive"
                            : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        }`}
                      >
                        <Wrench className="size-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold group-hover:text-primary transition-colors">
                            {s.task_title}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold ${
                              isOverdue
                                ? "bg-destructive/15 text-destructive border-destructive/30"
                                : "bg-primary/10 text-primary border-primary/20"
                            }`}
                          >
                            {isOverdue
                              ? t("org.maintenance.status.overdue")
                              : t("org.maintenance.status.scheduled")}
                          </Badge>
                        </div>

                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Laptop className="size-3.5" />
                          <span className="font-medium text-foreground">
                            {s.equipment?.name ?? t("org.equipment.title")}
                          </span>
                          {s.equipment?.brand && (
                            <span>
                              • {s.equipment.brand} {s.equipment.model ?? ""}
                            </span>
                          )}
                        </p>

                        <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Calendar className="size-3" />
                          <span>
                            {t("org.maintenance.nextDue")}:{" "}
                            <strong>{new Date(s.next_due_at).toLocaleDateString("fr-FR")}</strong>
                          </span>
                          {s.last_performed_at && (
                            <span className="text-muted-foreground">
                              ({t("org.maintenance.lastDone")}:{" "}
                              {new Date(s.last_performed_at).toLocaleDateString("fr-FR")})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs group-hover:border-primary group-hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedScheduleModal(s);
                        }}
                      >
                        Ouvrir Checklist &rarr;
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={completeMut.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          completeMut.mutate(s.id);
                        }}
                        className="gap-1.5 border-success/30 text-success hover:bg-success/10 hover:text-success"
                      >
                        <CheckCircle2 className="size-3.5" />
                        {t("org.maintenance.markDone")}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
