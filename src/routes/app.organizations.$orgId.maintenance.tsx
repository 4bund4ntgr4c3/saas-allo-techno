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
  Loader2,
  Plus,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/context";
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

const PRESET_TASKS = [
  "Nettoyage interne & Dépoussiérage ventilateurs",
  "Remplacement pâte thermique processeur / GPU",
  "Contrôle santé batterie & Cycles de charge",
  "Audit d'intégrité disque SSD & Sauvegarde",
  "Mise à jour firmware & Diagnostic matériel",
];

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

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedEqId, setSelectedEqId] = useState<string>("");
  const [taskTitle, setTaskTitle] = useState<string>(PRESET_TASKS[0] ?? "");
  const [intervalMonths, setIntervalMonths] = useState<string>("3");
  const [nextDueAt, setNextDueAt] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().slice(0, 10);
  });

  const scheduleMut = useMutation({
    mutationFn: () =>
      scheduleMaintenance({
        data: {
          org_id: orgId,
          equipment_id: selectedEqId,
          task_title: taskTitle,
          interval_months: Number(intervalMonths) || 3,
          next_due_at: nextDueAt,
        },
      }),
    onSuccess: () => {
      toast.success(t("org.maintenance.schedule.success"));
      setShowScheduleForm(false);
      setSelectedEqId("");
      queryClient.invalidateQueries({ queryKey: ["app", "org", orgId, "maintenance-schedules"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : t("org.maintenance.schedule.error"));
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
      queryClient.invalidateQueries({ queryKey: ["app", "org", orgId, "maintenance-schedules"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : t("org.maintenance.complete.error"));
    },
  });

  const scheduleList = schedulesQuery.data ?? [];
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
          {org?.name ?? t("org.detail.back")}
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="at-eyebrow mb-1 block">{t("org.nav.maintenance")}</span>
            <h1 className="at-display text-2xl font-bold">{t("org.maintenance.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("org.maintenance.subtitle")}</p>
          </div>
          {org?.member_role &&
            ["admin_org", "responsable_maintenance"].includes(org.member_role) && (
              <Button variant="primaryBlock" onClick={() => setShowScheduleForm(!showScheduleForm)}>
                {showScheduleForm ? <X className="size-4" /> : <Plus className="size-4" />}
                {t("org.maintenance.schedule")}
              </Button>
            )}
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="at-in grid grid-cols-3 gap-3" style={{ animationDelay: "60ms" }}>
        <div className="flex items-center gap-3 border border-border bg-card p-4">
          <div className="flex size-10 items-center justify-center bg-muted text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="font-mono text-2xl font-bold tabular-nums">{scheduleList.length}</p>
            <p className="text-xs text-muted-foreground">{t("org.maintenance.kpi.total")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border border-border bg-card p-4">
          <div
            className={`flex size-10 items-center justify-center ${overdueCount > 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-success"}`}
          >
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <p className="font-mono text-2xl font-bold tabular-nums">{overdueCount}</p>
            <p className="text-xs text-muted-foreground">{t("org.maintenance.kpi.overdue")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border border-border bg-card p-4">
          <div className="flex size-10 items-center justify-center bg-muted text-accent">
            <Clock className="size-5" />
          </div>
          <div>
            <p className="font-mono text-lg font-bold tabular-nums">{lastPerformed}</p>
            <p className="text-xs text-muted-foreground">{t("org.maintenance.kpi.lastDone")}</p>
          </div>
        </div>
      </div>

      {/* ─── Schedule Form ─── */}
      {showScheduleForm && (
        <div className="at-in border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold">{t("org.maintenance.form.title")}</h3>
            <button
              type="button"
              onClick={() => setShowScheduleForm(false)}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs">{t("org.maintenance.form.equipment")}</Label>
              <Select value={selectedEqId} onValueChange={setSelectedEqId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder={t("org.maintenance.form.equipment.placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {(equipmentQuery.data ?? []).map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.name} {eq.brand ? `(${eq.brand} ${eq.model ?? ""})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">{t("org.maintenance.form.task")}</Label>
              <Select value={taskTitle} onValueChange={setTaskTitle}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_TASKS.map((task) => (
                    <SelectItem key={task} value={task}>
                      {task}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">{t("org.maintenance.form.interval")}</Label>
              <Select value={intervalMonths} onValueChange={setIntervalMonths}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t("org.maintenance.interval.monthly")}</SelectItem>
                  <SelectItem value="3">{t("org.maintenance.interval.quarterly")}</SelectItem>
                  <SelectItem value="6">{t("org.maintenance.interval.biannual")}</SelectItem>
                  <SelectItem value="12">{t("org.maintenance.interval.annual")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">{t("org.maintenance.form.dueDate")}</Label>
              <Input
                type="date"
                value={nextDueAt}
                onChange={(e) => setNextDueAt(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setShowScheduleForm(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              size="sm"
              variant="primaryBlock"
              disabled={!selectedEqId || scheduleMut.isPending}
              onClick={() => scheduleMut.mutate()}
            >
              {scheduleMut.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              {t("org.maintenance.form.submit")}
            </Button>
          </div>
        </div>
      )}

      {/* ─── Maintenance Schedule List ─── */}
      <div className="at-in" style={{ animationDelay: "120ms" }}>
        <span className="at-eyebrow mb-3 block">{t("org.maintenance.list.title")}</span>

        <div className="overflow-hidden border border-border bg-card">
          {schedulesQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : scheduleList.length === 0 ? (
            <div className="py-16 text-center">
              <Wrench className="mx-auto size-10 text-muted-foreground" />
              <p className="mt-4 text-sm font-medium">{t("org.maintenance.empty.title")}</p>
              <p className="mx-auto mt-1.5 max-w-sm text-xs text-muted-foreground">
                {t("org.maintenance.empty.text")}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {scheduleList.map((s: EquipmentMaintenanceSchedule) => {
                const isOverdue = new Date(s.next_due_at) < new Date();
                return (
                  <div
                    key={s.id}
                    className="flex flex-col gap-4 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center ${
                          isOverdue
                            ? "bg-destructive/10 text-destructive"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        <Wrench className="size-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{s.task_title}</span>
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

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={completeMut.isPending}
                      onClick={() => completeMut.mutate(s.id)}
                      className="gap-1.5 border-success/30 text-success hover:bg-success/10 hover:text-success"
                    >
                      <CheckCircle2 className="size-3.5" />
                      {t("org.maintenance.markDone")}
                    </Button>
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
