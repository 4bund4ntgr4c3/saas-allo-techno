import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, Check, Package, RadioTower, Search, Wrench } from "lucide-react";
import { CtaBand } from "@/components/site/Blocks";
import { Button } from "@/components/ui/button";
import {
  getReservationTracking,
  type ReservationStatus,
  type TimelineEntry,
} from "@/lib/suivi.functions";
import { formatDateFr, PERIOD_LABEL, STATUS_LABEL } from "@/lib/reservation-schema";

export const Route = createFileRoute("/suivi")({
  validateSearch: (search: Record<string, unknown>): { ref?: string } =>
    typeof search["ref"] === "string" ? { ref: search["ref"] as string } : {},

  head: () => ({
    meta: [
      { title: "Suivi de réparation — Allô Techno Abomey-Calavi" },
      {
        name: "description",
        content:
          "Suivez l'avancement de votre réparation en temps réel avec votre numéro de dossier Allô Techno.",
      },
      { property: "og:title", content: "Suivi de réparation — Allô Techno" },
      {
        property: "og:description",
        content: "Entrez votre référence de dossier pour connaître le statut de votre réparation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "/suivi" },
    ],
    links: [{ rel: "canonical", href: "/suivi" }],
  }),
  component: Suivi,
});

const STEPS = [
  { key: "en_attente", label: "Dossier reçu", icon: Package },
  { key: "confirmee", label: "Confirmé", icon: Check },
  { key: "en_cours", label: "En réparation", icon: Wrench },
  { key: "terminee", label: "Terminé", icon: Check },
] as const;

function Suivi() {
  const { ref } = Route.useSearch();
  const router = useRouter();
  const [reference, setReference] = useState(ref ?? "");
  const fetchTracking = useServerFn(getReservationTracking);

  useEffect(() => {
    if (ref) setReference(ref);
  }, [ref]);

  const tracking = useQuery({
    queryKey: ["suivi", ref],
    enabled: Boolean(ref),
    // Le dossier est public : on rafraîchit en continu pour refléter le travail de l'atelier.
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    queryFn: () => fetchTracking({ data: { reference: ref as string } }),
  });

  const loading = tracking.isFetching && !tracking.data;
  const data = tracking.data;
  const result = data?.found ? data.reservation : null;
  const timeline = data?.found ? data.timeline : [];
  const error = tracking.error
    ? tracking.error instanceof Error
      ? tracking.error.message
      : "Erreur inattendue"
    : data && !data.found
      ? "Dossier introuvable. Vérifiez la référence."
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.navigate({ to: "/suivi", search: { ref: reference.trim() } });
  };

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">Suivi en ligne</span>
          <h1 className="at-display text-4xl md:text-6xl">Où en est ma réparation ?</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            Saisissez votre numéro de dossier pour connaître le statut de votre réparation en temps
            réel.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="border border-border bg-card p-8">
            <label htmlFor="ref" className="at-eyebrow mb-2 block">
              Numéro de dossier
            </label>
            <div className="flex gap-3">
              <input
                id="ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="AT-2026-0001"
                className="h-11 flex-1 rounded-sm border border-border bg-background px-4 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <Button type="submit" variant="technical" disabled={loading}>
                <Search className="size-4" />
                <span className="ml-2 hidden sm:inline">Vérifier</span>
              </Button>
            </div>
            {error && (
              <div className="mt-4 flex items-start gap-3 border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}
          </form>

          {result && (
            <StatusResult
              result={result}
              timeline={timeline}
              live={tracking.isFetching}
              updatedAt={tracking.dataUpdatedAt}
            />
          )}
        </div>
      </section>

      <CtaBand />
    </>
  );
}

function StatusResult({
  result,
  timeline,
  live,
  updatedAt,
}: {
  result: ReservationStatus;
  timeline: TimelineEntry[];
  live: boolean;
  updatedAt: number;
}) {
  const statusIndex = STEPS.findIndex((s) => s.key === result.status);
  const isCancelled = result.status === "annulee";
  const activeIndex = isCancelled ? -1 : statusIndex >= 0 ? statusIndex : 0;

  return (
    <div className="mt-8 border border-border bg-card p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="at-eyebrow">Dossier {result.reference}</span>
          <h2 className="at-display mt-2 text-2xl">
            {STATUS_LABEL[result.status] ?? "Statut inconnu"}
          </h2>
        </div>
        <div className="sm:text-right">
          <p className="text-sm text-muted-foreground">Rendez-vous</p>
          <p className="font-medium">
            {formatDateFr(result.slot_date)} · {PERIOD_LABEL[result.slot_period]}
          </p>
          <p className="mt-2 flex items-center justify-start gap-2 font-mono text-[10px] uppercase text-muted-foreground sm:justify-end">
            <RadioTower className={`size-3 ${live ? "animate-pulse text-primary" : ""}`} />
            Actualisé à{" "}
            {new Date(updatedAt).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {!isCancelled && (
        <div className="mt-10">
          <div className="relative">
            <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-border" />
            <div className="relative grid grid-cols-4 gap-4">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const done = i <= activeIndex;
                const current = i === activeIndex;
                return (
                  <div key={step.key} className="flex flex-col items-center text-center">
                    <div
                      className={`grid size-10 place-items-center rounded-full border ${
                        done
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground"
                      } ${current ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <span
                      className={`mt-3 text-[10px] font-bold uppercase tracking-wider ${
                        done ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="mt-8 border border-destructive/30 bg-destructive/10 p-6 text-center">
          <p className="text-lg font-bold text-destructive">Dossier annulé</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Ce dossier a été annulé. Contactez-nous pour plus d'informations.
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-4 border-t border-border pt-8 md:grid-cols-2">
        <div>
          <span className="at-eyebrow">Appareil</span>
          <p className="mt-1 text-sm">{result.device}</p>
        </div>
        <div>
          <span className="at-eyebrow">Panne signalée</span>
          <p className="mt-1 text-sm">{result.issue}</p>
        </div>
        <div>
          <span className="at-eyebrow">Mode de dépôt</span>
          <p className="mt-1 text-sm">
            {result.mode === "domicile" ? "Enlèvement à domicile" : "Dépôt en boutique"}
          </p>
        </div>
        <div>
          <span className="at-eyebrow">Paiement</span>
          <p className="mt-1 text-sm">
            {result.payment === "mtn"
              ? "MTN Mobile Money"
              : result.payment === "moov"
                ? "Moov Money"
                : "Espèces"}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild variant="technicalOutline">
          <Link to="/reservation">Nouvelle réservation</Link>
        </Button>
      </div>
    </div>
  );
}

function TimelineFeed({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">
        Aucun événement enregistré pour l'instant.
      </p>
    );
  }

  return (
    <ol className="mt-4 space-y-4 border-l border-border pl-5">
      {[...entries].reverse().map((e, i) => (
        <li key={`${e.created_at}-${i}`} className="relative">
          <span
            className={`absolute -left-[27px] top-1 grid size-3 place-items-center rounded-full ${
              i === 0 ? "bg-primary ring-4 ring-primary/20" : "bg-border"
            }`}
          />
          <p className="text-sm font-semibold">
            {e.old_status
              ? `${STATUS_LABEL[e.old_status]} → ${STATUS_LABEL[e.new_status]}`
              : `Dossier créé — ${STATUS_LABEL[e.new_status]}`}
          </p>
          <p className="font-mono text-[10px] uppercase text-muted-foreground">
            {new Date(e.created_at).toLocaleString("fr-FR", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {e.note ? <p className="mt-1 text-sm text-muted-foreground">{e.note}</p> : null}
        </li>
      ))}
    </ol>
  );
}
