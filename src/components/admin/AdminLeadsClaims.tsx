import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { FileDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { exportLeadsCsv, exportReservationsCsv } from "@/lib/export.functions";
import {
  listWarrantyClaims,
  setWarrantyClaimStatus,
  type ClaimStatus,
  type WarrantyClaimRow,
} from "@/lib/claims.functions";

const field =
  "h-11 w-full rounded-sm border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const LEAD_SOURCE_LABEL: Record<string, string> = {
  devis: "Devis",
  contact: "Contact",
  suivi: "Assistance",
  boutique: "Commande boutique",
};

const LEAD_STATUS_LABEL: Record<string, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  clos: "Clôturé",
};

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function CsvExportButton({
  serverFn,
  filenamePrefix,
  label,
}: {
  serverFn: typeof exportReservationsCsv;
  filenamePrefix: string;
  label: string;
}) {
  const { t } = useI18n();
  const fn = useServerFn(serverFn);
  const [pending, setPending] = useState(false);

  const run = async () => {
    setPending(true);
    try {
      const res = await fn();
      const date = new Date().toISOString().slice(0, 10);
      downloadCsv(res.csv, `${filenamePrefix}-${date}.csv`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.export.error"));
    } finally {
      setPending(false);
    }
  };

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={run}>
      {pending ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <FileDown className="mr-2 size-4" />
      )}
      {label}
    </Button>
  );
}

export function LeadsSection() {
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const leads = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, source, reference, name, phone, email, message, status, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Mise à jour impossible"),
  });

  if (leads.isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement des demandes…</p>;
  }

  const rows = leads.data ?? [];
  if (rows.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold">Leads</h2>
        <p className="mt-4 text-sm text-muted-foreground">
          Les demandes de devis et messages de contact apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">Leads</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Devis, contacts et demandes d'assistance reçus via le site.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <CsvExportButton
          serverFn={exportLeadsCsv}
          filenamePrefix="leads"
          label={t("admin.export.leads")}
        />
      </div>
      <ul className="mt-6 space-y-3">
        {rows.map((l) => (
          <li key={l.id} className="border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium">
                {l.name ?? "Anonyme"}{" "}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {LEAD_SOURCE_LABEL[l.source] ?? l.source}
                  {l.reference ? ` · dossier ${l.reference}` : ""}
                </span>
              </p>
              <select
                className={`${field} max-w-40 py-1.5 text-xs`}
                value={l.status}
                disabled={setStatus.isPending}
                onChange={(e) => setStatus.mutate({ id: l.id, status: e.target.value })}
              >
                {Object.entries(LEAD_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{l.message}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {[l.phone, l.email].filter(Boolean).join(" · ") || "—"} ·{" "}
              {new Date(l.created_at).toLocaleString("fr-FR")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

const CLAIM_STATUS_LABEL: Record<string, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  acceptee: "Acceptée",
  refuse: "Refusé",
  cloturee: "Clôturée",
};

const CLAIM_STATUS_ORDER: ClaimStatus[] = ["nouveau", "en_cours", "acceptee", "refuse", "cloturee"];

export function ClaimsSection() {
  const queryClient = useQueryClient();
  const listClaims = useServerFn(listWarrantyClaims);
  const updateClaim = useServerFn(setWarrantyClaimStatus);

  const claims = useQuery({
    queryKey: ["claims"],
    queryFn: () => listClaims({ data: {} }),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ClaimStatus }) => {
      await updateClaim({ data: { id, status } });
    },
    onSuccess: (_d, vars) => {
      toast.success(`Statut mis à jour : ${CLAIM_STATUS_LABEL[vars.status] ?? vars.status}`);
      queryClient.invalidateQueries({ queryKey: ["claims"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Mise à jour impossible"),
  });

  const saveNote = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      await updateClaim({ data: { id, staffNote: note || undefined } });
    },
    onSuccess: () => {
      toast.success("Note enregistrée");
      queryClient.invalidateQueries({ queryKey: ["claims"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Enregistrement impossible"),
  });

  if (claims.isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement des réclamations…</p>;
  }

  const rows = claims.data ?? [];
  if (rows.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold">Réclamations</h2>
        <p className="mt-4 text-sm text-muted-foreground">
          Les réclamations de garantie soumises via le site apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">Réclamations</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Réclamations de garantie soumises en ligne — traitez le statut, notez la décision et le
        client est prévenu par WhatsApp.
      </p>
      <ul className="mt-6 space-y-3">
        {rows.map((c) => (
          <ClaimCard
            key={c.id}
            claim={c}
            busy={setStatus.isPending || saveNote.isPending}
            onStatus={(status) => setStatus.mutate({ id: c.id, status })}
            onSaveNote={(note) => saveNote.mutate({ id: c.id, note })}
          />
        ))}
      </ul>
    </div>
  );
}

export function ClaimCard({
  claim,
  busy,
  onStatus,
  onSaveNote,
}: {
  claim: WarrantyClaimRow;
  busy: boolean;
  onStatus: (status: ClaimStatus) => void;
  onSaveNote: (note: string) => void;
}) {
  const [note, setNote] = useState(claim.staff_note ?? "");

  return (
    <li className="border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-primary/50 px-3 py-1 font-mono text-xs font-bold text-primary">
            {claim.reference}
          </span>
          <p className="font-medium">{claim.name}</p>
          {claim.reservation_reference ? (
            <span className="font-mono text-xs text-muted-foreground">
              {claim.reservation_reference}
            </span>
          ) : null}
        </div>
        <select
          className={`${field} max-w-44 py-1.5 text-xs`}
          value={claim.status}
          disabled={busy}
          onChange={(e) => onStatus(e.target.value as ClaimStatus)}
        >
          {CLAIM_STATUS_ORDER.map((value) => (
            <option key={value} value={value}>
              {CLAIM_STATUS_LABEL[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span className="text-muted-foreground">{claim.phone}</span>
        {claim.email ? <span className="text-muted-foreground">{claim.email}</span> : null}
        {claim.device ? <span>{claim.device}</span> : null}
        <span className="text-xs text-muted-foreground">
          {new Date(claim.created_at).toLocaleString("fr-FR")}
        </span>
      </div>

      <p className="mt-3 rounded-sm bg-surface p-3 text-sm text-muted-foreground">
        {claim.message}
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <textarea
          className={`${field} min-h-20 max-w-md py-1.5 text-xs`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note / réponse de l'atelier…"
          maxLength={500}
        />
        <Button
          size="sm"
          disabled={busy || !note.trim() || note.trim() === (claim.staff_note ?? "")}
          onClick={() => onSaveNote(note.trim())}
        >
          {busy ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : null}
          Enregistrer
        </Button>
      </div>
    </li>
  );
}
