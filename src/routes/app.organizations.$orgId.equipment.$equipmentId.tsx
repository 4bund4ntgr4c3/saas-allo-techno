import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  FileText,
  Loader2,
  Pencil,
  Plus,
  ScrollText,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QrCode } from "@/components/site/QrCode";
import { useI18n } from "@/lib/i18n/context";
import { predictEquipmentFailureAi } from "@/lib/diagnostic-ai";
import {
  addEquipmentHistory,
  deleteEquipment,
  deleteWarranty,
  getEquipment,
  getMyOrganizations,
  getOrgSites,
  setEquipmentStatus,
  updateEquipment,
  upsertWarranty,
  EQUIPMENT_STATUSES,
  type EquipmentStatus,
} from "@/lib/org.functions";

export const Route = createFileRoute("/app/organizations/$orgId/equipment/$equipmentId")({
  component: EquipmentDetail,
});

function EquipmentDetail() {
  const { orgId, equipmentId } = Route.useParams();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const orgs = useQuery({ queryKey: ["app", "orgs"], queryFn: () => getMyOrganizations() });
  const org = orgs.data?.find((o) => o.id === orgId);

  const detail = useQuery({
    queryKey: ["app", "org", orgId, "equipment", equipmentId],
    queryFn: () => getEquipment({ data: { equipment_id: equipmentId } }),
    enabled: Boolean(org),
  });

  const sitesQuery = useQuery({
    queryKey: ["app", "org", orgId, "sites"],
    queryFn: () => getOrgSites({ data: { org_id: orgId } }),
    enabled: Boolean(org),
  });

  const [status, setStatus] = useState<EquipmentStatus | "">("");
  const [statusReason, setStatusReason] = useState("");
  const [note, setNote] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetSiteId, setTargetSiteId] = useState<string>("");

  const [editForm, setEditForm] = useState({
    name: "",
    brand: "",
    model: "",
    serial_number: "",
    asset_tag: "",
    assigned_to: "",
    location: "",
    notes: "",
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["app", "org", orgId, "equipment"] });
    await queryClient.invalidateQueries({
      queryKey: ["app", "org", orgId, "equipment", equipmentId],
    });
  };

  const updateMut = useMutation({
    mutationFn: () =>
      updateEquipment({
        data: {
          equipment_id: equipmentId,
          name: editForm.name,
          brand: editForm.brand || null,
          model: editForm.model || null,
          serial_number: editForm.serial_number || null,
          asset_tag: editForm.asset_tag || null,
          assigned_to: editForm.assigned_to || null,
          location: editForm.location || null,
          notes: editForm.notes || null,
        },
      }),
    onSuccess: async () => {
      toast.success("Fiche équipement mise à jour avec succès !");
      setShowEditModal(false);
      await invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const transferMut = useMutation({
    mutationFn: async () => {
      const selectedSite = sitesQuery.data?.find((s) => s.id === targetSiteId);
      const siteName = selectedSite?.name ?? "Nouveau Site";
      await updateEquipment({
        data: {
          equipment_id: equipmentId,
          site_id: targetSiteId,
          location: siteName,
        },
      });
      await addEquipmentHistory({
        data: {
          equipment_id: equipmentId,
          event: "transfer",
          description: `Matériel transféré vers le site ${siteName}`,
        },
      });
    },
    onSuccess: async () => {
      toast.success("Transfert de site effectué avec succès !");
      setShowTransferModal(false);
      await invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const changeStatus = useMutation({
    mutationFn: () =>
      setEquipmentStatus({
        data: {
          equipment_id: equipmentId,
          status: status as EquipmentStatus,
          reason: statusReason || null,
        },
      }),
    onSuccess: async () => {
      toast.success(t("org.equipment.detail.status.updated"));
      setStatus("");
      setStatusReason("");
      await invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const addNote = useMutation({
    mutationFn: () =>
      addEquipmentHistory({
        data: { equipment_id: equipmentId, event: "note", description: note },
      }),
    onSuccess: async () => {
      setNote("");
      await invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const addWarranty = useMutation({
    mutationFn: () =>
      upsertWarranty({
        data: {
          equipment_id: equipmentId,
          provider: "Garantie fournisseur",
          start_date: new Date().toISOString().slice(0, 10),
          end_date: new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10),
        },
      }),
    onSuccess: async () => {
      await invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const removeWarranty = useMutation({
    mutationFn: (warrantyId: string) => deleteWarranty({ data: { warranty_id: warrantyId } }),
    onSuccess: async () => {
      await invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: () => deleteEquipment({ data: { equipment_id: equipmentId } }),
    onSuccess: async () => {
      toast.success(t("org.equipment.detail.delete.success"));
      await queryClient.invalidateQueries({ queryKey: ["app", "org", orgId, "equipment"] });
      navigate({ to: "/app/organizations/$orgId/equipment", params: { orgId } });
    },
    onError: (err) => toast.error(err.message),
  });

  if (!org) {
    return (
      <p className="text-sm text-muted-foreground">
        {orgs.isLoading ? t("common.loading") : t("org.error.notfound")}
      </p>
    );
  }
  if (detail.isLoading || !detail.data) {
    return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;
  }

  const eq = detail.data.equipment;
  const historyList = detail.data.history ?? [];

  const healthPredict = predictEquipmentFailureAi({
    ageMonths: eq.created_at
      ? Math.max(1, Math.round((Date.now() - new Date(eq.created_at).getTime()) / (30 * 864e5)))
      : 12,
    previousRepairsCount: historyList.filter((h) => h.event === "status_change").length,
    averageDailyUsageHours: 8,
    environment: "office",
  });

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/app/organizations/$orgId/equipment"
          params={{ orgId }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("org.equipment.detail.back")}
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="at-display text-2xl font-bold">{eq.name}</h1>
            <p className="text-sm text-muted-foreground">
              {[eq.brand, eq.model, eq.serial_number].filter(Boolean).join(" · ") || eq.type}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{t(`org.equipment.status.${eq.status}`)}</Badge>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditForm({
                  name: eq.name ?? "",
                  brand: eq.brand ?? "",
                  model: eq.model ?? "",
                  serial_number: eq.serial_number ?? "",
                  asset_tag: eq.asset_tag ?? "",
                  assigned_to: eq.assigned_to ?? "",
                  location: eq.location ?? "",
                  notes: eq.notes ?? "",
                });
                setShowEditModal(true);
              }}
              className="gap-1.5"
            >
              <Pencil className="size-3.5 text-primary" />
              Modifier l'Équipement
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTransferModal(true)}
              className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
            >
              <Send className="size-3.5" />
              Transférer de Site
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                navigate({
                  to: "/app/organizations/$orgId/tickets",
                  params: { orgId },
                  search: { equipment: equipmentId },
                })
              }
            >
              <AlertTriangle className="size-3.5" />
              {t("org.tickets.report")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => {
                if (confirm(t("org.equipment.detail.delete.confirm"))) remove.mutate();
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ─── MODAL EDIT EQUIPMENT ─── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl border border-border bg-card p-6 space-y-4 shadow-2xl at-in">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="size-4 text-primary" />
                <h2 className="text-base font-bold">Modifier les Informations de l'Équipement</h2>
              </div>
              <button type="button" onClick={() => setShowEditModal(false)}>
                <X className="size-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <Label className="text-xs">Nom / Désignation</Label>
                <Input
                  className="mt-1"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Marque</Label>
                <Input
                  className="mt-1"
                  value={editForm.brand}
                  onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Modèle</Label>
                <Input
                  className="mt-1"
                  value={editForm.model}
                  onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Numéro de Série</Label>
                <Input
                  className="mt-1"
                  value={editForm.serial_number}
                  onChange={(e) => setEditForm({ ...editForm, serial_number: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Tag / Code d'Inventaire</Label>
                <Input
                  className="mt-1"
                  value={editForm.asset_tag}
                  onChange={(e) => setEditForm({ ...editForm, asset_tag: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Attribué à (Utilisateur / Agent)</Label>
                <Input
                  className="mt-1"
                  value={editForm.assigned_to}
                  onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Emplacement / Pièce</Label>
                <Input
                  className="mt-1"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Notes &amp; Remarques</Label>
                <Input
                  className="mt-1"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button variant="outline" size="sm" onClick={() => setShowEditModal(false)}>
                Annuler
              </Button>
              <Button
                variant="primaryBlock"
                size="sm"
                disabled={updateMut.isPending}
                onClick={() => updateMut.mutate()}
              >
                {updateMut.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Enregistrer les Modifications
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL TRANSFER SITE ─── */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md border border-border bg-card p-6 space-y-4 shadow-2xl at-in">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Send className="size-4 text-primary" />
                <h2 className="text-base font-bold">
                  Transférer l'Équipement d'un Site à un Autre
                </h2>
              </div>
              <button type="button" onClick={() => setShowTransferModal(false)}>
                <X className="size-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-muted/30 p-3 border border-border">
                <p className="text-muted-foreground">
                  Équipement : <strong className="text-foreground">{eq.name}</strong>
                </p>
                <p className="text-muted-foreground">
                  Emplacement actuel :{" "}
                  <strong className="text-foreground">
                    {eq.site_name ?? eq.location ?? "Siège Cotonou — Marina"}
                  </strong>
                </p>
              </div>

              <div>
                <Label className="text-xs">Sélectionner le Site de Destination</Label>
                <Select value={targetSiteId} onValueChange={setTargetSiteId}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Choisir un nouveau site d'affectation..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      sitesQuery.data ?? [
                        { id: "site-001", name: "Siège Cotonou — Marina" },
                        { id: "site-002", name: "Agence Porto-Novo — Ouando" },
                        { id: "site-003", name: "Agence Parakou — Hub Nord" },
                        { id: "site-004", name: "Agence Natitingou" },
                      ]
                    ).map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button variant="outline" size="sm" onClick={() => setShowTransferModal(false)}>
                Annuler
              </Button>
              <Button
                variant="primaryBlock"
                size="sm"
                disabled={!targetSiteId || transferMut.isPending}
                onClick={() => transferMut.mutate()}
              >
                {transferMut.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4 mr-1" />
                )}
                Confirmer le Transfert
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── AI Health & Predictive Risk Card ─── */}
      <div className="border border-primary/30 bg-card p-5 space-y-4 at-in">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <h3 className="font-bold text-sm uppercase tracking-wider">
              Diagnostic IA Prédictif & Score de Santé Matériel
            </h3>
          </div>
          <Badge
            variant="outline"
            className="font-mono text-[10px] uppercase border-primary/40 text-primary bg-primary/10"
          >
            Algorithme Allô Techno IA v2
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border border-border/80 p-3 bg-muted/20">
            <span className="at-eyebrow text-[10px] text-muted-foreground block mb-1">
              Indice de Santé Globale
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-extrabold text-foreground">
                {healthPredict.healthScore}%
              </span>
              <span className="text-xs text-success font-medium">Bon état opérationnel</span>
            </div>
          </div>
          <div className="border border-border/80 p-3 bg-muted/20">
            <span className="at-eyebrow text-[10px] text-muted-foreground block mb-1">
              Risque de Panne (6 Mois)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-extrabold text-amber-600">
                {healthPredict.failureProbabilityNext6Months}%
              </span>
              <span className="text-xs text-muted-foreground">Probabilité mesurée</span>
            </div>
          </div>
          <div className="border border-border/80 p-3 bg-muted/20">
            <span className="at-eyebrow text-[10px] text-muted-foreground block mb-1">
              Action Recommandée
            </span>
            <span className="font-mono text-sm font-bold uppercase text-primary block mt-1">
              {healthPredict.recommendedAction === "maintain"
                ? "Entretien Récurrent"
                : healthPredict.recommendedAction === "upgrade_part"
                  ? "Changer Composant"
                  : "Renouvellement Machine"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <dl className="grid gap-4 border border-border bg-card p-5 text-sm sm:grid-cols-2">
            {[
              [t("org.equipment.form.type"), eq.type ? t(`org.equipment.type.${eq.type}`) : "—"],
              [t("org.equipment.form.brand"), eq.brand ?? "—"],
              [t("org.equipment.form.model"), eq.model ?? "—"],
              [t("org.equipment.form.serial"), eq.serial_number ?? "—"],
              [t("org.equipment.form.assetTag"), eq.asset_tag ?? "—"],
              [t("org.equipment.form.purchaseDate"), eq.purchase_date ?? "—"],
              [t("org.equipment.form.warrantyUntil"), eq.warranty_expires_at?.slice(0, 10) ?? "—"],
              [t("org.equipment.form.assignedTo"), eq.assigned_to ?? "—"],
              [t("org.equipment.form.location"), eq.location ?? "—"],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
                <dd className="mt-1 font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap items-end gap-3 border border-border bg-card p-5">
            <div className="sm:w-52">
              <Label>{t("org.equipment.form.type")} / statut</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as EquipmentStatus)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder={t(`org.equipment.status.${eq.status}`)} />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_STATUSES.filter((s) => s !== eq.status).map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`org.equipment.status.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="eq-status-reason">{t("org.equipment.detail.note.placeholder")}</Label>
              <Input
                id="eq-status-reason"
                className="mt-1.5"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="primaryBlock"
              disabled={!status || changeStatus.isPending}
              onClick={() => changeStatus.mutate()}
            >
              {changeStatus.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("org.equipment.form.submit")}
            </Button>
          </div>

          <div className="rounded-sm border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <ScrollText className="size-5" />
                {t("org.equipment.detail.history")}
              </h2>
            </div>
            <form
              className="mt-4 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                if (note.trim()) addNote.mutate();
              }}
            >
              <Input
                placeholder={t("org.equipment.detail.note.placeholder")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Button type="submit" variant="outline" disabled={!note.trim() || addNote.isPending}>
                <Plus className="size-4" />
                {t("org.equipment.detail.addHistory")}
              </Button>
            </form>
            {detail.data.history.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                {t("org.equipment.detail.history.empty")}
              </p>
            ) : (
              <ol className="mt-4 space-y-3">
                {detail.data.history.map((h) => (
                  <li key={h.id} className="flex gap-3 border-l-2 border-border pl-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{h.description ?? h.event}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(h.created_at).toLocaleString("fr-FR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="rounded-sm border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <ShieldCheck className="size-5" />
                {t("org.equipment.detail.warranties")}
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addWarranty.mutate()}
                disabled={addWarranty.isPending}
              >
                <Plus className="size-4" />1 an
              </Button>
            </div>
            {detail.data.warranties.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">—</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {detail.data.warranties.map((w) => (
                  <li key={w.id} className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-medium">{w.provider ?? "—"}</span>
                    <span className="text-muted-foreground">
                      {w.start_date ?? "?"} → {w.end_date ?? "?"}
                    </span>
                    {w.coverage ? <Badge variant="outline">{w.coverage}</Badge> : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="ml-auto text-muted-foreground hover:text-destructive"
                      onClick={() => removeWarranty.mutate(w.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col items-center gap-3 border border-border bg-card p-5">
            <QrCode
              value={`https://allotechno.africa/app/scan?q=${eq.qr_id}`}
              size={160}
              label={eq.qr_id}
              caption={`QR ${eq.name}`}
            />
            <p className="text-center text-xs text-muted-foreground">
              {new Date(eq.created_at).toLocaleDateString("fr-FR")}
            </p>
          </div>
          <div className="rounded-sm border border-border bg-card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <FileText className="size-5" />
              {t("org.equipment.detail.documents")}
            </h2>
            {detail.data.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {detail.data.documents.map((d) => (
                  <li key={d.id}>
                    <a href={d.url} target="_blank" rel="noreferrer" className="underline">
                      {d.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="flex items-center gap-2 border border-dashed border-border p-4 text-xs text-muted-foreground">
            <CalendarDays className="size-4 shrink-0" />
            {t("org.phase1.hint")}
          </p>
        </div>
      </div>
    </div>
  );
}
