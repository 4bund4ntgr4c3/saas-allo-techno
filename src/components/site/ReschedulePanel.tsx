import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, Check, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSlotAvailability } from "@/hooks/useSlotAvailability";
import { useI18n } from "@/lib/i18n/context";
import {
  HOURS_BY_PERIOD,
  formatDateFr,
  isPastSlot,
  periodOfHour,
  slotHoursFor,
  toIsoDate,
  type DepositMode,
} from "@/lib/reservation-schema";
import { rescheduleReservation } from "@/lib/suivi.functions";

type Props = {
  reference: string;
  code?: string;
  mode: DepositMode;
  current: { date: string; hour: string | null };
  onDone: () => void;
};

/**
 * Panneau de reprogrammation : mêmes créneaux en temps réel que l'assistant de
 * réservation (jours ouverts selon les horaires du mode, heures déjà prises
 * barrées, mises à jour en direct via Realtime).
 * `code` est le code de suivi secret (requis côté public) ; en espace client
 * authentifié, l'authentification tient lieu de preuve de propriété.
 */
export function ReschedulePanel({ reference, code = "", mode, current, onDone }: Props) {
  const { t, locale } = useI18n();
  const submit = useServerFn(rescheduleReservation);
  const availability = useSlotAvailability(mode);
  const [date, setDate] = useState<string | null>(null);
  const [hour, setHour] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dateKeys = useMemo(
    () => [...availability.openDates.keys()].filter((k) => k >= toIsoDate(new Date())).sort(),
    [availability.openDates],
  );

  const availableHours = useMemo(() => {
    if (!date) return [];
    const weekday = new Date(`${date}T12:00:00`).getDay();
    const allowed = new Set(slotHoursFor(mode, weekday));
    return (availability.openDates.get(date) ?? [])
      .flatMap((s) => HOURS_BY_PERIOD[s.period])
      .filter((h) => allowed.has(h) && !isPastSlot(date, h));
  }, [date, mode, availability.openDates]);

  const confirm = async () => {
    if (!date || !hour) return;
    setSaving(true);
    try {
      await submit({
        data: { reference, code, date, creneau: periodOfHour(hour), heure: hour },
      });
      toast.success(t("reschedule.success"), {
        description: `${formatDateFr(date, locale)} à ${hour} — confirmation envoyée.`,
      });
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("reschedule.error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 border border-primary/40 bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <CalendarClock className="size-3.5 text-primary" strokeWidth={1.5} />
            {t("reschedule.title")} {reference}
          </p>
          <p className="mt-1 text-sm font-bold">
            {t("reschedule.current")} {formatDateFr(current.date, locale)}
            {current.hour ? ` à ${current.hour}` : ""}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onDone} disabled={saving}>
          {t("reschedule.close")}
        </Button>
      </div>

      <div className="mt-6 mb-2 flex items-center gap-2">
        <CalendarClock className="size-4 text-primary" strokeWidth={1.5} />
        <span id="rs-day-label" className="font-mono text-[10px] uppercase tracking-wider">
          {t("reschedule.newDay")}
        </span>
      </div>
      {availability.isLoading ? (
        <p role="status" className="text-xs text-muted-foreground">
          {t("reschedule.loading")}
        </p>
      ) : dateKeys.length === 0 ? (
        <p role="status" className="text-xs text-muted-foreground">
          {t("reschedule.noSlots")}
        </p>
      ) : (
        <div
          role="radiogroup"
          aria-labelledby="rs-day-label"
          className="flex flex-nowrap gap-2 overflow-x-auto pb-1"
        >
          {dateKeys.map((d) => {
            const on = date === d;
            const dt = new Date(`${d}T12:00:00`);
            return (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setDate(d);
                  setHour(null);
                }}
                className={`w-[76px] shrink-0 border p-3 text-center transition-colors ${
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-foreground"
                }`}
              >
                <span className="block font-mono text-[10px] uppercase">
                  {dt.toLocaleDateString(undefined, { weekday: "short" })}
                </span>
                <span className="block text-lg font-bold leading-tight">{dt.getDate()}</span>
                <span className="block font-mono text-[10px] uppercase">
                  {dt.toLocaleDateString(undefined, { month: "short" })}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6 mb-2 flex items-center gap-2">
        <Clock className="size-4 text-primary" strokeWidth={1.5} />
        <span className="font-mono text-[10px] uppercase tracking-wider">
          {t("reschedule.newTime")}
        </span>
      </div>
      {!date ? (
        <p className="text-xs text-muted-foreground">{t("reschedule.selectDay")}</p>
      ) : availableHours.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("reschedule.noHours")}</p>
      ) : (
        <div
          role="radiogroup"
          aria-label="Heure du nouveau rendez-vous"
          className="grid grid-cols-3 gap-2 sm:grid-cols-4"
        >
          {availableHours.map((h) => {
            const on = hour === h;
            const taken = availability.isHourTaken(date, h);
            return (
              <button
                key={h}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={taken}
                title={taken ? t("reschedule.taken") : undefined}
                onClick={() => setHour(h)}
                className={`border px-3 py-2 font-mono text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  taken
                    ? "border-border/50 line-through"
                    : on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-foreground"
                }`}
              >
                {h}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="font-mono text-xs uppercase text-muted-foreground">
          {date && hour ? `${formatDateFr(date, locale)} à ${hour}` : t("reschedule.selectSlot")}
        </p>
        <Button
          variant="primaryBlock"
          size="sm"
          disabled={!date || !hour || saving}
          onClick={() => void confirm()}
        >
          <Check className="size-3.5" />
          {t("reschedule.confirm")}
        </Button>
      </div>
    </div>
  );
}
