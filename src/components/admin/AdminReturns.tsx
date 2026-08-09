import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createReturn,
  listReturns,
  setReturnStatus,
  type ReturnRow,
  type ReturnStatus,
} from "@/lib/returns.functions";

const field =
  "h-11 w-full rounded-sm border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const RETURN_STATUS_ORDER: ReturnStatus[] = ["nouveau", "en_cours", "accepte", "refuse", "cloture"];

const RETURN_STATUS_LABEL: Record<string, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  accepte: "Accepté",
  refuse: "Refusé",
  cloture: "Clôturé",
};

export function ReturnsSection() {
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
      toast.success(`Retour créé : ${res.reference}`);
      setForm({ customerName: "", phone: "", email: "", orderReference: "", item: "", reason: "" });
      queryClient.invalidateQueries({ queryKey: ["returns"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création impossible");
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
      toast.success(`Statut mis à jour : ${RETURN_STATUS_LABEL[vars.status] ?? vars.status}`);
      queryClient.invalidateQueries({ queryKey: ["returns"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Mise à jour impossible"),
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
      toast.success("Note enregistrée");
      queryClient.invalidateQueries({ queryKey: ["returns"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Enregistrement impossible"),
  });

  if (returns.isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement des retours…</p>;
  }

  const rows = returns.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Retours</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Créez une demande de retour pour un client et suivez son traitement ; le client est
          prévenu par WhatsApp/e-mail à chaque changement de statut.
        </p>
      </div>

      <form onSubmit={create} className="space-y-4 rounded-sm border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">Nouvelle demande de retour</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="at-eyebrow mb-2 block">Nom du client</span>
            <input
              className={field}
              value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              required
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-2 block">Téléphone</span>
            <input
              className={field}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+229 …"
              required
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-2 block">E-mail</span>
            <input
              type="email"
              className={field}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-2 block">Référence commande</span>
            <input
              className={field}
              value={form.orderReference}
              onChange={(e) => setForm((f) => ({ ...f, orderReference: e.target.value }))}
              placeholder="ex. AC-2026-0001"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="at-eyebrow mb-2 block">Article concerné</span>
            <input
              className={field}
              value={form.item}
              onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))}
              placeholder="ex. Chargeur 65 W"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="at-eyebrow mb-2 block">Motif du retour</span>
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
          {busy ? "Création…" : "Créer le retour"}
        </Button>
      </form>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune demande de retour pour le moment.</p>
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
              {RETURN_STATUS_LABEL[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span className="text-muted-foreground">{returnRow.phone}</span>
        {returnRow.email ? <span className="text-muted-foreground">{returnRow.email}</span> : null}
        {returnRow.item ? <span>{returnRow.item}</span> : null}
        <span className="text-xs text-muted-foreground">
          {new Date(returnRow.created_at).toLocaleString("fr-FR")}
        </span>
      </div>

      <p className="mt-3 rounded-sm bg-surface p-3 text-sm text-muted-foreground">
        {returnRow.reason}
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <textarea
          className={`${field} min-h-20 max-w-md py-1.5 text-xs`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note interne de l'atelier…"
          maxLength={500}
        />
        <Button
          size="sm"
          disabled={busy || !note.trim() || note.trim() === (returnRow.note ?? "")}
          onClick={() => onSaveNote(note.trim())}
        >
          {busy ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : null}
          Enregistrer
        </Button>
      </div>
    </li>
  );
}
