import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { FileDown, Loader2 } from "lucide-react";
import { getAdminLeadsData, setLeadStatus } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { field } from "@/components/admin/primitives/AdminField";
import { exportLeadsCsv, exportReservationsCsv } from "@/lib/export.functions";
import {
  listWarrantyClaims,
  setWarrantyClaimStatus,
  type ClaimStatus,
  type WarrantyClaimRow,
} from "@/lib/claims.functions";

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
  const getLeadsFn = useServerFn(getAdminLeadsData);
  const setLeadStatusFn = useServerFn(setLeadStatus);

  const leads = useQuery({
    queryKey: ["leads"],
    queryFn: () => getLeadsFn({ data: undefined }),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await setLeadStatusFn({ data: { id, status } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : t("admin.returns.error.updateFailed")),
  });

  if (leads.isLoading) {
    return <p className="text-sm text-muted-foreground">{t("admin.leads.loading")}</p>;
  }

  const rows = leads.data ?? [];
  if (rows.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="at-eyebrow">{t("admin.leads.eyebrow")}</p>
            <h2 className="mt-1 text-xl font-semibold">{t("admin.leads.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("admin.leads.empty")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="at-eyebrow">{t("admin.leads.eyebrow")}</p>
          <h2 className="mt-1 text-xl font-semibold">{t("admin.leads.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.leads.description")}</p>
        </div>
      </div>
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
                {l.name ?? t("admin.refunds.anonymous")}{" "}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {t(`admin.leads.source.${l.source}`) || l.source}
                  {l.reference ? ` · ${t("admin.leads.caseLabel")} ${l.reference}` : ""}
                </span>
              </p>
              <select
                className={`${field} max-w-40 py-1.5 text-xs`}
                value={l.status}
                disabled={setStatus.isPending}
                onChange={(e) => setStatus.mutate({ id: l.id, status: e.target.value })}
              >
                {(["nouveau", "contacte", "clos"] as const).map((value) => (
                  <option key={value} value={value}>
                    {t(
                      `admin.leads.status.${value === "contacte" ? "contacted" : value === "clos" ? "closed" : "new"}`,
                    )}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{l.message}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {[l.phone, l.email].filter(Boolean).join(" · ") || "—"} ·{" "}
              {new Date(l.created_at).toLocaleString(t("locale") as string)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

const CLAIM_STATUS_ORDER: ClaimStatus[] = ["nouveau", "en_cours", "acceptee", "refuse", "cloturee"];

export function ClaimsSection() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
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
      const claimStatusMap: Record<string, string> = {
        nouveau: t("admin.claims.status.new"),
        en_cours: t("admin.claims.status.inProgress"),
        acceptee: t("admin.claims.status.accepted"),
        refuse: t("admin.claims.status.refused"),
        cloturee: t("admin.claims.status.closed"),
      };
      toast.success(t("admin.claims.statusUpdated", [claimStatusMap[vars.status] ?? vars.status]));
      queryClient.invalidateQueries({ queryKey: ["claims"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : t("admin.returns.error.updateFailed")),
  });

  const saveNote = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      await updateClaim({ data: { id, staffNote: note || undefined } });
    },
    onSuccess: () => {
      toast.success(t("admin.claims.noteSaved"));
      queryClient.invalidateQueries({ queryKey: ["claims"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : t("admin.claims.saveError")),
  });

  if (claims.isLoading) {
    return <p className="text-sm text-muted-foreground">{t("admin.claims.loading")}</p>;
  }

  const rows = claims.data ?? [];
  if (rows.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="at-eyebrow">{t("admin.claims.eyebrow")}</p>
            <h2 className="mt-1 text-xl font-semibold">{t("admin.claims.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("admin.claims.empty")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="at-eyebrow">{t("admin.claims.eyebrow")}</p>
          <h2 className="mt-1 text-xl font-semibold">{t("admin.claims.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.claims.description")}</p>
        </div>
      </div>
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
  const { t } = useI18n();
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
              {t(
                `admin.claims.status.${value === "acceptee" ? "accepted" : value === "refuse" ? "refused" : value === "cloturee" ? "closed" : value === "en_cours" ? "inProgress" : "new"}`,
              )}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span className="text-muted-foreground">{claim.phone}</span>
        {claim.email ? <span className="text-muted-foreground">{claim.email}</span> : null}
        {claim.device ? <span>{claim.device}</span> : null}
        <span className="text-xs text-muted-foreground">
          {new Date(claim.created_at).toLocaleString(t("locale") as string)}
        </span>
      </div>

      <p className="mt-3 bg-surface p-3 text-sm text-muted-foreground">{claim.message}</p>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <textarea
          className={`${field} min-h-20 max-w-md py-1.5 text-xs`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("admin.claims.notePlaceholder")}
          maxLength={500}
        />
        <Button
          size="sm"
          disabled={busy || !note.trim() || note.trim() === (claim.staff_note ?? "")}
          onClick={() => onSaveNote(note.trim())}
        >
          {busy ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : null}
          {t("admin.webhooks.form.save")}
        </Button>
      </div>
    </li>
  );
}
