import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { field } from "@/components/admin/primitives/AdminField";
import {
  createReturn,
  listReturns,
  setReturnStatus,
  type ReturnRow,
  type ReturnStatus,
} from "@/lib/returns.functions";

const RETURN_STATUS_ORDER: ReturnStatus[] = ["nouveau", "en_cours", "accepte", "refuse", "cloture"];

const RETURN_STATUS_I18N: Record<string, string> = {
  nouveau: "admin.returns.status.new",
  en_cours: "admin.returns.status.inProgress",
  accepte: "admin.returns.status.accepted",
  refuse: "admin.returns.status.rejected",
  cloture: "admin.returns.status.closed",
};

export function ReturnsSection() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const createFn = useServerFn(createReturn);
  const listFn = useServerFn(listReturns);
  const setFn = useServerFn(setReturnStatus);

  const returns = useQuery({
    queryKey: ["returns"],
    queryFn: () => listFn({ data: {} }),
  });

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    orderReference: "",
    item: "",
    reason: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await createFn({
        data: {
          customerName: form.customerName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          orderReference: form.orderReference.trim(),
          item: form.item.trim(),
          reason: form.reason.trim(),
        },
      });
      toast.success(t("admin.returns.toast.created", [res.reference]));
      setForm({ customerName: "", phone: "", email: "", orderReference: "", item: "", reason: "" });
      queryClient.invalidateQueries({ queryKey: ["returns"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.returns.error.creationFailed"));
    } finally {
      setBusy(false);
    }
  };

  const update = useMutation({
    mutationFn: async ({
      reference,
      status,
      note,
    }: {
      reference: string;
      status: ReturnStatus;
      note?: string;
    }) => {
      await setFn({
        data: { reference, status, ...(note !== undefined ? { note } : {}) },
      });
    },
    onSuccess: (_d, vars) => {
      const label = t(RETURN_STATUS_I18N[vars.status] ?? `admin.returns.status.${vars.status}`);
      toast.success(t("admin.returns.toast.statusUpdated", [label]));
      queryClient.invalidateQueries({ queryKey: ["returns"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : t("admin.returns.error.updateFailed")),
  });

  const saveNote = useMutation({
    mutationFn: async ({
      reference,
      status,
      note,
    }: {
      reference: string;
      status: ReturnStatus;
      note: string;
    }) => {
      await setFn({ data: { reference, status, note } });
    },
    onSuccess: () => {
      toast.success(t("admin.returns.toast.noteSaved"));
      queryClient.invalidateQueries({ queryKey: ["returns"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : t("admin.returns.error.saveFailed")),
  });

  if (returns.isLoading) {
    return <p className="text-sm text-muted-foreground">{t("admin.returns.loading")}</p>;
  }

  const rows = returns.data ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="at-eyebrow">{t("admin.returns.eyebrow")}</p>
          <h2 className="mt-1 text-xl font-semibold">{t("admin.returns.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.returns.description")}</p>
        </div>
      </div>

      <form onSubmit={create} className="space-y-4 border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">{t("admin.returns.newRequest")}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="at-eyebrow mb-2 block">{t("admin.returns.form.customerName")}</span>
            <input
              className={field}
              value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              required
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-2 block">{t("admin.returns.form.phone")}</span>
            <input
              className={field}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder={t("admin.returns.form.phonePlaceholder")}
              required
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-2 block">{t("admin.returns.form.email")}</span>
            <input
              type="email"
              className={field}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-2 block">{t("admin.returns.form.orderReference")}</span>
            <input
              className={field}
              value={form.orderReference}
              onChange={(e) => setForm((f) => ({ ...f, orderReference: e.target.value }))}
              placeholder={t("admin.returns.form.orderRefPlaceholder")}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="at-eyebrow mb-2 block">{t("admin.returns.form.item")}</span>
            <input
              className={field}
              value={form.item}
              onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))}
              placeholder={t("admin.returns.form.itemPlaceholder")}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="at-eyebrow mb-2 block">{t("admin.returns.form.reason")}</span>
            <textarea
              className={`${field} min-h-24`}
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              required
            />
          </label>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          variant="technical"
          disabled={busy || !form.customerName.trim() || !form.phone.trim() || !form.reason.trim()}
        >
          {busy ? t("admin.returns.creating") : t("admin.returns.createButton")}
        </Button>
      </form>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("admin.returns.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <ReturnCard
              key={r.id}
              returnRow={r}
              busy={update.isPending || saveNote.isPending}
              onStatus={(status) => update.mutate({ reference: r.reference, status })}
              onSaveNote={(note) =>
                saveNote.mutate({
                  reference: r.reference,
                  status: r.status as ReturnStatus,
                  note,
                })
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export function ReturnCard({
  returnRow,
  busy,
  onStatus,
  onSaveNote,
}: {
  returnRow: ReturnRow;
  busy: boolean;
  onStatus: (status: ReturnStatus) => void;
  onSaveNote: (note: string) => void;
}) {
  const { t } = useI18n();
  const [note, setNote] = useState(returnRow.note ?? "");

  return (
    <li className="border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-primary/50 px-3 py-1 font-mono text-xs font-bold text-primary">
            {returnRow.reference}
          </span>
          <p className="font-medium">{returnRow.customer_name}</p>
          {returnRow.order_reference ? (
            <span className="font-mono text-xs text-muted-foreground">
              {returnRow.order_reference}
            </span>
          ) : null}
        </div>
        <select
          className={`${field} max-w-44 py-1.5 text-xs`}
          value={returnRow.status}
          disabled={busy}
          onChange={(e) => onStatus(e.target.value as ReturnStatus)}
        >
          {RETURN_STATUS_ORDER.map((value) => (
            <option key={value} value={value}>
              {t(RETURN_STATUS_I18N[value] ?? `admin.returns.status.${value}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span className="text-muted-foreground">{returnRow.phone}</span>
        {returnRow.email ? <span className="text-muted-foreground">{returnRow.email}</span> : null}
        {returnRow.item ? <span>{returnRow.item}</span> : null}
        <span className="text-xs text-muted-foreground">
          {new Date(returnRow.created_at).toLocaleString(t("locale") as string)}
        </span>
      </div>

      <p className="mt-3 bg-surface p-3 text-sm text-muted-foreground">{returnRow.reason}</p>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <textarea
          className={`${field} min-h-20 max-w-md py-1.5 text-xs`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("admin.returns.form.notePlaceholder")}
          maxLength={500}
        />
        <Button
          size="sm"
          disabled={busy || !note.trim() || note.trim() === (returnRow.note ?? "")}
          onClick={() => onSaveNote(note.trim())}
        >
          {busy ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : null}
          {t("admin.webhooks.form.save")}
        </Button>
      </div>
    </li>
  );
}
