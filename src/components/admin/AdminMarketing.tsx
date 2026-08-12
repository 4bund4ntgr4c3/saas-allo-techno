import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { field } from "@/components/admin/primitives/AdminField";
import { DataTable } from "@/components/admin/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Send,
  Trash2,
  Mail,
  MessageSquare,
  Plus,
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
  const { t } = useI18n();
  const segmentLabel = (key: string) => {
    const map: Record<string, string> = {
      vip: t("admin.marketing.vip"),
      loyal: t("admin.marketing.loyal"),
      active: t("admin.marketing.active"),
      new: t("admin.marketing.new-client"),
      inactive: t("admin.marketing.inactive"),
    };
    return map[key] ?? key;
  };
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
      toast.success(t("admin.marketing.toast.campaignCreated"));
      setShowCreate(false);
      setForm({ name: "", type: "email", subject: "", body: "", segment: "all", templateId: "" });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : t("admin.marketing.toast.error")),
  });

  const handleSend = useMutation({
    mutationFn: async (id: string) => sendFn({ data: { id } }),
    onSuccess: (result) => {
      toast.success(t("admin.marketing.toast.sendsLaunched", [result?.sent ?? 0]));
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : t("admin.marketing.toast.error")),
  });

  const handleDelete = useMutation({
    mutationFn: async (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success(t("admin.marketing.toast.campaignDeleted"));
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : t("admin.marketing.toast.error")),
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

  const segmentColumns: ColumnDef<typeof segData[number], unknown>[] = [
    {
      accessorKey: "customer_name",
      header: () => t("admin.marketing.table.name"),
      cell: ({ row }) => <span className="font-medium">{row.getValue("customer_name")}</span>,
    },
    {
      accessorKey: "phone",
      header: () => t("admin.marketing.table.phone"),
      cell: ({ row }) => <span className="font-mono">{row.getValue("phone") as string}</span>,
    },
    {
      accessorKey: "segment",
      header: () => t("admin.marketing.table.segment"),
      cell: ({ row }) => {
        const seg = row.getValue("segment") as string;
        return (
          <span className={`inline-flex border px-2 py-0.5 text-[10px] font-bold uppercase ${SEGMENT_COLORS[seg] ?? ""}`}>
            {segmentLabel(seg)}
          </span>
        );
      },
    },
    {
      accessorKey: "frequency",
      header: () => t("admin.marketing.table.frequency"),
      cell: ({ row }) => <span className="font-mono text-right">{row.getValue("frequency") as number}</span>,
    },
    {
      accessorKey: "recency_days",
      header: () => t("admin.marketing.table.recency"),
      cell: ({ row }) => <span className="font-mono text-right">{(row.getValue("recency_days") as number)}j</span>,
    },
    {
      accessorKey: "monetary",
      header: () => t("admin.marketing.table.total"),
      cell: ({ row }) => <span className="font-mono text-right">{(row.getValue("monetary") as number).toLocaleString(t("locale") as string)}</span>,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="at-eyebrow">{t("admin.marketing.eyebrow")}</p>
          <h2 className="mt-1 text-xl font-semibold">{t("admin.marketing.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.marketing.description")}</p>
        </div>
        <Button variant="technical" size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="size-4" /> {t("admin.marketing.newCampaign")}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {(["vip", "loyal", "active", "new", "inactive"] as const).map((seg) => (
          <div key={seg} className="rounded-sm border border-border bg-card p-3 text-center">
            <span
              className={`inline-flex border px-2 py-0.5 text-[10px] font-bold uppercase ${SEGMENT_COLORS[seg]}`}
            >
              {segmentLabel(seg)}
            </span>
            <p className="mt-2 font-mono text-2xl font-bold">{countData[seg] ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">{t("admin.marketing.clients")}</p>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="border border-border bg-card p-6">
          <h3 className="font-bold">{t("admin.marketing.newCampaign")}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="at-eyebrow block">{t("admin.marketing.form.name")}</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={field}
                placeholder={t("admin.marketing.form.namePlaceholder")}
              />
            </div>
            <div>
              <label className="at-eyebrow block">{t("admin.marketing.form.type")}</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as CampaignType })}
                className={field}
              >
                <option value="email">{t("admin.marketing.email")}</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="at-eyebrow block">{t("admin.marketing.form.segment")}</label>
              <select
                value={form.segment}
                onChange={(e) => setForm({ ...form, segment: e.target.value })}
                className={field}
              >
                <option value="all">{t("admin.marketing.segment.all")}</option>
                <option value="vip">{t("admin.marketing.segment.vip")}</option>
                <option value="loyal">{t("admin.marketing.segment.loyalDetail")}</option>
                <option value="active">{t("admin.marketing.segment.activeDetail")}</option>
                <option value="new">{t("admin.marketing.segment.new")}</option>
                <option value="inactive">{t("admin.marketing.segment.inactiveDetail")}</option>
              </select>
            </div>
            <div>
              <label className="at-eyebrow block">{t("admin.marketing.form.template")}</label>
              <select
                value={form.templateId}
                onChange={(e) => applyTemplate(e.target.value)}
                className={field}
              >
                <option value="">{t("admin.marketing.form.customTemplate")}</option>
                {CAMPAIGN_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.type})
                  </option>
                ))}
              </select>
            </div>
            {form.type === "email" && (
              <div className="sm:col-span-2">
                <label className="at-eyebrow block">{t("admin.marketing.subject")}</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className={field}
                />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="at-eyebrow block">{t("admin.marketing.content")}</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={4}
                className={field}
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                {t("admin.marketing.form.variables")} {"{name}"} {"{device}"} {"{company}"} {"{code}"} {"{discount}"}{" "}
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
              {handleCreate.isPending ? "…" : t("admin.marketing.create")}
            </Button>
            <Button variant="technicalOutline" size="sm" onClick={() => setShowCreate(false)}>
              {t("admin.marketing.cancel")}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {campaigns.isLoading ? (
          <p className="text-sm text-muted-foreground">{t("admin.marketing.loading")}</p>
        ) : data.length === 0 ? (
          <p className="border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {t("admin.marketing.empty")}
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
                      {c.type.toUpperCase()} · {c.sent_count} {t("admin.marketing.sends")} ·{" "}
                      {new Date(c.created_at).toLocaleDateString(t("locale") as string)}
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
          <h3 className="font-bold text-sm">{t("admin.marketing.clientPreview")} ({segData.length})</h3>
          <DataTable columns={segmentColumns} data={segData} searchKey="name" searchPlaceholder={t("admin.marketing.search")} pageSize={50} />
        </div>
      )}
    </div>
  );
}
