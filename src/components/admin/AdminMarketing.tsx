import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Plus,
  Send,
  Trash2,
  Mail,
  MessageSquare,
  Smartphone,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  listCampaigns,
  createCampaign,
  deleteCampaign,
  sendCampaign,
  getClientSegments,
  getSegmentCounts,
  CAMPAIGN_TEMPLATES,
  type CampaignType,
} from "@/lib/marketing.functions";

const SEGMENT_COLORS: Record<string, string> = {
  vip: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  loyal: "border-primary/40 bg-primary/10 text-primary",
  active: "border-success/40 bg-success/10 text-success",
  new: "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  inactive: "border-border text-muted-foreground",
};

const SEGMENT_LABELS: Record<string, string> = {
  vip: "VIP",
  loyal: "Loyal",
  active: "Actif",
  new: "Nouveau",
  inactive: "Inactif",
};

const TYPE_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  sms: MessageSquare,
  whatsapp: Smartphone,
};

const STATUS_TONE: Record<string, string> = {
  draft: "border-border text-muted-foreground",
  sending: "border-amber-500/40 text-amber-600",
  sent: "border-success/40 text-success",
  failed: "border-destructive/40 text-destructive",
};

export function AdminMarketing() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listCampaigns);
  const createFn = useServerFn(createCampaign);
  const deleteFn = useServerFn(deleteCampaign);
  const sendFn = useServerFn(sendCampaign);
  const segmentsFn = useServerFn(getClientSegments);
  const countsFn = useServerFn(getSegmentCounts);

  const campaigns = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => listFn(),
  });

  const segments = useQuery({
    queryKey: ["client-segments"],
    queryFn: () => segmentsFn(),
  });

  const counts = useQuery({
    queryKey: ["segment-counts"],
    queryFn: () => countsFn(),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "email" as CampaignType,
    subject: "",
    body: "",
    segment: "all",
    templateId: "",
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCreate = useMutation({
    mutationFn: async () => {
      return createFn({
        data: {
          name: form.name,
          type: form.type,
          subject: form.subject || undefined,
          body: form.body,
          template_id: form.templateId || undefined,
          segment_filter: { segment: form.segment },
        },
      });
    },
    onSuccess: () => {
      toast.success("Campagne créée");
      setShowCreate(false);
      setForm({ name: "", type: "email", subject: "", body: "", segment: "all", templateId: "" });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Erreur"),
  });

  const handleSend = useMutation({
    mutationFn: async (id: string) => sendFn({ data: { id } }),
    onSuccess: (result) => {
      toast.success(`${result?.sent ?? 0} envois lancés`);
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Erreur"),
  });

  const handleDelete = useMutation({
    mutationFn: async (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Campagne supprimée");
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Erreur"),
  });

  function applyTemplate(templateId: string) {
    const tpl = CAMPAIGN_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setForm((f) => ({
      ...f,
      templateId: tpl.id,
      type: tpl.type,
      subject: tpl.subject ?? "",
      body: tpl.body,
    }));
  }

  const data = campaigns.data ?? [];
  const segData = segments.data ?? [];
  const countData = counts.data ?? { vip: 0, loyal: 0, active: 0, new: 0, inactive: 0, total: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Marketing</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Campagnes email/SMS/WhatsApp et segmentation clients (RFM).
          </p>
        </div>
        <Button variant="technical" size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="size-4" /> Nouvelle campagne
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {(["vip", "loyal", "active", "new", "inactive"] as const).map((seg) => (
          <div key={seg} className="rounded-sm border border-border bg-card p-3 text-center">
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${SEGMENT_COLORS[seg]}`}
            >
              {SEGMENT_LABELS[seg]}
            </span>
            <p className="mt-2 font-mono text-2xl font-bold">{countData[seg] ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">clients</p>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="border border-border bg-card p-6">
          <h3 className="font-bold">Nouvelle campagne</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="at-eyebrow block">Nom</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Campagne relance"
              />
            </div>
            <div>
              <label className="at-eyebrow block">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as CampaignType })}
                className="mt-1 w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm focus:outline-none"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="at-eyebrow block">Segment</label>
              <select
                value={form.segment}
                onChange={(e) => setForm({ ...form, segment: e.target.value })}
                className="mt-1 w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm focus:outline-none"
              >
                <option value="all">Tous les clients</option>
                <option value="vip">VIP (5+ visites, 200k+ FCFA)</option>
                <option value="loyal">Loyal (3+ visites)</option>
                <option value="active">Actif (≤90 jours)</option>
                <option value="new">Nouveau</option>
                <option value="inactive">Inactif (&gt;180 jours)</option>
              </select>
            </div>
            <div>
              <label className="at-eyebrow block">Template</label>
              <select
                value={form.templateId}
                onChange={(e) => applyTemplate(e.target.value)}
                className="mt-1 w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm focus:outline-none"
              >
                <option value="">— Personnalisé —</option>
                {CAMPAIGN_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.type})
                  </option>
                ))}
              </select>
            </div>
            {form.type === "email" && (
              <div className="sm:col-span-2">
                <label className="at-eyebrow block">Sujet</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="mt-1 w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="at-eyebrow block">Contenu</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={4}
                className="mt-1 w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                Variables : {"{name}"} {"{device}"} {"{company}"} {"{code}"} {"{discount}"}{" "}
                {"{expiry}"} {"{review_link}"} {"{booking_link}"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              variant="technical"
              size="sm"
              disabled={!form.name || !form.body || handleCreate.isPending}
              onClick={() => handleCreate.mutate()}
            >
              {handleCreate.isPending ? "…" : "Créer"}
            </Button>
            <Button variant="technicalOutline" size="sm" onClick={() => setShowCreate(false)}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {campaigns.isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : data.length === 0 ? (
          <p className="border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Aucune campagne créée.
          </p>
        ) : (
          data.map((c) => {
            const Icon = TYPE_ICONS[c.type] ?? Mail;
            const isExpanded = expandedId === c.id;
            return (
              <div key={c.id} className="border border-border bg-card">
                <div className="flex items-center gap-3 p-4">
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-bold">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {c.type.toUpperCase()} · {c.sent_count} envois ·{" "}
                      {new Date(c.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_TONE[c.status] ?? ""}`}
                  >
                    {c.status}
                  </span>
                  <div className="flex gap-1">
                    {c.status === "draft" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-2"
                        disabled={handleSend.isPending}
                        onClick={() => handleSend.mutate(c.id)}
                      >
                        <Send className="size-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2"
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="size-3" />
                      ) : (
                        <ChevronDown className="size-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2 text-destructive"
                      onClick={() => handleDelete.mutate(c.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-border bg-surface p-4">
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{c.body}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {segData.length > 0 && (
        <div>
          <h3 className="font-bold text-sm">Aperçu clients ({segData.length})</h3>
          <div className="mt-3 max-h-64 overflow-y-auto border border-border bg-card">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="p-2">Nom</th>
                  <th className="p-2">Téléphone</th>
                  <th className="p-2">Segment</th>
                  <th className="p-2 text-right">Freq.</th>
                  <th className="p-2 text-right">Dernier</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {segData.slice(0, 50).map((c, i) => (
                  <tr key={i} className="border-b border-border last:border-b-0">
                    <td className="p-2 font-medium">{c.customer_name}</td>
                    <td className="p-2 font-mono">{c.phone}</td>
                    <td className="p-2">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${SEGMENT_COLORS[c.segment] ?? ""}`}
                      >
                        {SEGMENT_LABELS[c.segment] ?? c.segment}
                      </span>
                    </td>
                    <td className="p-2 text-right font-mono">{c.frequency}</td>
                    <td className="p-2 text-right font-mono">{c.recency_days}j</td>
                    <td className="p-2 text-right font-mono">
                      {c.monetary.toLocaleString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
