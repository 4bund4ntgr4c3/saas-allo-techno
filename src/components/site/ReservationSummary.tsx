import { CalendarClock, Check, Cpu, MapPin, Pencil, Smartphone, Tag, Wallet } from "lucide-react";
import { type Ref } from "react";
import { deviceBySlug } from "@/data/catalog/devices";
import { brandName } from "@/data/catalog";
import { formatFcfa } from "@/data/catalog/company";
import { Button } from "@/components/ui/button";
import { EstimateBreakdown } from "@/components/site/EstimateBreakdown";
import { useI18n } from "@/lib/i18n/context";
import { computeEstimate } from "@/lib/estimate";
import { formatDateFr, type ReservationInput } from "@/lib/reservation-schema";

const MODE_LABEL: Record<string, string> = {
  boutique: "wizard.summary.mode.shop",
  domicile: "wizard.mode.domicile",
};

const PAY_LABEL: Record<string, string> = {
  mtn: "MTN Mobile Money",
  moov: "Moov Money",
  celtiis: "Celtiis",
  especes: "wizard.summary.payment.cash",
};

/** Retrouve les pannes catalogue citées dans le texte libre pour estimer le coût. */
export function matchedFaults(deviceSlug: string, panne: string) {
  const device = deviceBySlug(deviceSlug);
  if (!device) return [];
  const text = panne.toLowerCase();
  return device.faults.filter((f) => text.includes(f.label.toLowerCase()));
}

type Props = {
  values: ReservationInput;
  onEdit: () => void;
  onConfirm: () => void;
  submitting: boolean;
  /** Dépôt immédiat (« venir maintenant ») : pas de créneau horaire. */
  immediate?: boolean;
  /** Reçoit le focus à l'arrivée sur l'étape récapitulative. */
  headingRef?: Ref<HTMLHeadingElement>;
};

/**
 * Page récapitulative du rendez-vous : appareil, marque, modèle, pannes
 * déclarées, mode de dépôt, estimation détaillée et créneau choisi — le tout
 * avant la soumission définitive.
 */
export function ReservationSummary({
  values,
  onEdit,
  onConfirm,
  submitting,
  immediate,
  headingRef,
}: Props) {
  const { t, locale } = useI18n();
  const device = deviceBySlug(values.appareil);
  const faults = matchedFaults(values.appareil, values.panne);
  const estimate = computeEstimate(faults);

  const rows = [
    {
      icon: Cpu,
      label: "wizard.summary.type",
      value: device?.category ? t(device.category) : t("wizard.summary.other"),
    },
    {
      icon: Tag,
      label: "wizard.summary.brand",
      value: device ? brandName(device.brand) : t("wizard.summary.tbd"),
    },
    {
      icon: Smartphone,
      label: "wizard.summary.model",
      value: device?.name ?? values.appareil,
    },
    {
      icon: MapPin,
      label: "wizard.summary.deposit",
      value: t(MODE_LABEL[values.mode] ?? values.mode),
    },
    {
      icon: Wallet,
      label: "wizard.summary.payment",
      value: t(PAY_LABEL[values.paiement] ?? values.paiement),
    },
  ];

  return (
    <div className="border border-border bg-card p-8">
      <span className="at-eyebrow mb-3 block">{t("wizard.summary.eyebrow")}</span>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="at-display text-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        {t("wizard.summary.title")}
      </h2>
      <p className="mt-3 text-sm text-muted-foreground">{t("wizard.summary.hint")}</p>

      {/* Créneau mis en avant */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border border-primary/40 bg-primary/5 p-5">
        <span className="flex items-center gap-3">
          <CalendarClock className="size-6 shrink-0 text-primary" strokeWidth={1.5} />
          <span>
            <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("wizard.summary.appointment")}
            </span>
            <span className="block text-lg font-bold">
              {immediate && !values.heure
                ? `${formatDateFr(values.date, locale)} · ${t("wizard.summary.immediate")}`
                : `${formatDateFr(values.date, locale)} · ${values.heure ? values.heure : t("wizard.period." + values.creneau)}`}
            </span>
          </span>
        </span>
        <span className="font-mono text-2xl font-bold text-primary">
          {estimate.total > 0 ? formatFcfa(estimate.total) : t("wizard.free.diagnosis")}
        </span>
      </div>

      <dl className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="flex gap-3 bg-card p-4">
            <r.icon className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.5} />
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {t(r.label)}
              </dt>
              <dd className="text-sm font-bold tracking-tight">{r.value}</dd>
            </div>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Pannes déclarées */}
        <div className="border border-border p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("wizard.summary.faults.title")}
          </p>
          {faults.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {faults.map((f) => (
                <li key={f.slug} className="flex items-center justify-between gap-4 text-sm">
                  <span className="flex items-center gap-2 font-semibold">
                    <Check className="size-3.5 text-primary" />
                    {t(f.label)}
                  </span>
                  <span className="font-mono text-xs text-primary">{formatFcfa(f.price)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">{t("wizard.summary.faults.none")}</p>
          )}
          <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
            {values.panne}
          </p>
        </div>

        {/* Estimation détaillée */}
        <EstimateBreakdown
          estimate={estimate}
          title={t("wizard.summary.estimate.title")}
          subtitle={estimate.total > 0 ? t("wizard.summary.estimate.subtitle") : null}
        />
      </div>

      <div className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-3">
        {[
          [t("wizard.summary.client"), values.nom],
          [t("wizard.summary.phone"), values.telephone],
          [t("wizard.summary.email"), values.email || "—"],
        ].map(([k, v]) => (
          <div key={k} className="bg-card p-4">
            <p className="font-mono text-[10px] uppercase text-muted-foreground">{k}</p>
            <p className="text-sm font-semibold">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
        <p className="font-mono text-xs uppercase text-muted-foreground">
          {t("wizard.summary.cost")} ·{" "}
          <span className="text-primary">
            {estimate.total > 0 ? formatFcfa(estimate.total) : t("wizard.summary.free.after.exam")}
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="technical" size="sm" onClick={onEdit}>
            <Pencil className="size-3.5" /> {t("wizard.summary.edit")}
          </Button>
          <Button
            type="button"
            variant="primaryBlock"
            size="sm"
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? t("wizard.summary.saving") : t("wizard.summary.confirm")}
          </Button>
        </div>
      </div>
    </div>
  );
}
